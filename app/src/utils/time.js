// "Just now" / "2 days ago" — reviews carry real timestamps now.
const UNITS = [
  ['year', 31557600],
  ['month', 2629800],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export const relativeTime = (iso) => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, (Date.now() - then) / 1000);
  if (seconds < 60) return 'Just now';

  for (const [label, size] of UNITS) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${label}${n === 1 ? '' : 's'} ago`;
    }
  }
  return 'Just now';
};
