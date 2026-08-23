// Finds washrooms that are the same place listed twice and removes the extras.
//
//   npm run dedupe                 # report only, changes nothing
//   npm run dedupe -- --apply      # actually delete the duplicates
//   npm run dedupe -- --metres=40  # how close counts as the same place
//
// Duplicates arrive two ways: the original hand-written Calgary list overlaps
// the OpenStreetMap import, and OSM itself sometimes carries a node and a way
// for one building.
//
// Two rules keep this safe. A washroom carrying reviews is never deleted —
// somebody's writing is attached to that document. And with everything else
// equal the OpenStreetMap copy wins, because that is the one a future import
// will keep updating.
import { resolveProjectId, connect, commitInBatches } from './lib/firestore-admin.mjs';

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const useEmulator = argv.includes('--emulator');
const metres = Number(argv.find((a) => a.startsWith('--metres='))?.split('=')[1] ?? 40);

const distanceMetres = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const projectId = resolveProjectId(argv);
if (!projectId) {
  console.error('Could not work out which Firebase project to check. Pass --project=your-project-id');
  process.exit(1);
}

const db = await connect({ projectId, useEmulator });

const snap = await db.collection('washrooms').get();
const all = snap.docs.map((d) => ({
  id: d.id,
  ref: d.ref,
  ...d.data(),
}));
console.log(`\n${all.length} washrooms to check, within ${metres} m of each other\n`);

// Bucket by a coarse grid so this is not an N² comparison across 13,000 docs.
// A cell is comfortably wider than the match radius, and each doc is compared
// against its own cell and the eight around it.
const CELL = 0.002; // ~220 m
const key = (lat, lng) => `${Math.floor(lat / CELL)}:${Math.floor(lng / CELL)}`;
const buckets = new Map();
for (const w of all) {
  if (typeof w.lat !== 'number' || typeof w.lng !== 'number') continue;
  const k = key(w.lat, w.lng);
  if (!buckets.has(k)) buckets.set(k, []);
  buckets.get(k).push(w);
}

const neighbours = (w) => {
  const latCell = Math.floor(w.lat / CELL);
  const lngCell = Math.floor(w.lng / CELL);
  const out = [];
  for (let a = -1; a <= 1; a += 1) {
    for (let b = -1; b <= 1; b += 1) {
      out.push(...(buckets.get(`${latCell + a}:${lngCell + b}`) ?? []));
    }
  }
  return out;
};

// Higher score survives.
const score = (w) => (
  (w.reviewCount > 0 ? 1_000_000 : 0)
  + (w.source === 'openstreetmap' ? 1000 : 0)
  + Math.min(String(w.name ?? '').length, 100)
);

const seen = new Set();
const doomed = [];
const kept = [];

for (const w of all) {
  if (seen.has(w.id) || typeof w.lat !== 'number') continue;

  const cluster = neighbours(w)
    .filter((o) => !seen.has(o.id) && distanceMetres(w.lat, w.lng, o.lat, o.lng) <= metres);
  if (cluster.length < 2) { seen.add(w.id); continue; }

  cluster.sort((a, b) => score(b) - score(a));
  const [winner, ...rest] = cluster;
  for (const c of cluster) seen.add(c.id);

  // Never delete something with reviews attached, even as a runner-up.
  const removable = rest.filter((r) => !(r.reviewCount > 0));
  const protectedOnes = rest.filter((r) => r.reviewCount > 0);

  if (removable.length) {
    kept.push(winner);
    doomed.push(...removable);
    console.log(`${winner.name}`);
    console.log(`  keep   ${winner.id} (${winner.source ?? 'curated'}${winner.reviewCount ? `, ${winner.reviewCount} reviews` : ''})`);
    for (const r of removable) console.log(`  remove ${r.id} (${r.source ?? 'curated'}) — ${r.name}`);
    for (const p of protectedOnes) console.log(`  kept anyway, has ${p.reviewCount} review(s): ${p.id}`);
  }
}

if (!doomed.length) {
  console.log('No duplicates found.\n');
  process.exit(0);
}

console.log(`\n${doomed.length} duplicate${doomed.length === 1 ? '' : 's'} across ${kept.length} place${kept.length === 1 ? '' : 's'}.`);

if (!apply) {
  console.log('\nNothing was changed. Re-run with --apply to delete them.\n');
  process.exit(0);
}

await commitInBatches(db, doomed, (batch, d) => batch.delete(d.ref));
console.log(`\nDeleted ${doomed.length} duplicates.\n`);
process.exit(0);
