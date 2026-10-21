# Community accounts and photo permissions

## Production

Connect a dedicated Neon Postgres database and a **Private** Vercel Blob store to the production project. The integration supplies `DATABASE_URL` (or `POSTGRES_URL`) and `BLOB_STORE_ID`. Blob uses Vercel OIDC; a server-only `BLOB_READ_WRITE_TOKEN` also works. Redeploy after connecting. Do not prefix credentials with `NEXT_PUBLIC_`.

The API initializes its own tables on first use. Each brand has a fixed server-owned table and blob-path namespace. Accounts, sessions and permissions are separate between the brands, even with shared infrastructure. A private local SQLite store remains available for local previews. Do not upload `.community` or local environment files.

Passwords are salted and hashed with scrypt. Sessions use random HTTP-only secure cookies and stored token hashes, expire after seven days, and are checked for every protected action. Same-origin writes, database-backed rate limits, ownership checks, limited upload sizes, and image re-encoding protect the upload flow. No email verification or email password-reset service is configured; this account does not authenticate a Shopify checkout.

## Member controls

Every photo starts with two unchecked, independent choices: website gallery and organic brand social media. Saving with both unchecked keeps the image private. Giving only social permission makes it available to the brand team, not to anonymous gallery visitors. The team can never grant permission on a member's behalf.

Changes are saved with scope, exact consent text, version and timestamp. Withdrawing website consent immediately blocks public image access and removes the feed entry. Social withdrawal blocks future team access unless website consent remains, removes social download controls, and appears in the team's withdrawal list. Earlier social posts require manual removal by the team; reposts by other people cannot be automatically recalled.

Deleting a photo revokes both choices before deleting its blob and clears the dog name/caption. A minimal photo reference and permission history remain to identify social withdrawals. Private storage is never served through a public bucket URL. Original EXIF metadata is removed.

## Brand team access

1. The intended operator creates an ordinary account on the correct live site.
2. They provide their **Account reference** from their own signed-in profile to the site administrator. Do not grant a role based on an unverified email address alone.
3. In the database console, the authorized administrator assigns that exact account ID:

```sql
UPDATE quipaw_users SET role = 'moderator' WHERE id = 'CONFIRMED_ACCOUNT_REFERENCE';
```

For FGF use `fgfpetfood_users`. Do not copy roles between brands. Role assignments are never accepted from a registration request or client-supplied fields.

4. The operator can use `/account/community` to view authorized photos, download photos with active social consent, hide/unhide permitted website photos, and action social withdrawals. The moderation link appears in their account when their role is assigned.

The dashboard shows the latest 100 authorized photos and latest 100 withdrawal events. The underlying consent history remains in the database. Photos are capped at 20 per member; mobile originals up to 8 MB are compressed before the serverless request.


## Inline scrapbook composer
The home-page share button opens a native dialog with a live polaroid preview. Authentication happens inside the dialog without losing the photo or story. New memories store a title and a category (cosy/outdoors/funny). Existing memories retain their original permissions and use the community category until they have a category. Additive, idempotent database migrations preserve existing accounts/photos. Public cards use only consented, visible, non-deleted entries. Website and brand social permissions remain independent and default to false. Consent receipts use sharing-v3 with the exact brand-specific text.
