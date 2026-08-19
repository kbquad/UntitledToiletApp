# Making Loo a real, shared site with Firebase

The code is finished, but with no database attached it runs in **demo mode** —
reviews stay in whoever's browser wrote them.

This connects it to **Firebase** (free Spark plan, no credit card) so everyone
sees everyone's reviews.

**You have to do the account steps yourself** — I can't create accounts or
deploy on your behalf. About 20 minutes, and your side is all copy-and-paste.

---

## Step 1 — Create the Firebase project (4 min)

1. Go to <https://console.firebase.google.com> → **Create a project**.
2. Name it (this guide assumes **LooTest**, project ID `lootest-dcf59`).
   Google Analytics is optional — **skip it**, it's not used here.
3. Wait for it to finish provisioning.

## Step 2 — Create the database (2 min)

1. Left sidebar → **Build → Firestore Database** → **Create database**.
2. Location: **nam5 (United States)** or `northamerica-northeast1` — closest to
   Calgary. *You cannot change this later.*
3. When asked for a starting mode, pick **Start in production mode** (locked
   down). We replace the rules in Step 4 anyway.

## Step 3 — Turn on anonymous sign-in (1 min)

The app gives every visitor an invisible account so the database can tell
"your review" from "someone else's" — no signup screen, but real security.

**Build → Authentication** → **Get started** → **Sign-in method** tab →
**Anonymous** → toggle **Enable** → **Save**.

> Skip this and posting a review fails with a permissions error.

## Step 4 — Register the web app and get your config (3 min)

1. **⚙ Project settings** → scroll to **Your apps** → click the **web icon
   `</>`**.
2. Nickname `lootest-web`. **Don't** tick Firebase Hosting yet. **Register app**.
3. It shows a `firebaseConfig` object. Keep that page open.
4. In `app/`, create your `.env` file:

   ```bash
   cp .env.example .env
   ```

5. Copy the values across:

   ```
   VITE_FIREBASE_API_KEY=AIzaSy...              ← paste apiKey
   VITE_FIREBASE_AUTH_DOMAIN=lootest-dcf59.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=lootest-dcf59
   VITE_FIREBASE_APP_ID=1:123...:web:abc...      ← paste appId
   VITE_FIREBASE_STORAGE_BUCKET=lootest-dcf59.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123...      ← paste messagingSenderId
   ```

> These are **meant to be public** — every Firebase web app ships them in its
> JavaScript. What protects your data is `firestore.rules`, not secrecy.

## Step 5 — Publish the security rules (2 min)

This is the important one: it's what stops anyone with your config from
editing other people's reviews or vandalising the map.

```bash
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project lootest-dcf59
```

(`lootest-dcf59` is your project ID, from Step 4.)

Prefer clicking? **Firestore Database → Rules**, paste the contents of
`firestore.rules`, **Publish**. If you do it that way you must also add the
index by hand: **Firestore → Indexes → Single field → Add exemption** →
collection `reviews`, field `authorId`, enable **Collection group** scope
ascending. The CLI command above does both for you.

## Step 6 — Load the washroom locations (3 min)

Seeding writes 60 published washrooms, which the security rules deliberately
forbid the browser from doing. So it runs from your machine with admin rights.

There are **no key files to download**. Authentication uses Application
Default Credentials, so you sign in once as yourself and the tooling picks
that up. (This project also has `iam.disableServiceAccountKeyCreation`
enforced, which blocks service account JSON keys outright — ADC is the
supported path, and the safer one regardless.)

1. Install the gcloud CLI if you haven't:
   <https://cloud.google.com/sdk/docs/install>

2. Sign in — a browser window opens; this is a one-time thing per machine:

   ```bash
   gcloud auth application-default login
   gcloud auth application-default set-quota-project lootest-dcf59
   ```

3. Seed:

   ```bash
   npm run seed
   ```

You should see `✓ 60 washrooms created`. It's safe to re-run; it updates names
and hours without touching anyone's reviews.

The account you signed in with needs permission to write to Firestore —
`roles/datastore.user` is enough, and Owner or Editor also work. If you
created the project, you already have this.

Check it: **Firestore Database → Data** → `washrooms` has 60 documents, each
with `reviewCount: 0`. Zero is correct — ratings come from real people.

## Step 7 — Run it

```bash
npm run dev
```

The "Demo mode" banner should be gone. That's how you know it's live.

**The real test:** post a review, then open the site in a private window. If
you can see the review you just wrote, it's genuinely shared.

---

## Putting it online

Firebase Hosting is the natural fit since you're already here:

```bash
npm run build
npx firebase deploy --only hosting --project lootest-dcf59
```

That gives you `https://lootest-dcf59.web.app`, with HTTPS included —
which **geolocation and Add-to-Home-Screen both require**.

Netlify, Vercel and Cloudflare all work too — see [HOSTING.md](./HOSTING.md).
On those, set the same `VITE_FIREBASE_*` values in the host's environment
variables. They're read at **build** time, so add them *before* the build that
goes live.

