# Sonali Bank BEFTN & RTGS Form Studio

BEFTN/RTGS fund-transfer form entry and A4 print/PDF studio for Bandhu Kallyan Foundation. Built with React, TypeScript, Vite and Tailwind CSS. Form data is stored in the browser (`localStorage`); optional cross-device sync uses a Neon Postgres database through a Vercel serverless function.

## Run locally

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

The static output is written to `dist/`.

## Deployment

`.github/workflows/deploy-pages.yml` builds the app with `npm ci && npm run build` and publishes `dist/` to GitHub Pages on every push to `main` (and the active `arena/bb56c203-bill-voucher` branch).

Repository setting required once: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

`vite.config.ts` uses relative asset paths (`base: './'`) so the built app works from the GitHub Pages project subpath.

## Cross-device sync (Neon)

The **Sync** button in the app header opens a panel with two options:

1. **JSON Export / Import** — works immediately, no server needed.
2. **Cloud sync** — enter the same workspace code on every device. Data is pushed/pulled through the Vercel function in `api/state.js`, stored in a `app_state` table in Neon Postgres. The table is created automatically on first use.

### One-time Neon setup

Use either of these server-side configurations on the Vercel project:

1. **Connection string (preferred)** — create a free Postgres project at https://console.neon.tech, copy its pooled connection string, and set it as `DATABASE_URL`. Replace the placeholder value rather than adding a second variable.
2. **Neon API key only** — set `NEON_API_KEY` instead. The function discovers the first project/branch, requests a pooled connection URI from Neon's API at runtime, and caches it in the function instance. Optional `NEON_ORG_ID`, `NEON_PROJECT_ID`, `NEON_BRANCH`, `NEON_DATABASE`, and `NEON_ROLE` variables can pin the target.

Redeploy the project after changing environment variables.

The connection string and API key stay server-side only; they are never bundled into the GitHub Pages frontend. Anyone who knows a workspace code can read/write that workspace, so use a long, non-guessable code.
