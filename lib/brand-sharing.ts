import 'server-only';
import { createHash } from 'node:crypto';
import { communityBrand, withStudioBrand, rows, one, transaction, type StudioBrand } from './community-db';
import { CommunityError, id, type Member } from './community';
import { getCMSDocument, validateContent, managedAssetIds } from './cms';
import type { AssetRow } from './cms-storage';
export const otherBrand: StudioBrand = ({quipaw:'fgfpetfood',fgfpetfood:'quipaw'} as const)[communityBrand];
export async function sharingAccess(actor: Member) {
  const target = await withStudioBrand(otherBrand, () => one<{id:string;name:string}>("SELECT id,name FROM users WHERE lower(email)=lower(?) AND role='admin'", [actor.email]));
  if (!target) throw new CommunityError(403, 'Your email needs administrator access on both brands to share content.');
  return target;
}
export async function syncBrandAssets(actor: Member) {
  await sharingAccess(actor);
  const assets = await withStudioBrand(otherBrand, () => rows<AssetRow>('SELECT * FROM cms_assets WHERE ready=1 ORDER BY created_at DESC LIMIT 1000'));
  if (assets.length) await transaction(assets.map(a => ({sql:'INSERT INTO cms_assets(id,pathname,type,name,content_type,size,ready,created_by,created_at) VALUES (?,?,?,?,?,?,1,?,?) ON CONFLICT(id) DO NOTHING',values:[a.id,a.pathname,a.type,a.name,a.content_type,Number(a.size),a.created_by,Number(a.created_at)]})));
  return { imported: assets.length, brand: otherBrand };
}
export async function copyPreview(documentId:string, actor:Member) {
  await sharingAccess(actor);
  const source = await getCMSDocument(documentId);
  if (source.kind === 'page') throw new CommunityError(400, 'Website pages stay specific to each brand.');
  const target = await withStudioBrand(otherBrand, () => one<{id:string;revision:number;draft:string}>('SELECT id,revision,draft FROM cms_documents WHERE kind=? AND slug=?',[source.kind,source.slug]));
  return {brand:otherBrand, sourceRevision:source.revision, targetRevision:target ? Number(target.revision) : null, targetTitle:target ? JSON.parse(target.draft).title : null};
}
export async function copyDocument(documentId:string, actor:Member, sourceRevision:unknown, targetRevision:unknown) {
  const targetActor = await sharingAccess(actor), source = await getCMSDocument(documentId);
  if (source.kind === 'page' || source.revision !== sourceRevision) throw new CommunityError(409, 'Save and reload the source before copying.');
  const content = validateContent(source.kind, source.draft);
  const origin = ({quipaw:'https://quipaw.vercel.app',fgfpetfood:'https://fgfpetfood.vercel.app'})[communityBrand];
  const rewrite = (value:unknown):unknown => typeof value === 'string' ? (value.startsWith('/assets/') ? origin + value : value) : Array.isArray(value) ? value.map(rewrite) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v)])) : value;
  const assetIds = managedAssetIds(content), assets:AssetRow[]=[];
  for (const assetId of assetIds) { const asset=await one<AssetRow>('SELECT * FROM cms_assets WHERE id=? AND ready=1',[assetId]); if (!asset) throw new CommunityError(400,'Complete all media uploads before copying.'); assets.push(asset); }
  return withStudioBrand(otherBrand, async()=>{
    const current=await one<{id:string;revision:number}>('SELECT id,revision FROM cms_documents WHERE kind=? AND slug=?',[source.kind,source.slug]);
    if ((current ? Number(current.revision) : null) !== targetRevision) throw new CommunityError(409,'The other brand changed. Review its latest version before copying.');
    const documentId=current?.id || createHash('sha1').update(communityBrand+':'+source.id).digest('hex'), mutation=id(), now=Date.now(), json=JSON.stringify(rewrite(content));
    const statements=assets.map(a=>({sql:'INSERT INTO cms_assets(id,pathname,type,name,content_type,size,ready,created_by,created_at) VALUES (?,?,?,?,?,?,1,?,?) ON CONFLICT(id) DO NOTHING',values:[a.id,a.pathname,a.type,a.name,a.content_type,Number(a.size),a.created_by,Number(a.created_at)]}));
    statements.push(current ? {sql:'UPDATE cms_documents SET draft=?,revision=revision+1,updated_at=?,mutation=? WHERE id=? AND revision=?',values:[json,now,mutation,documentId,Number(current.revision)]} : {sql:'INSERT INTO cms_documents(id,kind,slug,draft,published,revision,updated_at,published_at,mutation) VALUES (?,?,?,?,NULL,1,?,NULL,?) ON CONFLICT(kind,slug) DO NOTHING',values:[documentId,source.kind,source.slug,json,now,mutation]});
    statements.push({sql:'INSERT INTO cms_audit(id,document_id,user_id,actor_name,action,revision,created_at,snapshot) SELECT ?,id,?,?,?,revision,?,draft FROM cms_documents WHERE id=? AND mutation=?',values:[id(),targetActor.id,actor.name,'copy_from_'+communityBrand,now,documentId,mutation]});
    await transaction(statements);
    const saved=await one<{mutation:string}>('SELECT mutation FROM cms_documents WHERE id=?',[documentId]);
    if (saved?.mutation!==mutation) throw new CommunityError(409,'The other brand changed. Review before copying again.');
    return {brand:otherBrand,documentId,status:'draft'};
  });
}
