// Haversine distance in metres between two lat/lng points.
export const distanceMetres = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (m, units) => {
  if (units === 'Imperial') {
    const ft = Math.round(m * 3.28084);
    return ft < 1400 ? `${ft} ft` : `${(m / 1609.34).toFixed(m < 16000 ? 1 : 0)} mi`;
  }
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
};

export const formatWalk = (m) => (
  m > 8000 ? 'transit trip' : `${Math.max(1, Math.round(m / 80))} min walk`
);
