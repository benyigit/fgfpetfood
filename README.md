# FGF Pet Food Bazaar

Next.js App Router + React + TypeScript storefront with product galleries, a treat bag, blog, events and community accounts.

## Local development

Requires Node.js 24 or newer.

```bash
npm install
npm run dev
```

Production build and server:

```bash
npm run build
npm run start
```

## Shopify catalog and checkout

Flow: product detail → select a pack → add to treat bag → review live prices → create a Shopify cart → open the checkout URL returned by Shopify. Payment, shipping, taxes, discounts and order processing are handled by the merchant's Shopify store.

Configure these server-only environment variables in Vercel Production, then deploy again:

- `SHOPIFY_STORE_DOMAIN`: permanent `*.myshopify.com` domain, without a path.
- `SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN`: private Storefront API token from Shopify's Headless channel.
- Alternatively, `SHOPIFY_STOREFRONT_ACCESS_TOKEN` accepts a public Storefront API token. A private token takes precedence if both are present.

Never prefix a private token with `NEXT_PUBLIC_`, commit it, or paste it into a URL. Private requests originating from Vercel forward the platform-provided buyer IP. Requests use Storefront API `2026-10` and current uncached prices/availability.

### Merchant setup

1. The store owner installs Shopify's free Headless channel. A collaborator may need additional permissions to install the channel, even with Apps and channels access.
2. Create a storefront for this site and configure product-listing and cart read/write access. Product-tag read access is optional when explicit product mappings or exact handles are available.
3. Publish the intended active products to the Headless channel. Set actual prices, inventory and available shipping destinations in Shopify.
4. Add the Storefront token to this Vercel project and redeploy.
5. Confirm the live product → bag → checkout flow, including product names, pack quantities, currency and shipping availability. Opening checkout does not confirm that payment processing is configured; the merchant must confirm that separately.

### Product matching

`data/shopify-product-map.json` stores mappings verified against the merchant's Shopify product IDs, scoped to the store domain. Explicit mappings take precedence, followed by `catalog:<local-id>` tags, then exact handles. Product names are never used for fuzzy matching. Shopify handles remain valid aliases, while existing local URLs and package documentation are preserved.

Products without a verified published Shopify match remain browseable and can be saved to the bag, but cannot be purchased. No price, stock or variant ID is invented. A saved pick can upgrade automatically only when its matched product has exactly one variant; ambiguous or deleted variants require a new selection.

The bag rechecks price and availability before checkout. Changed prices require review. The server rejects malformed quantities, partial carts and Shopify cart warnings instead of silently dropping items.

### Connection state

Without a valid Storefront token, the site keeps its documented local catalog and clearly marks online checkout as unavailable. The presence of integration code alone does not mean the merchant store is ready for sales. A password-protected Online Store also blocks direct cart permalinks, so those are not used as a fallback.

Official setup: https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started

## Community and local previews

Community accounts and photo uploads use the configured Neon database and private Vercel Blob storage. Website publication and brand social-media permission are separate opt-in choices. See `COMMUNITY.md` for implementation and operation details.

This public release is English only. Turkish preview dictionaries and language controls are maintained only in the separate local preview checkout.

Contact phone: 281-301-0010.


## Brand studio / content management

Open `/admin` and sign in with a brand account explicitly assigned the `admin` role. Registration always creates a member; a community moderator is not automatically a site administrator. Each deployment uses its own server-owned database namespace and media path, so granting Quipaw access does not grant FGF access. A trusted database operator must promote the exact verified account after owner approval. No email address has automatic administrator rights.

The studio provides:

- Products: website titles, descriptions, package details, images, videos and search metadata. Shopify continues to own product IDs, variants, prices, stock and checkout. Use New product to create an actual Shopify draft when Admin product access is connected. Import / sync products brings Shopify products into the studio without overwriting saved editorial drafts.
- Blog and Events: create content, edit sections and media, save drafts, preview, publish, or unpublish. Existing addresses stay fixed to preserve links. Event details have separate pages, back navigation and SEO metadata.
- Website pages: named home, footer and contact sections, including headings and image/video replacements.
- Media library: still JPG, PNG, WebP or AVIF up to 10 MB; MP4/WebM up to 100 MB. Cloud uploads use a private Blob store and a short-lived, single-file upload URL issued by the existing server's OIDC credentials. No store credentials are sent to the browser. Uploaded media is readable publicly only while referenced by published content. Local development uses private local files instead.
- Inbox: contact submissions saved by `Send mail`, read/unread status and reversible archiving. A reply button opens the administrator's email app. The studio does not send outbound email or forward inbox messages to an external mailbox.

