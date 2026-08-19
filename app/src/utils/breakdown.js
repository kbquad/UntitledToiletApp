import { GREEN, AMBER, RED } from '../theme';

// Synthesizes a 5/4/3/2/1-star breakdown that's consistent with a
// washroom's aggregate score and review total (same shape as real review data).
export const starBreakdown = (score, total) => {
  const five = Math.round(total * (score >= 4.5 ? 0.7 : score >= 4 ? 0.52 : score >= 3.5 ? 0.34 : 0.2));
  const four = Math.round(total * (score >= 4.5 ? 0.2 : score >= 4 ? 0.28 : score >= 3.5 ? 0.3 : 0.22));
  const three = Math.round(total * (score >= 4.5 ? 0.06 : score >= 4 ? 0.12 : score >= 3.5 ? 0.2 : 0.28));
  const two = Math.round(total * (score >= 4.5 ? 0.025 : score >= 4 ? 0.05 : score >= 3.5 ? 0.1 : 0.18));
  const one = Math.max(1, total - five - four - three - two);
  const counts = [five, four, three, two, one];
  const max = Math.max(...counts);
  return counts.map((count, i) => ({
    label: `${5 - i} ★`,
    count,
    pct: Math.round((count / max) * 100),
    color: i < 2 ? GREEN : i === 2 ? AMBER : RED,
  }));
};
