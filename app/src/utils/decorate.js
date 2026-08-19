import { scoreColor } from '../theme';
import { formatDistance, formatWalk } from './geo';
import { formatStatus, formatHoursRange, isOpenNow } from './hours';

// Attaches display-ready labels to a washroom.
//
// A washroom nobody has reviewed has avgRating === null. That is a real state,
// not a zero: it renders as "New" / "No ratings yet" rather than a bad score.
export const decorateWashroom = (w, distMetres, units) => {
  const rated = w.avgRating != null;
  const c = rated ? scoreColor(w.avgRating) : null;

  const tags = [];
  if (w.wheelchair) tags.push({ label: 'Accessible' });
  if (w.babyChange) tags.push({ label: 'Change table' });
  if (w.genderNeutral) tags.push({ label: 'Gender-neutral' });
  tags.push({ label: w.fee });

  const distLabel = formatDistance(distMetres, units);
  const hoursToday = formatStatus(w.openFrom, w.openTo);

  return {
    ...w,
    dist: distMetres,
    rated,
    openNow: isOpenNow(w.openFrom, w.openTo),
    hoursToday,
    hours: formatHoursRange(w.openFrom, w.openTo),
    scoreText: rated ? w.avgRating.toFixed(1) : '–',
    scoreBg: rated ? c.bg : 'transparent',
    scoreFg: rated ? c.fg : null, // caller substitutes a theme colour
    distLabel: `${distLabel} · ${formatWalk(distMetres)}`,
    metaLabel: `${w.neighbourhood} · ${distLabel} · ${hoursToday}`,
    typeLine: `${w.type} · ${w.neighbourhood}`,
    reviewLabel: w.reviewCount === 0
      ? 'No reviews yet — be the first'
      : `${w.cleanVotes} of ${w.reviewCount} ${w.reviewCount === 1 ? 'person' : 'people'} found this clean`,
    tags,
  };
};
