# Eduit deployment

The monorepo contains three independently deployed Next.js projects.

| Project | Root directory | Production domain |
| --- | --- | --- |
| Eduit marketing | `apps/marketing` | `domain.com` and `www.domain.com` |
| Eduit app | `apps/app` | `app.domain.com` |
| Dazit library | `apps/dazit` | `www.dazit.io` |

## Vercel projects

Import this GitHub repository twice in Vercel:

1. Create `eduit-marketing` with **Root Directory** `apps/marketing`.
2. Create `eduit-app` with **Root Directory** `apps/app`.
3. Create `eduit-dazit` with **Root Directory** `apps/dazit`.
4. Keep the framework preset on Next.js for all projects.
4. Add `domain.com` and `www.domain.com` to the marketing project.
5. Add `app.domain.com` to the app project.
6. Add `www.dazit.io` to the Dazit project and redirect `dazit.io` to it.
7. Redirect `www.domain.com` to `domain.com`.

Vercel will provide the exact DNS records after each domain is attached. Apply
those records at the DNS provider rather than hard-coding provider-specific
values here.

## Environment variables

Marketing:

```text
NEXT_PUBLIC_SITE_URL=https://domain.com
NEXT_PUBLIC_APP_URL=https://app.domain.com
```

App:

```text
NEXT_PUBLIC_SITE_URL=https://domain.com
NEXT_PUBLIC_APP_URL=https://app.domain.com
DAZIT_BLOB_READ_WRITE_TOKEN=...
```

`DAZIT_BLOB_READ_WRITE_TOKEN` must point at the same Vercel Blob store used by
the Dazit project. The editor uses it when publishing PDFs, thumbnails, and
manifests to Dazit. If it is omitted, the editor falls back to
`BLOB_READ_WRITE_TOKEN` for local/single-store setups.

Dazit:

```text
NEXT_PUBLIC_DAZIT_URL=https://www.dazit.io
DATABASE_URL=postgresql://...
NEON_AUTH_BASE_URL=https://<your-neon-auth-host>/neondb/auth
NEON_AUTH_COOKIE_SECRET=...
BLOB_READ_WRITE_TOKEN=...
```

The app project additionally needs the database, Neon Auth, Polar, and Tiptap
variables documented in `apps/app/.env.example`.

## Local development

Run the app and marketing site in separate terminals:

```text
npm run dev:app
npm run dev:marketing -- --port 3001
npm run dev:dazit
```

The product is available on port 3000. Dazit uses port 3001 by default; start
marketing on another free port when running all three projects together.

## Authentication boundary

Marketing calls to action link to `app.domain.com` and the marketing project
does not receive database, billing, or authentication secrets. The app and
Dazit use the same Neon Auth project and user database. Configure compatible
cookie secrets and the intended cookie domain when sessions must cross their
production hostnames.

Enable email/password, email OTP, and Google in Neon Auth. Register the exact
Google callback URLs generated for local development, Vercel previews, and
`https://www.dazit.io`; do not store the Google client secret in this repository.
The Dazit auth success target is `/auth/continue`, which resumes a pending
same-origin PDF download and otherwise redirects to `/documents`.

Apply `apps/app/db/migrations/052_dazit_download_entitlements.sql` before
deploying the protected Dazit download route. Regular users receive three PDF
downloads per Europe/Zurich calendar day. Worksheet and answer-key PDFs each
consume one unit; authenticated administrators are exempt for publication QA.
The consumption ledger reserves entitlement sources for future Polar
subscriptions and purchased credits, but paid entitlement consumption is not
enabled yet.

Apply `apps/app/db/migrations/053_dazit_user_registration_profiles.sql` before
enabling Dazit registration. It stores separate first and last names, the
accepted terms version and timestamp, and the newsletter preference without
modifying Neon Auth's managed user schema.
