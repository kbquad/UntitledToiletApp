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
  const c = (l, ch, a) => `oklch(${l}% ${ch} ${h}${a !== undefined ? ` / ${a}` : ''})`;
  if (dark) {
    return {
      bg: c(17, 0.022), card: c(23, 0.026), hero: c(31, 0.05), text: c(94, 0.02), body: c(80, 0.03), sub: c(64, 0.03),
      ink: c(79, 0.12), accent: c(72, 0.145), onInk: c(16, 0.03), line: 'rgba(255,255,255,.09)', line2: 'rgba(255,255,255,.2)',
      tagBg: 'rgba(255,255,255,.06)', trackBg: 'rgba(255,255,255,.1)', fadeOut: c(17, 0.022, 0), pinHalo: c(17, 0.022, 0.9),
      mapWater: 'oklch(20% 0.03 248)', mapLand: c(24, 0.03), mapStreet: c(33, 0.03), mapPark: 'oklch(26% 0.042 146)',
      mapBlock: 'rgba(255,255,255,.05)', mapHighway: 'oklch(34% 0.05 70)',
      mapLabel: c(60, 0.03), mapCity: c(86, 0.03), mapPlace: 'oklch(62% 0.05 146)', toastBg: c(94, 0.02), toastFg: c(17, 0.022),
    };
  }
  return {
    bg: c(97.4, 0.022), card: c(99.6, 0.006), hero: c(45, 0.09), text: c(26, 0.042), body: c(43, 0.036), sub: c(62, 0.03),
    ink: c(48, 0.12), accent: c(63, 0.15), onInk: c(98, 0.012), line: c(48, 0.12, 0.14), line2: c(48, 0.12, 0.28),
    tagBg: c(48, 0.12, 0.08), trackBg: c(48, 0.12, 0.13), fadeOut: c(97.4, 0.022, 0), pinHalo: 'rgba(255,255,255,.92)',
    mapWater: 'oklch(92% 0.032 238)', mapLand: c(96, 0.03), mapStreet: '#FFFFFF', mapPark: 'oklch(93% 0.045 143)',
    mapBlock: c(70, 0.05, 0.3), mapHighway: 'oklch(92% 0.06 72)',
    mapLabel: c(68, 0.03), mapCity: c(42, 0.055), mapPlace: 'oklch(70% 0.06 143)', toastBg: c(26, 0.042), toastFg: c(97.4, 0.022),
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
