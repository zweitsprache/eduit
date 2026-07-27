# Eduit deployment

The monorepo contains two independently deployed Next.js projects.

| Project | Root directory | Production domain |
| --- | --- | --- |
| Eduit marketing | `apps/marketing` | `domain.com` and `www.domain.com` |
| Eduit app | `apps/app` | `app.domain.com` |

## Vercel projects

Import this GitHub repository twice in Vercel:

1. Create `eduit-marketing` with **Root Directory** `apps/marketing`.
2. Create `eduit-app` with **Root Directory** `apps/app`.
3. Keep the framework preset on Next.js for both projects.
4. Add `domain.com` and `www.domain.com` to the marketing project.
5. Add `app.domain.com` to the app project.
6. Redirect `www.domain.com` to `domain.com`.

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
```

The app project additionally needs the database, Neon Auth, Polar, and Tiptap
variables documented in `apps/app/.env.example`.

## Local development

Run the app and marketing site in separate terminals:

```text
npm run dev:app
npm run dev:marketing -- --port 3001
```

The product is then available on port 3000 and the public site on port 3001.

## Authentication boundary

Authentication remains owned by `app.domain.com`. Marketing calls to action
link to that hostname and the marketing project does not receive database,
billing, or authentication secrets.
