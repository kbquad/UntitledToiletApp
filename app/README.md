# Loo — Calgary washroom finder

Find a clean public washroom near you in Calgary: a live map, real distances,
directions that open your phone's maps app, and cleanliness ratings written by
the people who actually used them.

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
- **Leaflet + OpenStreetMap** (CARTO basemap tiles) — no API key needed.
- **Firebase / Firestore** for shared washrooms, reviews and votes, with
  security rules doing the enforcement — see `firestore.rules`.
- **Zustand** for per-device preferences in `localStorage`, plus a live
  `watchPosition` subscription (`src/lib/geolocation.js`) mounted once at the
  app root.
- The whole palette derives from one hue via OKLCH, so the colour wheel in
  Settings recolours every surface — including the map — live.

### Where data lives

| Shared, in the database | Private, per browser |
| --- | --- |
| Washroom locations | Your saved shortlist |
| Reviews, ratings, scores | Theme colour and dark mode |
| "Found this helpful" votes | Distance units, display name |

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

## Editing the washroom list

`src/data/locations.js` is the source of truth. After changing it:

```bash
gcloud auth application-default login   # once per machine
npm run seed                            # pushes changes to Firestore
```

It merges, so existing reviews and scores are untouched.

Admin tooling authenticates with **Application Default Credentials** — there
are no service account key files anywhere in this repo. ADC resolves your
gcloud login locally, the attached service account on Google Cloud, and
Workload Identity Federation in CI.

## Caveats worth knowing

- **Locations are approximate.** Real Calgary places, coordinates placed at or
  near the landmark; not surveyed.
- **Opening hours are sample values**, but the logic is real — "Open right now"
  filters against them and the labels update through the day.
- **Geolocation needs HTTPS** (localhost counts). Your position is watched for
  as long as the app is open, so distances and sorting follow you as you move;
  if permission is denied they fall back to a fixed downtown point (Eau
  Claire). "Add a washroom" needs a real, current position — it pins the
  washroom where you are standing, so it won't submit from the fallback.
- **The human check on the review and submit forms is client-side**
  (`src/lib/captcha.js`): a generated question, a honeypot field and a
  minimum answering time. It stops ordinary form spam, not a script written
  against this app. Firebase App Check is the server-enforced version — see
  SETUP.md.
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
