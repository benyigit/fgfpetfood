export const SHARED_SHOPIFY_STORE = 'sn12b8-ng.myshopify.com';
export type ShopifyConnectionCheck = { configured: boolean; verified: boolean; message: string };
export type ShopifyAdminStatus = {
  expectedDomain: string;
  domain: string | null;
  domainMatches: boolean;
  adminUrl: string;
  checkedAt: number;
  storefront: ShopifyConnectionCheck & { hasProducts: boolean };
  admin: ShopifyConnectionCheck & { readProducts: boolean; writeProducts: boolean; shopName?: string };
  checkout: { verified: false; message: string };
};
export type ShopifyImportResult = { source: 'admin' | 'storefront'; imported: number; existing: number; total: number; message: string };
export type ShopifyDraftInput = { requestId: string; title: string; description: string; productType: string; vendor: string };
export type ShopifyDraftResult = { product: { id: string; title: string; handle: string; status: 'DRAFT'; adminUrl: string }; documentId?: string; warning?: string; message: string };
