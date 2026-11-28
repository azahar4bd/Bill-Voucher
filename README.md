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

## BEFTN and RTGS original PDF forms

The bundled templates in `public/templates/` are one-page working copies of the user's supplied `HO All Fund.pdf`: BEFTN page 1 and RTGS page 4. Existing FreeText annotations containing the old example data were removed from these copies; the underlying scanned form artwork and its original 612 × 792 pt page size are retained. The supplied PDF itself is not modified. Current entry data is drawn on a fresh copy in the browser. For **Print** and **Save as PDF**, 28pt of blank space on each side is cropped from that copy and the form is enlarged to fit A4 with 5mm margins. The direct print path is rasterized; downloads retain the original-resolution form. If browser printing is blocked in an iframe, the same print-ready A4 PDF is downloaded instead. Other sheets retain their existing print layouts.

Coordinates are defined in `src/utils/sonaliTemplatePdf.ts` and apply only to these specific templates. Very long values are reduced in size to fit their original blanks. `public/fonts/HindSiliguri-Regular.ttf` is used for Bengali field values under the accompanying SIL Open Font License. Run `npm test` to verify generated PDFs, field content, long values, and Bengali font embedding.

## Deployment

`.github/workflows/deploy-pages.yml` builds the app with `npm ci && npm run build` and publishes `dist/` to GitHub Pages on every push to `main` (and the active `arena/bb56c203-bill-voucher` branch).

Repository setting required once: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

`vite.config.ts` uses relative asset paths (`base: './'`) so the built app works from the GitHub Pages project subpath.

## Cross-device sync (Neon)

The **Sync** button in the app header opens a panel with two options:

1. **JSON Export / Import** — works immediately, no server needed.
2. **Cloud sync (auto)** — enter the same workspace code once on every device. After that, every local save is pushed automatically after a short delay, and new data from another device is pulled and reloaded automatically (also on page load, tab focus, and every minute). Manual **এখনই পাঠান / এখনই আনুন** buttons remain available. Data goes through the Vercel function in `api/state.js`, stored in an `app_state` table in Neon Postgres. The table is created automatically on first use. The Sync button shows a small status dot: grey = no code set, amber = syncing, red = failed, green = up to date.

### One-time Neon setup

Use either of these server-side configurations on the Vercel project:

1. **Connection string (preferred)** — create a free Postgres project at https://console.neon.tech, copy its pooled connection string, and set it as `DATABASE_URL`. Replace the placeholder value rather than adding a second variable.
2. **Neon API key only** — set `NEON_API_KEY` instead. The function discovers the first project/branch, requests a pooled connection URI from Neon's API at runtime, and caches it in the function instance. Optional `NEON_ORG_ID`, `NEON_PROJECT_ID`, `NEON_BRANCH`, `NEON_DATABASE`, and `NEON_ROLE` variables can pin the target.

Redeploy the project after changing environment variables.

The connection string and API key stay server-side only; they are never bundled into the GitHub Pages frontend. Anyone who knows a workspace code can read/write that workspace, so use a long, non-guessable code. When two devices edit at the same time, the most recent save wins.
