import { useEffect, useMemo } from 'react';
import { useStore, LOCATION_FRESH_MS } from '../store';
import { useDataStore } from '../dataStore';
import { FALLBACK_LOCATION } from '../data/locations';
import { decorateWashroom } from '../utils/decorate';
import { distanceMetres } from '../utils/geo';
import { isOpenNow } from '../utils/hours';

// The one place that answers "where are we measuring from?". It also says how
// much that answer is worth: a position from the device that arrived seconds
// ago is not the same thing as one left over from yesterday's session, and
// screens that pin data to a coordinate (Add a washroom) need to tell them
// apart.
export const useCurrentLocation = () => {
  const userLocation = useStore((s) => s.userLocation);
  const locationStatus = useStore((s) => s.locationStatus);

  return useMemo(() => {
    if (!userLocation) {
      return {
        lat: FALLBACK_LOCATION.lat,
        lng: FALLBACK_LOCATION.lng,
        label: FALLBACK_LOCATION.label,
        accuracy: null,
        at: null,
        fromDevice: false,
        live: false,
      };
    }

    const at = userLocation.at ?? 0;
    const live = locationStatus !== 'denied' && Date.now() - at <= LOCATION_FRESH_MS;

    return {
      lat: userLocation.lat,
      lng: userLocation.lng,
      label: live ? 'your current location' : 'where you last were',
      accuracy: userLocation.accuracy ?? null,
      at: at || null,
      fromDevice: true,
      live,
    };
  }, [userLocation, locationStatus]);
};

const featureOk = (w, filters, minClean) => {
  // An unrated washroom is unknown, not bad — but a minimum-rating filter is
  // an explicit request for proven-clean ones, so unrated drops out.
  if (minClean && (w.avgRating == null || w.avgRating < minClean)) return false;
  if (filters.wheelchair && !w.wheelchair) return false;
  if (filters.babyChange && !w.babyChange) return false;
  if (filters.genderNeutral && !w.genderNeutral) return false;
  if (filters.free && w.fee !== 'Free') return false;
  if (filters.noKey && w.needsKey) return false;
  if (filters.openNow && !isOpenNow(w.openFrom, w.openTo)) return false;
  return true;
};

// Loads the shared washroom list once, then derives the filtered/sorted views.
export const useWashroomData = () => {
  const units = useStore((s) => s.units);
  const filters = useStore((s) => s.filters);
  const minClean = useStore((s) => s.minClean);
  const radius = useStore((s) => s.radius);
  const sort = useStore((s) => s.sort);
  const location = useCurrentLocation();

  const washrooms = useDataStore((s) => s.washrooms);
  const status = useDataStore((s) => s.status);
  const error = useDataStore((s) => s.error);
  const loadWashrooms = useDataStore((s) => s.loadWashrooms);

  useEffect(() => { loadWashrooms(); }, [loadWashrooms]);

  const derived = useMemo(() => {
    const withDist = washrooms.map((w) => ({
      w, dist: distanceMetres(location.lat, location.lng, w.lat, w.lng),
    }));

    const mapPool = withDist
      .filter(({ w }) => featureOk(w, filters, minClean))
      .map(({ w, dist }) => decorateWashroom(w, dist, units));

    const nearby = mapPool.filter((w) => w.dist <= radius);

    const sorted = [...nearby].sort((a, b) => {
      if (sort === 'Cleanest') {
        // Unrated sink below rated, rather than counting as zero.
        if (a.rated !== b.rated) return a.rated ? -1 : 1;
        if (a.rated) return b.avgRating - a.avgRating;
        return a.dist - b.dist;
      }
      if (sort === 'Most reviewed') return b.reviewCount - a.reviewCount || a.dist - b.dist;
      return a.dist - b.dist;
    });

    const allDecorated = withDist.map(({ w, dist }) => decorateWashroom(w, dist, units));

    return { mapPool, nearby, sorted, allDecorated, location };
  }, [washrooms, units, filters, minClean, radius, sort, location]);

  return { ...derived, status, error, loading: status === 'loading' || status === 'idle' };
};

export const useWashroom = (id) => {
  const units = useStore((s) => s.units);
  const location = useCurrentLocation();
  const washrooms = useDataStore((s) => s.washrooms);
  const loadWashrooms = useDataStore((s) => s.loadWashrooms);

  useEffect(() => { loadWashrooms(); }, [loadWashrooms]);

  return useMemo(() => {
    const w = washrooms.find((x) => x.id === id);
    if (!w) return null;
    return decorateWashroom(w, distanceMetres(location.lat, location.lng, w.lat, w.lng), units);
  }, [id, washrooms, units, location]);
};

export const useReviews = (washroomId) => {
  const reviews = useDataStore((s) => s.reviewsByWashroom[washroomId]);
  const status = useDataStore((s) => s.reviewStatus[washroomId]);
  const loadReviews = useDataStore((s) => s.loadReviews);

  useEffect(() => {
    if (washroomId) loadReviews(washroomId);
  }, [washroomId, loadReviews]);

  return {
    reviews: reviews ?? [],
    loading: status === 'loading' || status === undefined,
    error: status === 'error',
  };
};
