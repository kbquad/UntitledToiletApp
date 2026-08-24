import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useDataStore } from '../dataStore';
import { useWashroomData } from '../hooks/useWashroomData';
import { CITIES } from '../data/locations';
import { formatDistance } from '../utils/geo';
import { IconGear } from '../components/Icons';
import { ScoreBadge } from '../components/ui';
import { Loading, ErrorNote, DemoBanner } from '../components/Status';

export default function Home({ t }) {
  const navigate = useNavigate();
  const dark = useStore((s) => s.dark);
  const toggleDark = useStore((s) => s.toggleDark);
  const radius = useStore((s) => s.radius);
  const units = useStore((s) => s.units);
  const loadRegion = useDataStore((s) => s.loadRegion);
  const { allDecorated, nearby, location, status, error, loading } = useWashroomData();

  const closest = useMemo(
    () => [...allDecorated].sort((a, b) => a.dist - b.dist)[0],
    [allDecorated],
  );

  // "Rated clean this week" — the design's phrasing. Only rated washrooms can
  // appear, and unrated ones are absent rather than shown as zero.
  const ratedClean = useMemo(
    () => allDecorated.filter((w) => w.rated).sort((a, b) => b.avgRating - a.avgRating).slice(0, 3),
    [allDecorated],
  );

  const cities = useMemo(() => CITIES.slice(0, 8), []);
  const radiusLabel = formatDistance(radius, units);

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div
        className="scroll"
        style={{
          padding: '18px 18px 0', paddingTop: 'calc(18px + var(--safe-t))',
          paddingBottom: 'var(--scroll-pad-b)', display: 'flex', flexDirection: 'column', gap: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: t.sub }}>Good {greetingPart()}</div>
            <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-.04em', color: t.text, marginTop: 4, lineHeight: 1.1 }}>
              Need a washroom?
            </div>
            <div style={{ fontSize: 12.5, color: t.sub, marginTop: 7, lineHeight: 1.45 }}>
              Near {location.label} · within {radiusLabel}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
            <button type="button" aria-label={dark ? 'Switch to light' : 'Switch to dark'} onClick={toggleDark} style={iconButton(t)}>
              <span style={{ fontSize: 15, lineHeight: 1, color: t.text }}>{dark ? '☀' : '☾'}</span>
            </button>
            <button type="button" aria-label="Settings" onClick={() => navigate('/settings')} style={iconButton(t)}>
              <IconGear color={t.text} />
            </button>
          </div>
        </div>

        <DemoBanner t={t} />

        {status === 'error' && <ErrorNote t={t} message={error} onRetry={() => loadRegion(location.lat, location.lng, { force: true })} />}
        {loading && <Loading t={t} label="Finding washrooms near you…" />}

        {status === 'ready' && (
          <>
            {closest ? (
              <button
                type="button"
                onClick={() => navigate(`/washroom/${closest.id}`)}
                style={{
                  textAlign: 'left', padding: 18, borderRadius: 22, border: `1px solid ${t.line}`,
                  cursor: 'pointer', background: t.hero, color: t.text,
                  display: 'flex', flexDirection: 'column', gap: 11,
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.11em', textTransform: 'uppercase', color: t.sub }}>
                  Closest to you
                </div>
                <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.2 }}>{closest.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '6px 11px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
                    background: closest.rated ? closest.scoreBg : t.tagBg,
                    color: closest.rated ? closest.scoreFg : t.sub,
                  }}
                  >
                    {closest.rated ? `${closest.scoreText} / 5 clean` : 'Not rated yet'}
                  </span>
                  <span style={{ fontSize: 12.5, color: t.body }}>{closest.distLabel}</span>
                </div>
                <div style={{ fontSize: 12.5, color: t.sub, lineHeight: 1.45 }}>{closest.reviewLabel}</div>
              </button>
            ) : (
              <div style={{ padding: '20px 18px', borderRadius: 20, background: t.card, border: `1px dashed ${t.line2}` }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>Nothing mapped around here yet</div>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: t.sub, marginTop: 6 }}>
                  Move the map somewhere else, or add the washroom you are standing next to.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => navigate('/map')} style={actionCard(t)}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Open the map</div>
                <div style={{ fontSize: 11.5, color: t.sub, marginTop: 5, lineHeight: 1.4 }}>
                  {nearby.length ? `${nearby.length} within ${radiusLabel}` : 'Anywhere in Canada'}
                </div>
              </button>
              <button type="button" onClick={() => navigate('/add')} style={actionCard(t)}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Add a washroom</div>
                <div style={{ fontSize: 11.5, color: t.sub, marginTop: 5, lineHeight: 1.4 }}>Takes about a minute</div>
              </button>
            </div>

            <div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.02em', color: t.text, marginBottom: 11 }}>Browse a city</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cities.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => navigate('/map', { state: { flyTo: c } })}
                    style={{
                      whiteSpace: 'nowrap', padding: '10px 14px', borderRadius: 12, fontSize: 12.5,
                      fontWeight: 500, cursor: 'pointer', background: t.card, color: t.text,
                      border: `1px solid ${t.line}`,
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.02em', color: t.text }}>
                {ratedClean.length ? 'Rated clean nearby' : 'Nothing rated yet'}
              </div>
              <button type="button" onClick={() => navigate('/list')} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, color: t.accent }}>See all</button>
            </div>

            {ratedClean.length === 0 ? (
              <div style={{ padding: '20px 18px', borderRadius: 20, background: t.card, border: `1px dashed ${t.line2}`, textAlign: 'center' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>No reviews yet</div>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: t.sub, marginTop: 6 }}>
                  Ratings here come from real visits. Next time you use one of these washrooms,
                  rate it — you’ll be the first, and everyone after you will see it.
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/list')}
                  style={{ marginTop: 13, height: 44, padding: '0 18px', borderRadius: 14, border: 0, background: t.accent, color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Find one to rate
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ratedClean.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => navigate(`/washroom/${w.id}`)}
                    style={{ textAlign: 'left', padding: '14px 15px', borderRadius: 18, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13 }}
                  >
                    <ScoreBadge washroom={w} t={t} />
                    <span style={{ flex: 1, display: 'block', minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, letterSpacing: '-.02em', color: t.text, lineHeight: 1.3 }}>{w.name}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: t.sub, marginTop: 4 }}>{w.metaLabel}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const iconButton = (t) => ({
  width: 42, height: 42, flex: 'none', borderRadius: 14, border: `1px solid ${t.line}`,
  background: t.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
});

const actionCard = (t) => ({
  flex: 1, padding: '16px 15px', borderRadius: 18, border: `1px solid ${t.line}`,
  background: t.card, cursor: 'pointer', textAlign: 'left',
});

function greetingPart() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
