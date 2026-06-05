# Notion Crafts

A best-in-class, **frontend-only** library of customizable widgets and icons for
Notion. Tune a widget live in the Studio, copy one embed link, paste it into a
page. No account, no backend, no database — personalization is encoded in the
URL and favorites live in `localStorage`.

> Specimen Edition — a type-foundry / swatch-book design system: paper, ink, one
> bold vermilion, an editorial display serif set large against monospace specs.

## What's inside

- **Widget Studio (the hero)** — a live preview rendered inside an original mock
  docs page, with controls for theme, any-hex accent, font, size and per-widget
  options. A sticky copy bar generates the embed URL.
- **7 live widgets** — World Clock, Countdown, Focus Timer, Weather, Daily Quote,
  Habit Streak, Month Calendar. Everything ticks for real; nothing is a screenshot.
- **36 recolorable icons** in four styles (outline / filled / duotone / gradient),
  with a global accent control that recolors the whole grid instantly.
- **Curated packs**, **Pricing**, favorites, full light/dark, and a tasteful
  hosted-checkout-style Pro unlock (simulated, stored on-device).

## Tech stack

- **[Astro](https://astro.build)** (static output) for the shell.
- **React 18** island — the whole interactive app mounts client-side via
  `client:only`.
- Plain CSS design system in `src/styles/global.css`.
- Deploys to any static host (Cloudflare Pages / Vercel / Netlify / GitHub Pages).

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # static build → dist/
npm run preview  # serve the production build
```

## Deploy

Hosted on AWS (private S3 bucket → CloudFront with OAC) at
**https://notioncrafts.com**. One script builds, uploads, and invalidates the CDN:

```bash
./deploy.sh             # build + upload + invalidate CloudFront
./deploy.sh --no-build  # deploy the current dist/ without rebuilding
./deploy.sh --dry-run   # preview file changes, upload nothing
```

Uses the `dhiraj-aws-acct` AWS profile (override with `AWS_PROFILE=…`). Infra:
bucket `notioncrafts-web`, distribution `EA3NYFPNNXPHL`, Route 53 zone for
`notioncrafts.com`.

## Project structure

```
src/
  pages/index.astro          # page shell, fonts, no-flash theme script
  pages/e/[widget].astro     # standalone embed page (one per widget) — what Notion iframes
  components/NotionCrafts.jsx # the full React app (data, widgets, galleries, studio)
  components/Embed.jsx        # chrome-less renderer: reads URL params -> one <Widget>
  styles/global.css          # the Specimen Edition design system
infra/
  icon-function.js           # CloudFront Function: renders /i/<icon>.svg?c&s at the edge
  rewrite-function.js        # CloudFront Function: directory-index rewrite for the S3 origin
public/favicon.svg
```

## Embed & icon URLs

The Studio's copy bar produces working links against this site's own origin:

- **Widgets** — `https://notioncrafts.com/e/<widget>?theme&accent&font&size&…` is a
  real, chrome-less page (`pages/e/[widget].astro` + `Embed.jsx`) that reads the
  config from the query and renders a single live widget. Paste it into Notion via
  `/embed`.
- **Icons** — `https://notioncrafts.com/i/<icon>.svg?c=<hex>&s=<style>` is rendered
  on demand by a **CloudFront Function** at the edge (`infra/icon-function.js`) — any
  hex color, any style, no origin server. Use it straight as a Notion page icon.

A second CloudFront Function (`infra/rewrite-function.js`) maps subpaths like
`/e/clock` → `/e/clock/index.html`, since the private S3 (REST/OAC) origin does no
directory-index resolution on its own.

## Roadmap

- Split the single-island SPA into per-widget/per-icon static *catalog* pages for long-tail SEO.
- Wire live data into widgets client-side (e.g. Open-Meteo for Weather).
- Real hosted checkout (Gumroad / Lemon Squeezy / Stripe Payment Links) for Pro.

---

The previous version was a Flask app (`app.py`, `templates/`, `static/`,
`data_files/`) deployed on EC2 + nginx + gunicorn. Those files are kept for
reference and can be removed once this revamp is live.
