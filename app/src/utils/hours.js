// Opening hours are stored as decimal hours (9.5 = 9:30 AM). openTo may run
// past 24 for places closing after midnight (25 = 1 AM); 0–24 means always open.

const nowDecimalHours = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};

export const isAlwaysOpen = (from, to) => from === 0 && to === 24;

export const isOpenNow = (from, to, now = nowDecimalHours()) => {
  if (isAlwaysOpen(from, to)) return true;
  if (to > 24) return now >= from || now < to - 24; // wraps past midnight
  return now >= from && now < to;
};

export const formatHour = (h) => {
  const wrapped = ((h % 24) + 24) % 24;
  const whole = Math.floor(wrapped);
  const mins = Math.round((wrapped - whole) * 60);
  const suffix = whole >= 12 ? 'PM' : 'AM';
  const display = whole % 12 === 0 ? 12 : whole % 12;
  return mins ? `${display}:${String(mins).padStart(2, '0')} ${suffix}` : `${display} ${suffix}`;
};

export const formatHoursRange = (from, to) => (
  isAlwaysOpen(from, to) ? '24 hours' : `${formatHour(from)} – ${formatHour(to)}`
);

// Live status line, e.g. "Open until 8 PM" / "Closed · opens 9:30 AM".
export const formatStatus = (from, to) => {
  if (isAlwaysOpen(from, to)) return 'Open 24 hours';
  return isOpenNow(from, to) ? `Open until ${formatHour(to)}` : `Closed · opens ${formatHour(from)}`;
};
