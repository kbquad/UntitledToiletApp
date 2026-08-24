// Ports the hue-driven OKLCH theme from the Loo Blush design prototype:
// the whole app's palette is derived from one hue picked on a colour wheel.

export const GREEN = '#5C9A78';
export const AMBER = '#C99A5B';
export const RED = '#C4707E';

// Ordered to match the swatch row in the design: blue first, then round the
// wheel through teal, green, orange, red, pink, purple.
export const PRESETS = [
  { name: 'Blue', hue: 258 },
  { name: 'Teal', hue: 196 },
  { name: 'Green', hue: 146 },
  { name: 'Orange', hue: 66 },
  { name: 'Coral', hue: 24 },
  { name: 'Blush', hue: 340 },
  { name: 'Purple', hue: 300 },
];

export const swatch = (h) => `oklch(70% 0.15 ${h})`;

export const hueName = (h) => {
  let best = PRESETS[0];
  let gap = 999;
  for (const p of PRESETS) {
    const d = Math.min(Math.abs(p.hue - h), 360 - Math.abs(p.hue - h));
    if (d < gap) { gap = d; best = p; }
  }
  return best.name;
};

export const makeTheme = (h, dark) => {
  // Surfaces are neutral. The design is black-and-grey with one colour in it,
  // and deriving the background from the hue too — which is what this used to
  // do — meant picking "blue" tinted the whole app blue-black rather than
  // colouring the parts you actually press.
  //
  // So the hue drives exactly two things: `ink`, the lighter tone used for
  // chips, icons and links, and `accent`, the stronger one under primary
  // buttons. Everything else is fixed.
  const c = (l, ch) => `oklch(${l}% ${ch} ${h})`;

  if (dark) {
    return {
      bg: '#0A0A0C',
      card: '#131418',
      hero: '#1A1C22',
      text: '#F2F2F5',
      body: '#C7C8D0',
      sub: '#8A8C97',

      ink: c(78, 0.13),
      accent: c(62, 0.19),
      onInk: '#0A0A0C',

      line: 'rgba(255,255,255,.08)',
      line2: 'rgba(255,255,255,.17)',
      tagBg: 'rgba(255,255,255,.06)',
      trackBg: 'rgba(255,255,255,.10)',
      fadeOut: 'rgba(10,10,12,0)',
      pinHalo: 'rgba(10,10,12,.9)',
      mapWater: '#0E1116',
      toastBg: '#F2F2F5',
      toastFg: '#0A0A0C',
    };
  }

  return {
    bg: '#F6F6F8',
    card: '#FFFFFF',
    hero: '#EDEEF2',
    text: '#14151A',
    body: '#3D3F48',
    sub: '#71737E',

    ink: c(52, 0.16),
    accent: c(56, 0.19),
    onInk: '#FFFFFF',

    line: 'rgba(0,0,0,.09)',
    line2: 'rgba(0,0,0,.17)',
    tagBg: 'rgba(0,0,0,.05)',
    trackBg: 'rgba(0,0,0,.10)',
    fadeOut: 'rgba(246,246,248,0)',
    pinHalo: 'rgba(255,255,255,.92)',
    mapWater: '#E7EAF0',
    toastBg: '#14151A',
    toastFg: '#F6F6F8',
  };
};

// Applies the theme + accent as CSS custom properties on :root so plain CSS
// (and Leaflet's DOM, which lives outside React) can read them too.
export const applyThemeVars = (theme, accent) => {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(`--t-${key}`, value);
  }
  root.style.setProperty('--accent', accent);
};

export const scoreColor = (v) => (
  v >= 4.3 ? { bg: 'rgba(92,154,120,.16)', fg: GREEN }
    : v >= 3.6 ? { bg: 'rgba(201,154,91,.18)', fg: AMBER }
      : { bg: 'rgba(196,112,126,.16)', fg: RED }
);

export const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
