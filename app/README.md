# Loo — Canadian washroom finder

Find a clean public washroom near you, anywhere in Canada: a live map, real
distances, directions that open your phone's maps app, and cleanliness ratings
written by the people who actually used them.

**There is no seeded review data.** Every score in the app comes from a real
person rating a real visit. A washroom nobody has reviewed shows "New", not a
made-up number.

Implements the design in `../project/Loo Blush.dc.html` — see `../README.md`
and `../chats/chat1.md` for the original brief.

## Run it

```bash
npm install
npm run dev
```

Out of the box it runs in **demo mode**: it works fully, but reviews stay in
your own browser and a banner says so.

## Make it real

**[SETUP.md](./SETUP.md)** — attach a free Firebase database (~20 min) so
reviews are shared by everyone.
**[HOSTING.md](./HOSTING.md)** — put it online (~5 min, free).

## How it's built

- **React + Vite**, `HashRouter` so any static host works with no rewrite rules.
- **Leaflet + OpenStreetMap** (CARTO basemap tiles, retina) — no API key needed.
- **Washroom locations come from OpenStreetMap**, imported into Firestore and
  fetched a region at a time — see "Where the washrooms come from" below.
- **Firebase / Firestore** for shared washrooms, reviews and votes, with
  security rules doing the enforcement — see `firestore.rules`.
- **Zustand** for per-device preferences in `localStorage`, plus a live
  `watchPosition` subscription (`src/lib/geolocation.js`) mounted once at the
  app root. Location itself is never persisted — see below.
- The whole palette derives from one hue via OKLCH, so the colour wheel in
  Settings recolours every surface — including the map — live.

### Where data lives

| Shared, in the database | Private, per browser | Never stored at all |
| --- | --- | --- |
| Washroom locations | Your saved shortlist | Your location |
| Reviews, ratings, scores | Theme colour and dark mode | |
| "Found this helpful" votes | Distance units, display name | |

### Cookies

None. The app sets no cookies of its own — verified by reading
`document.cookie` and the browser's cookie jar after a full session. What it
does use:

| What | Where | Why |
| --- | --- | --- |
| `loo-preferences` | localStorage | Theme, units, saved list, display name |
| `loo-demo-data` | localStorage | Demo mode only — reviews with no database attached |
| `firebaseLocalStorageDb` | IndexedDB | Your anonymous Firebase session |
| `firebase-heartbeat-database` | IndexedDB | Firebase SDK's own usage heartbeat |

One caveat, and it is not ours: with reCAPTCHA configured, Google's script
sets a `_GRECAPTCHA` cookie on its own domain. That is a third-party cookie
from google.com, not something this app writes.

### Identity

No usernames or passwords. Each browser gets an anonymous Firebase auth
session, which gives Firestore a `request.auth.uid` it can trust — that's what
lets the rules enforce "you can only edit your own review" without a login
screen.

## Checks

```bash
npm run lint
npm run emulators     # terminal 1: local Firestore + Auth
npm run test:rules    # terminal 2: 37 checks against firestore.rules
```

`test:rules` runs the real rules against the real emulator and asserts that
forged writes are actually rejected — posting as someone else, editing another
person's review, inflating a score, publishing a washroom straight onto the
map.

## Where the washrooms come from

Public toilets tagged in **OpenStreetMap** (`amenity=toilets`), imported into
Firestore province by province:

```bash
npm run import:osm                      # all of Canada
npm run import:osm -- --regions=ON,BC   # just these
npm run import:osm -- --dry-run         # fetch and map, write nothing
```

Re-running is safe: documents are keyed by OSM id, so an import updates a
washroom rather than duplicating it, and `merge` leaves earned scores alone.

Duplicates are inevitable where the old curated list overlaps OpenStreetMap,
or where OSM carries both a node and a way for one building:

```bash
npm run dedupe                 # report only, changes nothing
npm run dedupe -- --apply      # delete the extras
```

A washroom carrying reviews is never deleted; otherwise the OpenStreetMap copy
wins, since that is the one future imports keep updating.

To start over — **this deletes every washroom and review, permanently**:

```bash
npm run wipe -- --confirm=DELETE-EVERYTHING
```

Both can be run from GitHub instead of your machine: Actions → **Data** →
Run workflow. That path already has credentials and does not need a local
`gcloud` login.

`src/data/locations.js` still holds a small Calgary list, but only as the demo
fixture used when no Firebase config is present. `npm run seed` pushes it.

### Loading a region at a time

Fetching every washroom would mean ~20,000 documents per visitor and a day's
free Firestore quota gone in two page loads. Instead the country is divided
into a grid (`src/utils/region.js`) and the app fetches the 3×3 block of cells
around wherever you are or are looking. Cells already fetched are never fetched
again, so results accumulate as you explore. The bounding-box query needs the
composite index in `firestore.indexes.json`.

### Honest gaps

OpenStreetMap is community-maintained: dense downtown, thin in rural areas, and
occasionally wrong. Most entries carry no opening hours, so they are stored as
always-open and flagged `hoursKnown: false` — the app shows "Hours not known"
rather than claiming 24 hours, and the "Open right now" filter excludes them
because they cannot prove they are open.

Admin tooling authenticates with **Application Default Credentials** — there
are no service account key files anywhere in this repo. ADC resolves your
gcloud login locally, the attached service account on Google Cloud, and
Workload Identity Federation in CI.

## Caveats worth knowing

- **Locations are as accurate as OpenStreetMap is.** Community-contributed,
  not surveyed.
- **Most opening hours are unknown** and shown as such; the logic is real for
  the ones that are recorded.
- **Geolocation needs HTTPS** (localhost counts). Your position is watched for
  as long as the app is open, so distances and sorting follow you as you move;
  if permission is denied they fall back to downtown Toronto, labelled as such.
  "Add a washroom" needs a real, current position — it pins the washroom where
  you are standing, so it won't submit from the fallback.
- **Your location is never stored.** It lives in memory for the session, is
  asked for each time the app opens, and is dropped when you close it. The
  browser will not re-prompt once you have allowed the site — that part is
  the browser's to decide, not ours.
- **Posting is protected by reCAPTCHA v3**, carried by Firebase App Check
  (`src/lib/firebase.js`). It is invisible — nothing to solve — and Google
  verifies the token before Firestore accepts the write. Needs
  `VITE_RECAPTCHA_SITE_KEY` plus enforcement turned on in the console; without
  either, the app runs unprotected. See SETUP.md.
- **Attribution must stay.** OpenStreetMap and CARTO require the credit line
  under the map.
- **Submitted washrooms are held for review** (`status: "pending"`) so the map
  can't be vandalised; approve them in the Firebase console.
- **Scores are running totals updated by the client** inside a transaction,
  with the rules bounding how far one write can move them. Fully tamper-proof
  totals need a Cloud Function (Blaze plan) — see SETUP.md.

## Installing on a phone

Once hosted over HTTPS, open the site and use *Add to Home Screen* (iOS
Safari) or *Install app* (Android Chrome). It launches full-screen with its
own icon via `public/manifest.webmanifest`.
