import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useDataStore } from '../dataStore';
import { useWashroomData } from '../hooks/useWashroomData';
import { AREAS } from '../data/locations';
import { IconGear } from '../components/Icons';
import { ScoreBadge } from '../components/ui';
import { Loading, ErrorNote, DemoBanner } from '../components/Status';

export default function Home({ t }) {
  const navigate = useNavigate();
  const dark = useStore((s) => s.dark);
  const toggleDark = useStore((s) => s.toggleDark);
  const loadWashrooms = useDataStore((s) => s.loadWashrooms);
  const { allDecorated, location, status, error, loading } = useWashroomData();

  const closest = useMemo(
    () => [...allDecorated].sort((a, b) => a.dist - b.dist)[0],
    [allDecorated],
  );
  const topRated = useMemo(
    () => allDecorated.filter((w) => w.rated).sort((a, b) => b.avgRating - a.avgRating).slice(0, 3),
    [allDecorated],
  );
  const areaCounts = useMemo(() => AREAS.map((a) => ({
    ...a, count: allDecorated.filter((w) => w.neighbourhood === a.name).length,
  })).filter((a) => a.count > 0), [allDecorated]);

  const reviewedCount = allDecorated.filter((w) => w.reviewCount > 0).length;

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div
        className="scroll"
        style={{
          padding: '18px 18px 0', paddingTop: 'calc(18px + var(--safe-t))',
          paddingBottom: 'var(--scroll-pad-b)', display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: t.sub }}>Good {greetingPart()}</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.035em', color: t.text, marginTop: 3 }}>Need a washroom?</div>
            <div style={{ fontSize: 12, color: t.sub, marginTop: 5 }}>Near {location.label}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
            <button type="button" aria-label="Toggle dark mode" onClick={toggleDark} style={{ width: 40, height: 40, flex: 'none', borderRadius: 13, border: `1px solid ${t.line}`, background: t.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.text }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>{dark ? '☀' : '☾'}</span>
            </button>
            <button type="button" aria-label="Settings" onClick={() => navigate('/settings')} style={{ width: 40, height: 40, flex: 'none', borderRadius: 13, border: `1px solid ${t.line}`, background: t.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconGear color={t.text} />
            </button>
          </div>
        </div>

        <DemoBanner t={t} />

        {status === 'error' && <ErrorNote t={t} message={error} onRetry={() => loadWashrooms({ force: true })} />}
        {loading && <Loading t={t} label="Finding washrooms near you…" />}

        {status === 'ready' && (
          <>
            {closest && (
              <button
                type="button"
                onClick={() => navigate(`/washroom/${closest.id}`)}
                style={{
                  textAlign: 'left', padding: 18, borderRadius: 20, border: 0, cursor: 'pointer', background: t.hero,
                  color: '#FFF4F8', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 8px 26px rgba(22,35,58,.16)',
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.7 }}>Closest to you</div>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.25 }}>{closest.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '5px 10px', borderRadius: 9, background: 'rgba(246,241,232,.16)', fontSize: 12, fontWeight: 600 }}>
                    {closest.rated ? `${closest.scoreText} / 5 clean` : 'Not rated yet'}
                  </span>
                  <span style={{ fontSize: 12, opacity: 0.82 }}>{closest.distLabel}</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.82, lineHeight: 1.45 }}>{closest.reviewLabel}</div>
              </button>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => navigate('/map')} style={{ flex: 1, padding: '15px 14px', borderRadius: 16, border: `1px solid ${t.line}`, background: t.card, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>Open the map</div>
                <div style={{ fontSize: 11, color: t.sub, marginTop: 4 }}>{allDecorated.length} washrooms across Calgary</div>
              </button>
              <button type="button" onClick={() => navigate('/add')} style={{ flex: 1, padding: '15px 14px', borderRadius: 16, border: `1px solid ${t.line}`, background: t.card, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>Add a washroom</div>
                <div style={{ fontSize: 11, color: t.sub, marginTop: 4 }}>Takes about a minute</div>
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 10 }}>Browse an area</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {areaCounts.map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => navigate('/map', { state: { flyTo: a } })}
                    style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap', padding: '9px 13px', borderRadius: 11, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: t.card, color: t.text, border: `1px solid ${t.line}` }}
                  >
                    <span>{a.name}</span><span style={{ opacity: 0.5 }}>{a.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.02em', color: t.text }}>
                {topRated.length ? 'Top rated' : 'Nothing rated yet'}
              </div>
              <button type="button" onClick={() => navigate('/list')} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: t.ink }}>See all</button>
            </div>

            {topRated.length === 0 ? (
              <div style={{ padding: '20px 18px', borderRadius: 18, background: t.card, border: `1px dashed ${t.line2}`, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>No reviews yet</div>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: t.sub, marginTop: 6 }}>
                  Ratings here come from real visits. Next time you use one of these washrooms,
                  rate it — you’ll be the first, and everyone after you will see it.
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/list')}
                  style={{ marginTop: 12, height: 42, padding: '0 18px', borderRadius: 13, border: 0, background: t.ink, color: '#FFF4F8', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Find one to rate
                </button>
              </div>
            ) : (
              <>
                {reviewedCount < 5 && (
                  <div style={{ fontSize: 11, color: t.sub, marginTop: -6 }}>
                    {reviewedCount} of {allDecorated.length} rated so far — add yours as you go.
                  </div>
                )}
                {topRated.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => navigate(`/washroom/${w.id}`)}
                    style={{ textAlign: 'left', padding: '14px 15px', borderRadius: 18, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13 }}
                  >
                    <ScoreBadge washroom={w} t={t} />
                    <span style={{ flex: 1, display: 'block', minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, letterSpacing: '-.02em', color: t.text, lineHeight: 1.3 }}>{w.name}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: t.sub, marginTop: 3 }}>{w.metaLabel}</span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function greetingPart() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
