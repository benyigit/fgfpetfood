# FGF Pet Food Bazaar

Next.js App Router + React + TypeScript storefront preview for FGF Pet Food Bazaar.

## Local development

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Production build and server:

```bash
npm run build
npm run start
```

The app is ready to connect to a Node.js hosting provider such as Vercel. The product catalog and newsletter are presentation previews; connect Shopify and a mailing-list provider before accepting orders or subscriptions.

The contact phone shown in the reference design is +1 (832) 555-0188.

## Interactive experiences

The Happy Box builder (`/#happy-box`) uses the shared `data/products.ts` catalog. Visitors select up to 3 or 6 items, save a text list or compose a price/availability inquiry. Selections persist in their browser. There are no invented prices or checkout requests. For Shopify, map these stable product IDs to real variant IDs and fetch current pricing and availability before enabling checkout.

Happy Tails (`/#happy-tails`) starts with clearly labelled brand scrapbook imagery. Visitors can filter and enlarge photos and compose a submission email. The optional photo preview stays on the device; the visitor attaches the photo manually in their email app. There is no server upload, automatic publication or review database. The team reviews incoming submissions before adding approved, consented stories to the gallery.
