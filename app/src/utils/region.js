// The app used to fetch every published washroom on startup. That is fine for
// sixty of them in one city and impossible for a country: twenty thousand
// documents per visitor would burn a day's free Firestore quota in two page
// loads, and nobody needs a washroom in Halifax while standing in Vancouver.
//
// So the map is divided into a grid, and we fetch the block of cells around
// wherever the user is looking. A cell already fetched is never fetched again.

// 0.25° is about 28 km north-south, and 16-19 km east-west at Canadian
// latitudes. A three-by-three block around you is therefore roughly 80 km
// tall — further than anyone walks, close enough to stay small.
export const CELL_DEGREES = 0.25;

// How many cells out from the centre one to fetch. 1 = a 3×3 block.
const RING = 1;

const cellIndex = (value) => Math.floor(value / CELL_DEGREES);

export const cellKeyFor = (lat, lng) => `${cellIndex(lat)}:${cellIndex(lng)}`;

// The bounding box covering the block of cells centred on this point. Latitude
// is clamped; longitude is not wrapped, so a box spanning the antimeridian
// would be wrong — irrelevant for Canada, and the alternative is two queries
// for a case that never happens here.
export const regionBox = (lat, lng) => {
  const latCell = cellIndex(lat);
  const lngCell = cellIndex(lng);
  return {
    minLat: Math.max(-90, (latCell - RING) * CELL_DEGREES),
    maxLat: Math.min(90, (latCell + RING + 1) * CELL_DEGREES),
    minLng: Math.max(-180, (lngCell - RING) * CELL_DEGREES),
    maxLng: Math.min(180, (lngCell + RING + 1) * CELL_DEGREES),
  };
};

// Every cell key the box above covers, so one fetch can mark all of them done.
export const coveredCellKeys = (lat, lng) => {
  const latCell = cellIndex(lat);
  const lngCell = cellIndex(lng);
  const keys = [];
  for (let dLat = -RING; dLat <= RING; dLat += 1) {
    for (let dLng = -RING; dLng <= RING; dLng += 1) {
      keys.push(`${latCell + dLat}:${lngCell + dLng}`);
    }
  }
  return keys;
};

export const inBox = (w, box) => (
  w.lat >= box.minLat && w.lat <= box.maxLat
  && w.lng >= box.minLng && w.lng <= box.maxLng
);
