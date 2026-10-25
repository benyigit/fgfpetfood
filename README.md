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
