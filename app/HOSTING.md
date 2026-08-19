# Hosting Loo

Loo is a **static site** — once built it's just HTML, CSS and JS in a folder,
so it can go on any static host, most of them free. The database is Firebase,
which the browser talks to directly; there's still no server of your own to run.

> **Do [SETUP.md](./SETUP.md) first** if you want reviews shared between
> people. Without it the site deploys and works, but each visitor only sees
> their own reviews. And whichever host you pick, add the `VITE_FIREBASE_*`
> environment variables in its dashboard — they're read at **build** time, so
> set them *before* the build that goes live. On any non-Firebase host, also
> add your domain under Authentication → Settings → Authorized domains.

It also uses `HashRouter`, so URLs look like `yoursite.com/#/map`. That means
**no server rewrite rules are needed** — deep links work out of the box
everywhere, including GitHub Pages.

## Build it

```bash
cd app
npm install
npm run build
```

That produces a `dist/` folder. That folder *is* the website.

To check the built version locally before uploading:

```bash
npm run preview
```

---

## Option 1 — Firebase Hosting (best fit, since the database is already there)

`firebase.json` is already configured for it.

```bash
npm run build
npx firebase login
npx firebase deploy --only hosting --project lootest-dcf59
```

You get `https://lootest-dcf59.web.app` with HTTPS, and no extra step for
authorised domains or environment variables — the `.env` on your machine is
baked into the build. Redeploy with the same two commands.

## Option 2 — Netlify Drop (fastest if you'd rather not use the CLI)

No account or CLI needed to start.

1. Run `npm run build`.
2. Go to <https://app.netlify.com/drop>.
3. Drag the `app/dist` folder onto the page.

You get a live URL immediately (e.g. `random-name-123.netlify.app`). Sign in
to keep it permanently and rename it. To update later, drag the new `dist`
folder again.

## Option 3 — Vercel or Netlify, connected to Git (best for ongoing changes)

Push this repo to GitHub, then import it. Use these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | `app` |
| Build command | `npm run build` |
| Output directory | `dist` |

Every push to your main branch redeploys automatically.

- Vercel: <https://vercel.com/new>
- Netlify: <https://app.netlify.com/start>

## Option 4 — GitHub Pages (free, tied to your repo)

Add this workflow as `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: app
      - run: npm run build
        working-directory: app
      - uses: actions/upload-pages-artifact@v3
        with:
          path: app/dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

Then in the repo: **Settings → Pages → Source → GitHub Actions**. Your site
lands at `https://<user>.github.io/<repo>/`. The Vite config already sets
`base: './'`, so serving from a subpath works.

## Option 5 — Cloudflare Pages

<https://dash.cloudflare.com> → Workers & Pages → Create → Pages → connect
your repo. Build command `npm run build`, output directory `dist`, root
directory `app`.

---

## After it's live

**HTTPS is required** for two features, and every host above gives it free:

- **Geolocation** — the browser refuses to share location over plain HTTP.
- **Add to Home Screen** — the PWA manifest needs a secure origin.

**Installing it on a phone:** open the URL in the phone's browser, then

- **iPhone (Safari):** Share → *Add to Home Screen*
- **Android (Chrome):** ⋮ menu → *Install app* / *Add to Home screen*

It then launches full-screen with its own icon, like a native app.

**Custom domain:** all of these hosts let you point a domain at the site from
their dashboard, and issue the TLS certificate for you.

---

## Things worth knowing

- **Reviews are shared once Firebase is connected** (see SETUP.md). Your saved
  shortlist and theme settings stay per-browser by design.
- **Map tiles** come from CARTO's free basemap. It's fine for a demo or
  low-traffic site; if it gets popular, move to a paid tile plan (Mapbox,
  MapTiler, or CARTO) and swap the `TileLayer` URL in
  `src/screens/MapScreen.jsx`.
- **Attribution must stay.** OpenStreetMap and CARTO require the credit line
  shown under the map. Don't remove it.
- **The locations are starter data**, real Calgary places with approximate
  coordinates (`src/data/locations.js`). There are **no invented ratings** —
  every score comes from a real person using the app.
