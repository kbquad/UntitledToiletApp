// Starter washroom locations for Calgary.
//
// These are real places with approximate coordinates — close enough for a
// city-scale map, not GPS-surveyed. They deliberately carry NO ratings,
// scores or reviews: all of that comes from real people using the app and
// lives in the database. A washroom nobody has reviewed simply has no score.
//
// This list is what `npm run seed` loads into Firestore — after editing it,
// re-run that to push the changes up.

// Areas the map can fly to, with a rough centre point for each.
export const AREAS = [
  { name: 'Downtown', lat: 51.0480, lng: -114.0650 },
  { name: 'East Village', lat: 51.0452, lng: -114.0470 },
  { name: 'Beltline', lat: 51.0360, lng: -114.0760 },
  { name: 'Kensington', lat: 51.0570, lng: -114.0910 },
  { name: 'Bridgeland', lat: 51.0530, lng: -114.0350 },
  { name: 'Inglewood', lat: 51.0380, lng: -114.0300 },
  { name: 'Mission', lat: 51.0320, lng: -114.0700 },
  { name: 'Marda Loop', lat: 51.0150, lng: -114.0920 },
  { name: 'University', lat: 51.0770, lng: -114.1400 },
  { name: 'North', lat: 51.0950, lng: -114.1000 },
  { name: 'West', lat: 51.0700, lng: -114.1700 },
  { name: 'South', lat: 50.9800, lng: -114.0700 },
  { name: 'Northeast', lat: 51.0600, lng: -113.9800 },
];

export const CALGARY_CENTER = { lat: 51.0486, lng: -114.0708 };

// Used for distances until the browser shares a real location.
export const FALLBACK_LOCATION = { lat: 51.0509, lng: -114.0658, label: 'Eau Claire, Downtown Calgary' };

// openFrom / openTo are decimal hours (9.5 = 9:30 AM). openTo may run past 24
// for places closing after midnight (25 = 1 AM). 0–24 means always open.
const w = (
  id, name, type, neighbourhood, lat, lng,
  fee, needsKey, wheelchair, babyChange, genderNeutral, openFrom, openTo,
) => ({
  id, name, type, neighbourhood, lat, lng,
  fee, needsKey, wheelchair, babyChange, genderNeutral, openFrom, openTo,
});

