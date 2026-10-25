import type { CMSDocument } from './cms-types';

export type SocialPlatform = 'facebook' | 'instagram';
export type AIStudioTone = 'friendly' | 'educational' | 'playful';
export type SocialDraftStatus = 'draft' | 'publishing' | 'published' | 'failed' | 'uncertain';
export type SocialDraftInput = { platform: SocialPlatform; caption: string; mediaSrc: string; mediaAlt: string; sourceProductId?: string };
export type SocialDraft = SocialDraftInput & {
  id: string; revision: number; status: SocialDraftStatus; createdAt: number; updatedAt: number;
  publishedAt: number | null; publishedUrl: string; error: string; generated: boolean;
};
export type SocialHistory = { id: string; draftId: string; action: string; actorName: string; createdAt: number; detail: string };
export type AIConnectionState = { configured: boolean; verified: boolean; accountId: string; missing: string[]; note: string };
export type AIStudioStatus = {
  ai: { configured: boolean; model: string; missing: string[] };
  facebook: AIConnectionState; instagram: AIConnectionState;
  mediaPolicy: string; supported: { facebook: string[]; instagram: string[] };
};
export type AIGenerateInput = {
  target: 'blog' | 'social'; productId: string; topic: string; tone: AIStudioTone;
  instructions: string; platform?: SocialPlatform; requestId: string;
};
export type AIGenerateResult = { document?: CMSDocument; draft?: SocialDraft; warnings: string[] };
/** Every mutation is admin-only and same-origin. Generate never publishes. */
// GET  /api/admin/ai/status -> AIStudioStatus
// POST /api/admin/ai/generate AIGenerateInput -> AIGenerateResult
// GET  /api/admin/social -> { drafts: SocialDraft[], history: SocialHistory[] }
// POST /api/admin/social SocialDraftInput & {requestId:string} -> {draft: SocialDraft}
// PATCH /api/admin/social/[id] SocialDraftInput & {revision:number} -> {draft: SocialDraft}
// POST /api/admin/social/[id]/publish {revision:number,requestId:string,accountId:string,confirm:true,rightsConfirmed:true} -> {draft: SocialDraft}
// POST /api/admin/social/[id]/refresh {} -> {draft: SocialDraft}; read-only Meta reconciliation, never publishes.
// mediaSrc must be empty or a ready image from /api/media/<id>. Publishing requires that asset already appears in published CMS content.
// An uncertain result is locked against automatic retries to prevent duplicate external posts.