> One extra step for any non-Firebase host: **Authentication → Settings →
> Authorized domains → Add domain**, and add your site's domain. Otherwise
> sign-in is refused and nobody can post.

---

## Automated deploys (GitHub Actions)

`.github/workflows/deploy.yml` builds, runs the security-rule tests, and
deploys on every push to `main`.

It authenticates with **Workload Identity Federation** — GitHub mints a
short-lived OIDC token that Google exchanges for credentials. **No key is
stored as a repository secret**, which is what the
`iam.disableServiceAccountKeyCreation` policy requires.

The one-time `gcloud` commands to create the identity pool and the
`loo-deployer` service account are in the comment block at the top of that
workflow file. After running them, set three repository *variables* (Settings
→ Secrets and variables → Actions → **Variables**, not Secrets — these are
identifiers, not credentials):

| Variable | Value |
| --- | --- |
| `GCP_PROJECT_ID` | `lootest-dcf59` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/github` |
| `GCP_SERVICE_ACCOUNT` | `loo-deployer@lootest-dcf59.iam.gserviceaccount.com` |

Plus the `VITE_FIREBASE_*` values, which are baked into the browser bundle at
build time and are public by design.

## Running on Google Cloud

If you later add a Cloud Function or Cloud Run service (for example to
recompute scores server-side — see *Known limitation* below), **do not ship a
credential with it**. Attach a service account to the resource and grant it
only the roles it needs:

```bash
gcloud run deploy loo-jobs \
  --project lootest-dcf59 \
  --service-account loo-jobs@lootest-dcf59.iam.gserviceaccount.com
```

The Admin SDK picks that identity up through ADC automatically — the same
`initializeApp({ credential: applicationDefault(), projectId })` used by the
seed script works unchanged locally, in CI, and on Cloud Run.

---

## Developing without touching real data

The Firebase emulator gives you a throwaway local copy:

```bash
npm run emulators        # terminal 1
npm run seed:emulator    # terminal 2, once
```

Then add `VITE_FIREBASE_EMULATOR=true` to `.env` and `npm run dev`. Nothing
you do there touches your live project.

Run the security-rule tests against it any time:

```bash
npm run test:rules       # 37 checks
```

## What's shared vs. what stays on the device

| Shared, in Firestore | Private, per browser |
| --- | --- |
| Washroom locations | Your saved shortlist |
| Reviews and ratings | Theme colour, dark mode |
| Cleanliness scores | Distance units |
| "Found this helpful" votes | Your display name |

## Moderating

New washrooms people submit are saved with `status: "pending"` and stay off
the map until you approve them: **Firestore → Data → `washrooms`** → open the
document → change `status` to `published`.

To remove an abusive review: open `washrooms/{id}/reviews` and delete the
document. One caveat — because the score is a stored running total, deleting a
review by hand leaves `reviewCount` / `ratingSum` / `cleanVotes` on the parent
washroom slightly high. Adjust those three numbers on the washroom document at
the same time, or have the author delete their own review through the app,
which keeps the totals in step automatically.

## Costs

The free Spark plan gives 50,000 document reads and 20,000 writes per day.
Loading the map is 1 read per washroom (60), and opening a washroom is a
handful more. That comfortably covers hundreds of daily visitors. Firebase
will not charge you on Spark — it stops serving instead of billing.

## Known limitation, stated plainly

Cleanliness scores are kept as running totals on each washroom document,
updated by the browser inside a transaction. The security rules cap how much a
single write can move them (±1 review, ±5 rating points), so nobody can jump a
score to 5.0 in one shot — but a determined person could still nudge it by
repeating writes.

Closing that properly needs server-side code (a Cloud Function recomputing
totals on each review write), which requires the **Blaze** pay-as-you-go plan.
For a community app this is a reasonable trade; if it ever matters, that's the
upgrade path.

## Troubleshooting

**"Demo mode" banner won't go away** — the `.env` values aren't reaching the
build. Names must start with `VITE_`, and you must restart `npm run dev`.

**"Anonymous sign-in is turned off"** — Step 3.

**"Missing or insufficient permissions"** — the rules aren't published. Redo
Step 5.

**The list is empty** — the seed hasn't run, or it went to a different
project. Check Firestore → Data.

**"No Application Default Credentials found"** — run
`gcloud auth application-default login`, then
`gcloud auth application-default set-quota-project lootest-dcf59`.

**"Permission denied" or "PERMISSION_DENIED" when seeding** — you're signed in,
but that account can't write to Firestore in this project. It needs
`roles/datastore.user` (Owner and Editor also work). Check who you are with
`gcloud auth application-default print-access-token` and
`gcloud config get-value account`.

**"Your application has authenticated using end user credentials... quota
project"** — run `gcloud auth application-default set-quota-project lootest-dcf59`.

**"The query requires an index"** on the profile screen — the collection-group
index from Step 5 is missing. The error links straight to a "create it" button;
click that, or re-run the CLI deploy.

**Works locally, not on the deployed site** — add your domain under
Authentication → Settings → Authorized domains.