Changes are saved as drafts first; publishing updates the public page. Concurrent edits return a conflict instead of silently overwriting another session. Publishing and saving are recorded in an audit trail. Unpublishing keeps the draft. On configured database outages, the CMS does not fall back to previously removed content.

### Storage and deployment

The existing `DATABASE_URL` (or `POSTGRES_URL`) and private `BLOB_STORE_ID` / Vercel OIDC connection are used. Existing `BLOB_READ_WRITE_TOKEN` installations remain supported. Namespaced `cms_documents`, `cms_audit`, `cms_assets`, `cms_asset_refs` and `cms_inbox` tables are created idempotently. Contact forms require no SMTP service. Set `SITE_URL` when the final brand domain replaces the current Vercel domain; this controls canonical URLs and the dynamic sitemap. `/admin`, `/account`, `/cart` and `/api` are excluded from search indexing. A future admin subdomain can route to the same protected application; it is not configured by this release.

Public releases remain English only. The separate local bilingual preview is not a deployment source.


## Website previews and product management

The editor’s private preview renders the same components, styles, navigation and footer as the public website. Blog, event, product and named website-page drafts update without publishing. Desktop (1280px) and mobile (390px) viewports can be expanded. The iframe is protected by the exact administrator role; unsaved content travels only through same-origin, source-checked, channel-bound messages. Preview submissions, purchase actions and external navigation are blocked. The real public product uses live Shopify variant data; previewing a draft never changes price or stock.

Products now includes a connection check, New product and Import / sync products. Both sites are configured for the shared merchant store `sn12b8-ng.myshopify.com`. A Shopify collaborator account is separate from the app credentials used by these servers:

- Storefront access reads active products published to the Headless storefront and creates the shopper’s checkout cart.
- Admin API access with `read_products` imports the store’s catalog; `write_products` also permits creation of Shopify drafts.
- New product creates a Shopify DRAFT and an editorial draft for this website. Finish variants, prices, inventory and product activation in Shopify, and publish to Headless before sale.
- Import preserves existing editorial content. Shopify price and availability are read live by the storefront.
- Both websites lead to the same Shopify order system. Browser bags on the separate brand domains remain separate.

Connection checks are read-only and never create an order or charge. A successful product read does not verify payment methods, shipping destinations, tax setup, or the complete checkout flow. Do not announce live sales until those settings and a separately authorized checkout check have been completed.

## AI studio and social drafts

The AI studio creates editable blog or social drafts using a selected CMS product as source material. Blog drafts open in the normal editor with the full website preview. Social drafts have an editable caption, a media picker, a platform preview and saved publication state. Manual social drafts work without an AI connection.

AI generation requires server-only `OPENAI_API_KEY` and `OPENAI_MODEL`. These credentials are not stored in browser state or sent to visitors. Generation uses the Responses API and never publishes. A model draft must still be reviewed for accuracy and brand voice.

Facebook and Instagram are separate destinations. The initial publisher supports Facebook Page text/single-photo posts and Instagram professional-account single JPEG posts. Videos, Reels, automatic schedules and cross-platform batch posting are not enabled. The administrator reviews the actual account reference, caption and media, confirms publication rights, and chooses Publish now. Saved server configuration is distinguished from a verified platform response.

Connect the appropriate Meta app, Facebook Page and linked professional Instagram account, then configure the documented server environment values in `.env.example`. Meta may require app review and business verification for client-account publishing. Business Suite login alone is not an API integration. Use each brand’s own authorized destination account.

Only ready images from the brand’s CMS media library that already appear in published website content can be published by this initial social flow. Community member images are excluded; their separate website/social consent workflow remains authoritative. Credentials stay on the server. Revision checks and durable publication attempts prevent accidental duplicate retries; ambiguous platform responses are marked for review instead of reported as a successful post.

No live AI request, merchant-product mutation or social post is made by deployment. The owner/developer must provide the actual connections before those actions become available.
