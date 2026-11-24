# Sonali Bank BEFTN & RTGS Form Studio

BEFTN/RTGS fund-transfer form entry and A4 print/PDF studio for Bandhu Kallyan Foundation. Built with React, TypeScript, Vite and Tailwind CSS. All form data is stored locally in the browser (`localStorage`); no backend or API key is required.

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
