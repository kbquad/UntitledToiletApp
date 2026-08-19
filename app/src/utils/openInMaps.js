// Hands a destination off to whatever mapping app the device actually uses:
// Apple Maps on iOS, the Android app chooser (Google Maps / Waze / …) via the
// geo: intent, and Google Maps in a new tab everywhere else.

const isIOS = () => {
  const ua = navigator.userAgent || '';
  // iPadOS 13+ reports as MacIntel, so check for touch points too.
  return /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isAndroid = () => /Android/.test(navigator.userAgent || '');

export const mapsUrlFor = (lat, lng, name) => {
  const label = encodeURIComponent(name);
  if (isIOS()) return `https://maps.apple.com/?daddr=${lat},${lng}&q=${label}`;
  if (isAndroid()) return `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
};

export const openInMaps = (lat, lng, name) => {
  const url = mapsUrlFor(lat, lng, name);
  // App-scheme URLs must navigate the current frame; https destinations open
  // in a new tab so the app isn't replaced.
  if (url.startsWith('geo:')) {
    window.location.href = url;
  } else {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = url; // popup blocked (e.g. embedded preview)
  }
};