export const WASHROOMS = [
  // ── Downtown ──
  w('eauclaire', 'Eau Claire Market Plaza', 'Waterfront', 'Downtown', 51.0509, -114.0658, 'Free', false, true, true, true, 0, 24),
  w('princesisland', "Prince's Island Park Pavilion", 'Park', 'Downtown', 51.0528, -114.0605, 'Free', false, true, true, false, 7, 21),
  w('centrallib', 'Central Library, Level 2', 'Library', 'Downtown', 51.0466, -114.0524, 'Free', false, true, true, true, 9.5, 20),
  w('stephenave', 'Stephen Avenue Walk', 'Plaza', 'Downtown', 51.0470, -114.0672, '25¢', false, true, false, false, 7, 21),
  w('calgarytower', 'Calgary Tower Base', 'Landmark', 'Downtown', 51.0447, -114.0631, 'Free', false, true, true, true, 9, 21),
  w('bowvalleysq', 'Bow Valley Square Food Court', 'Mall', 'Downtown', 51.0479, -114.0660, 'Free', false, true, false, true, 7, 18),
  w('chinatown', 'Chinatown Cultural Centre', 'Community centre', 'Downtown', 51.0523, -114.0644, 'Free', false, true, false, true, 9, 20),
  w('devonian', 'Devonian Gardens, CORE', 'Mall', 'Downtown', 51.0463, -114.0688, 'Free', false, true, true, true, 9, 21),
  w('municipal', 'Municipal Building Atrium', 'Civic', 'Downtown', 51.0452, -114.0578, 'Free', false, true, true, true, 8, 16.75),
  w('olympicplaza', 'Olympic Plaza', 'Plaza', 'Downtown', 51.0455, -114.0611, 'Free', false, true, false, false, 6, 23),
  w('shawmillennium', 'Shaw Millennium Park', 'Park', 'Downtown', 51.0472, -114.0928, 'Free', false, false, false, false, 7, 22),

  // ── East Village ──
  w('studiobell', 'Studio Bell, National Music Centre', 'Landmark', 'East Village', 51.0450, -114.0524, 'Paid entry', false, true, true, true, 10, 17),
  w('stpatricks', "St. Patrick's Island Park", 'Park', 'East Village', 51.0464, -114.0428, 'Free', false, true, true, false, 6, 23),
  w('riverwalk', 'RiverWalk Plaza', 'Waterfront', 'East Village', 51.0448, -114.0480, 'Free', false, true, false, false, 0, 24),

  // ── Beltline ──
  w('17thave', '17th Ave Uptown', 'Café', 'Beltline', 51.0378, -114.0784, 'Customers only', true, false, false, true, 7, 22),
  w('beltlineaq', 'Beltline Aquatic & Fitness Centre', 'Community centre', 'Beltline', 51.0333, -114.0784, 'Free', false, true, true, true, 6, 21.5),
  w('barbscott', 'Barb Scott Park', 'Park', 'Beltline', 51.0330, -114.0839, 'Free', false, false, false, false, 7, 21),
  w('erltonlrt', 'Erlton / Stampede LRT Station', 'Transit', 'Beltline', 51.0375, -114.0528, 'Free', false, true, false, false, 5, 25),
  w('bmocentre', 'BMO Centre, Stampede Park', 'Landmark', 'Beltline', 51.0365, -114.0545, 'Free', false, true, true, true, 9, 22),
  w('connaught', 'Connaught Park', 'Park', 'Beltline', 51.0400, -114.0845, 'Free', false, false, false, false, 7, 21),

  // ── Kensington ──
  w('kensingtonvillage', 'Kensington Village', 'Market', 'Kensington', 51.0578, -114.0916, 'Free', false, true, true, true, 10, 19),
  w('rileypark', 'Riley Park Fieldhouse', 'Park', 'Kensington', 51.0555, -114.0968, 'Free', false, true, true, false, 7, 21),
  w('peacebridge', 'Peace Bridge Plaza', 'Waterfront', 'Kensington', 51.0524, -114.0723, 'Free', false, false, false, false, 0, 24),
  w('louiseriley', 'Louise Riley Library', 'Library', 'Kensington', 51.0568, -114.0930, 'Free', false, true, true, true, 10, 20),
  w('saitcampus', 'SAIT Campus Centre', 'Community centre', 'Kensington', 51.0645, -114.0885, 'Free', false, true, true, true, 7, 22),

  // ── Bridgeland ──
  w('bridgelandriverside', 'Bridgeland Riverside Park', 'Park', 'Bridgeland', 51.0554, -114.0396, 'Free', false, false, false, false, 7, 21),
  w('murdochpark', 'Murdoch Park', 'Park', 'Bridgeland', 51.0575, -114.0330, 'Free', false, false, false, false, 7, 21),
  w('calgaryzoo', 'Calgary Zoo — Destination Africa', 'Park', 'Bridgeland', 51.0447, -114.0247, 'Paid entry', false, true, true, true, 9, 17),
  w('renfrewaq', 'Renfrew Aquatic Centre', 'Community centre', 'Bridgeland', 51.0585, -114.0430, 'Free', false, true, true, true, 6, 21),

  // ── Inglewood ──
  w('birdsanctuary', 'Inglewood Bird Sanctuary', 'Park', 'Inglewood', 51.0344, -114.0270, 'Free', false, false, false, false, 7, 21),
  w('bowhabitat', 'Pearce Estate Park — Bow Habitat', 'Park', 'Inglewood', 51.0421, -113.9883, 'Free', false, true, true, false, 6, 22),
  w('ninthave', '9th Avenue Inglewood Village', 'Café', 'Inglewood', 51.0392, -114.0323, 'Customers only', true, false, false, true, 7, 18),
  w('ramsayhall', 'Ramsay Community Hall', 'Community centre', 'Inglewood', 51.0360, -114.0450, 'Free', false, true, false, true, 9, 21),

  // ── Mission ──
  w('lindsaypark', 'Lindsay Park — Repsol Sport Centre', 'Community centre', 'Mission', 51.0294, -114.0653, 'Free', false, true, true, true, 5.5, 22),
  w('missionplaza', '4th Street Mission Plaza', 'Café', 'Mission', 51.0349, -114.0755, 'Customers only', true, false, false, true, 7, 21),

  // ── Marda Loop ──
  w('mardaloophall', 'Marda Loop Community Hall', 'Community centre', 'Marda Loop', 51.0192, -114.1013, 'Free', false, true, true, true, 8, 21),
  w('sandybeach', 'River Park — Sandy Beach', 'Park', 'Marda Loop', 51.0128, -114.0946, 'Free', false, false, false, false, 7, 21),
  w('britanniaplaza', 'Britannia Plaza', 'Café', 'Marda Loop', 51.0125, -114.0790, 'Customers only', true, false, false, true, 7, 19),

  // ── University ──
  w('macewanhall', 'MacEwan Hall, University of Calgary', 'Community centre', 'University', 51.0780, -114.1300, 'Free', false, true, true, true, 7, 22),
  w('marketmall', 'Market Mall — Centre Court', 'Mall', 'University', 51.0805, -114.1520, 'Free', false, true, true, true, 10, 21),
  w('foothillshosp', 'Foothills Medical Centre', 'Civic', 'University', 51.0655, -114.1330, 'Free', false, true, true, true, 0, 24),
  w('udistrict', 'University District Plaza', 'Plaza', 'University', 51.0760, -114.1450, 'Free', false, true, true, true, 8, 22),

  // ── North ──
  w('nosehill', 'Nose Hill Park — 64 Ave Lot', 'Park', 'North', 51.1055, -114.1090, 'Free', false, false, false, false, 6, 23),
  w('confedpark', 'Confederation Park', 'Park', 'North', 51.0754, -114.0870, 'Free', false, true, true, false, 7, 21),
  w('crowfoot', 'Crowfoot Crossing', 'Mall', 'North', 51.1180, -114.2050, 'Free', false, true, true, true, 10, 21),

  // ── West ──
  w('bownesspark', 'Bowness Park Pavilion', 'Park', 'West', 51.0813, -114.1926, 'Free', false, true, true, false, 7, 21),
  w('bowmontpark', 'Bowmont Park Trailhead', 'Park', 'West', 51.0866, -114.1571, 'Free', false, false, false, false, 7, 21),
  w('edworthy', 'Edworthy Park', 'Park', 'West', 51.0570, -114.1560, 'Free', false, true, true, false, 6, 23),
  w('winsport', 'WinSport, Canada Olympic Park', 'Landmark', 'West', 51.0850, -114.2140, 'Free', false, true, true, true, 9, 21),
  w('westbrook', 'Westbrook Mall & LRT', 'Transit', 'West', 51.0380, -114.1290, 'Free', false, true, false, false, 5, 25),

  // ── South ──
  w('chinookcentre', 'Chinook Centre — Food Court', 'Mall', 'South', 51.0021, -114.0752, 'Free', false, true, true, true, 10, 21),
  w('heritagepark', 'Heritage Park Main Gate', 'Landmark', 'South', 50.9850, -114.1040, 'Free', false, true, true, true, 9.5, 17),
  w('southcentre', 'Southcentre Mall', 'Mall', 'South', 50.9585, -114.0655, 'Free', false, true, true, true, 10, 21),
  w('fishcreek', 'Fish Creek Park — Bow Valley Ranch', 'Park', 'South', 50.9200, -114.0250, 'Free', false, true, true, false, 6, 23),
  w('glenmore', 'Glenmore Reservoir — Weaselhead', 'Park', 'South', 50.9850, -114.1300, 'Free', false, false, false, false, 6, 23),
  w('deerfootmeadows', 'Deerfoot Meadows', 'Mall', 'South', 50.9720, -114.0300, 'Free', false, true, true, false, 10, 21),

  // ── Northeast ──
  w('marlborough', 'Marlborough Mall', 'Mall', 'Northeast', 51.0570, -113.9760, 'Free', false, true, true, false, 10, 21),
  w('elliston', 'Elliston Park', 'Park', 'Northeast', 51.0360, -113.9550, 'Free', false, false, false, false, 7, 22),
  w('internationalave', 'International Avenue (17 Ave SE)', 'Plaza', 'Northeast', 51.0410, -113.9750, 'Free', false, true, false, false, 8, 20),
  w('yyc', 'YYC Calgary International Airport', 'Transit', 'Northeast', 51.1225, -114.0130, 'Free', false, true, true, true, 0, 24),
];

export const FEATURES = [
  { key: 'wheelchair', label: 'Wheelchair accessible', sub: 'Step-free entry and a wide stall' },
  { key: 'babyChange', label: 'Baby change table', sub: 'Inside or beside the stalls' },
  { key: 'genderNeutral', label: 'Gender-neutral option', sub: 'At least one all-gender room' },
  { key: 'free', label: 'Free to use', sub: 'No fee, no purchase needed' },
  { key: 'openNow', label: 'Open right now', sub: 'Based on posted hours' },
  { key: 'noKey', label: 'No key or code needed', sub: 'Walk straight in' },
];

export const REVIEW_TAGS = ['Spotless', 'Well stocked', 'No smell', 'Short wait', 'Dry floor', 'Needs attention'];
export const TYPES = ['Park', 'Mall', 'Café', 'Transit', 'Library', 'Community centre'];
export const REVIEW_FILTERS = ['Most recent', 'Most helpful', 'Good reviews', 'Bad reviews', 'Highest rated'];
