import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { useDataStore } from '../dataStore';
import { useToastStore } from '../toastStore';
import { useWashroom, useReviews } from '../hooks/useWashroomData';
import { stars, GREEN, AMBER, RED } from '../theme';
import { formatWalk } from '../utils/geo';
import { openInMaps } from '../utils/openInMaps';
import { relativeTime } from '../utils/time';
import { IconBack, IconHome, IconBookmark, IconNavigate } from '../components/Icons';
import { REVIEW_FILTERS } from '../data/locations';
import { Chip } from '../components/ui';
import { Loading } from '../components/Status';

export default function DetailScreen({ t }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const flash = useToastStore((s) => s.flash);
  const saved = useStore((s) => s.saved);
  const toggleSaved = useStore((s) => s.toggleSaved);
  const reviewFilter = useStore((s) => s.reviewFilter);
  const setReviewFilter = useStore((s) => s.setReviewFilter);
  const toggleHelpful = useDataStore((s) => s.toggleHelpful);

  const cur = useWashroom(id);
  const { reviews, loading: reviewsLoading } = useReviews(id);

  const isSaved = saved.includes(id);

  const shown = useMemo(() => {
    let list = reviews;
    if (reviewFilter === 'Good reviews') list = list.filter((r) => r.rating >= 4);
    else if (reviewFilter === 'Bad reviews') list = list.filter((r) => r.rating <= 2);
    if (reviewFilter === 'Most helpful') list = [...list].sort((a, b) => b.helpfulCount - a.helpfulCount);
    else if (reviewFilter === 'Highest rated') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [reviews, reviewFilter]);

  // The 5→1 star breakdown, counted from the reviews that actually exist.
  const breakdown = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length);
    const max = Math.max(1, ...counts);
    return counts.map((count, i) => ({
      label: `${5 - i} ★`,
      count,
      pct: Math.round((count / max) * 100),
      color: i < 2 ? GREEN : i === 2 ? AMBER : RED,
    }));
  }, [reviews]);

  if (!cur) return <div className="screen" style={{ background: t.bg }}><Loading t={t} /></div>;

  const facts = [
    { label: 'Hours today', value: cur.hoursToday, dot: cur.openNow ? GREEN : AMBER },
    { label: 'Cost', value: cur.fee, dot: cur.fee === 'Free' ? GREEN : AMBER },
    { label: 'Wheelchair accessible', value: cur.wheelchair ? 'Yes' : 'No', dot: cur.wheelchair ? GREEN : RED },
    { label: 'Baby change table', value: cur.babyChange ? 'Yes' : 'Not listed', dot: cur.babyChange ? GREEN : t.sub },
    { label: 'Key or code', value: cur.needsKey ? 'Ask staff' : 'Not needed', dot: cur.needsKey ? AMBER : GREEN },
    { label: 'Reviews', value: String(cur.reviewCount), dot: t.ink },
  ];

  const myReview = reviews.find((r) => r.isMine);

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div className="scroll" style={{ paddingBottom: 26 }}>
        <div style={{ padding: '16px 18px 20px', paddingTop: 'calc(16px + var(--safe-t))', background: t.hero, color: t.text, borderRadius: '0 0 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" aria-label="Back" onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: t.tagBg, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBack color={t.text} />
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" aria-label="Home" onClick={() => navigate('/')} style={{ width: 38, height: 38, borderRadius: 12, background: t.tagBg, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconHome color={t.text} />
              </button>
              <button
                type="button"
                aria-label={isSaved ? 'Remove from saved' : 'Save this washroom'}
                onClick={() => { toggleSaved(id); flash(isSaved ? 'Removed from Saved.' : 'Saved. You’ll find it under Saved.'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 13px', borderRadius: 12, background: isSaved ? t.accent : t.tagBg, border: `1px solid ${isSaved ? t.accent : t.line}`, cursor: 'pointer', color: isSaved ? '#FFFFFF' : t.text, fontSize: 12, fontWeight: 500 }}
              >
                <IconBookmark color="currentColor" /> {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
          <div style={{ marginTop: 18, fontSize: 11.5, letterSpacing: '.09em', textTransform: 'uppercase', color: t.sub }}>{cur.typeLine}</div>
          <div style={{ marginTop: 6, fontSize: 25, fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1.15 }}>{cur.name}</div>
          <div style={{ marginTop: 9, fontSize: 12.5, color: t.sub }}>{cur.metaLabel}</div>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            {cur.rated ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
                  <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-.045em', lineHeight: 0.9 }}>{cur.scoreText}</div>
                  <div style={{ fontSize: 13, color: t.sub, paddingBottom: 5 }}>/ 5 clean</div>
                </div>
                <div style={{ flex: 1, paddingBottom: 4, fontSize: 12, lineHeight: 1.45, color: t.sub }}>{cur.reviewLabel}</div>
              </>
            ) : (
              <div style={{ fontSize: 13, lineHeight: 1.5, color: t.sub }}>
                Not rated yet — if you use it, you’ll be the first to say what it was like.
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => navigate(`/washroom/${id}/review`)} style={{ flex: 1, height: 46, borderRadius: 14, background: t.accent, border: 0, color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 5px 16px rgba(0,0,0,.16)' }}>
              {myReview ? 'Edit your review' : 'Rate & review'}
            </button>
            <button
              type="button"
              onClick={() => {
                flash(`Opening your maps app — ${formatWalk(cur.dist)} from here.`);
                openInMaps(cur.lat, cur.lng, cur.name);
              }}
              style={{ flex: 1, height: 46, borderRadius: 14, background: t.card, border: `1px solid ${t.line}`, color: t.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            >
              <IconNavigate color={t.ink} /> Directions
            </button>
          </div>

          {cur.rated && (
            <div style={{ padding: 16, borderRadius: 18, background: t.card, border: `1px solid ${t.line}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text }}>How people rated it</div>
              {breakdown.map((b) => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 34, fontSize: 11, color: t.sub }}>{b.label}</span>
                  <span style={{ flex: 1, height: 7, borderRadius: 4, background: t.trackBg, overflow: 'hidden', display: 'block' }}>
                    <span style={{ display: 'block', height: '100%', borderRadius: 4, background: b.color, width: `${b.count === 0 ? 0 : b.pct}%` }} />
                  </span>
                  <span style={{ width: 26, textAlign: 'right', fontSize: 11, color: t.sub }}>{b.count}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: 16, borderRadius: 18, background: t.card, border: `1px solid ${t.line}` }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text, marginBottom: 12 }}>Good to know</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {facts.map((f) => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: f.dot, flex: 'none' }} />
                  <span style={{ flex: 1, fontSize: 12.5, color: t.body }}>{f.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: t.text }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '4px 2px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.02em', color: t.text }}>
              {reviews.length === 0 ? 'Reviews' : `${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
            </div>
            {reviews.length > 0 && <span style={{ fontSize: 11.5, color: t.sub }}>{reviewFilter}</span>}
          </div>

          {reviews.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {REVIEW_FILTERS.map((label) => (
                <Chip key={label} label={label} active={reviewFilter === label} t={t} style={{ fontSize: 11.5 }} onClick={() => setReviewFilter(label)} />
              ))}
            </div>
          )}

          {reviewsLoading && <Loading t={t} label="Loading reviews…" />}

          {!reviewsLoading && shown.map((r, i) => (
            <div key={r.id} style={{ padding: '15px 16px', borderRadius: 18, background: t.card, border: `1px solid ${r.isMine ? t.line2 : t.line}`, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 11, background: i % 2 ? t.accent : t.ink, color: '#FFFFFF', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  {initials(r.authorName)}
                </span>
                <span style={{ flex: 1, display: 'block', minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: t.text }}>
                    {r.authorName}{r.isMine && <span style={{ color: t.sub, fontWeight: 500 }}> · you</span>}
                  </span>
                  <span style={{ display: 'block', fontSize: 10.5, color: t.sub, marginTop: 2 }}>{relativeTime(r.createdAt)}</span>
                </span>
                <span style={{ fontSize: 12, color: t.accent, letterSpacing: 1, flex: 'none' }}>{stars(r.rating)}</span>
              </div>
              {r.body && <div style={{ fontSize: 12.5, lineHeight: 1.55, color: t.body }}>{r.body}</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 9, borderTop: `1px solid ${t.line}` }}>
                <span style={{ fontSize: 11, color: t.sub }}>
                  {r.helpfulCount === 0
                    ? 'No votes yet'
                    : `${r.helpfulCount} ${r.helpfulCount === 1 ? 'person' : 'people'} found this helpful`}
                </span>
                {r.isMine ? (
                  <button type="button" onClick={() => navigate(`/washroom/${id}/review`)} style={{ padding: '6px 11px', borderRadius: 9, background: 'transparent', border: `1px solid ${t.line2}`, fontSize: 11, fontWeight: 500, color: t.ink, cursor: 'pointer' }}>Edit</button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleHelpful(id, r.id).catch(() => flash('Couldn’t save that vote. Try again.'))}
                    style={{ padding: '6px 11px', borderRadius: 9, background: r.votedByMe ? t.tagBg : 'transparent', border: `1px solid ${r.votedByMe ? t.ink : t.line2}`, fontSize: 11, fontWeight: 500, color: t.ink, cursor: 'pointer' }}
                  >
                    {r.votedByMe ? 'Marked helpful' : 'Helpful'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {!reviewsLoading && shown.length === 0 && (
            <div style={{ padding: '22px 18px', borderRadius: 18, background: t.card, border: `1px dashed ${t.line2}`, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                {reviews.length === 0 ? 'No reviews yet' : `Nothing under “${reviewFilter}”`}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.55, color: t.sub, marginTop: 6 }}>
                {reviews.length === 0
                  ? 'Be the first to say what this one was like — a rating and a sentence is plenty.'
                  : 'Try another filter, or add your own review.'}
              </div>
              {reviews.length === 0 && (
                <button
                  type="button"
                  onClick={() => navigate(`/washroom/${id}/review`)}
                  style={{ marginTop: 12, height: 42, padding: '0 18px', borderRadius: 13, border: 0, background: t.accent, color: '#FFFFFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Write the first review
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const initials = (name) => (
  name === 'A local'
    ? 'AL'
    : name.split(' ').filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase() || 'A'
);
