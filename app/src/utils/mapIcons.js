import L from 'leaflet';

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Score-badge pin. A washroom nobody has reviewed shows a small neutral dot
// instead of a number, so unrated never reads as poorly-rated.
export const pinIcon = (washroom, { saved, cardColor, unratedColor }) => {
  const color = washroom.rated ? washroom.scoreFg : unratedColor;
  const label = washroom.rated
    ? `<div style="padding:4px 9px 5px;border-radius:11px;background:${color};color:#FFFFFF;font-size:12px;font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,.28);white-space:nowrap;border:${saved ? `2px solid ${cardColor}` : '0'}">${escapeHtml(washroom.scoreText)}</div>`
    : `<div style="padding:3px 8px 4px;border-radius:10px;background:${cardColor};color:${color};font-size:10.5px;font-weight:600;box-shadow:0 3px 10px rgba(0,0,0,.2);white-space:nowrap;border:1.5px solid ${color}">New</div>`;

  return L.divIcon({
    className: 'loo-pin',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
        ${label}
        <div style="width:2px;height:${washroom.rated ? 13 : 10}px;background:${color};opacity:.8"></div>
        <div style="width:7px;height:7px;border-radius:50%;background:${color};box-shadow:0 0 0 3px rgba(255,255,255,.85)"></div>
      </div>
    `,
    iconSize: [60, 46],
    iconAnchor: [30, 46],
  });
};

export const youAreHereIcon = (ink) => L.divIcon({
  className: 'loo-you-are-here',
  html: `
    <div style="position:relative;width:20px;height:20px">
      <div style="position:absolute;inset:0;border-radius:50%;background:${ink};animation:looPulse 2.4s ease-out infinite"></div>
      <div style="position:absolute;inset:3px;border-radius:50%;background:${ink};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
