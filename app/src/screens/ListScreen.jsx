import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useDataStore } from '../dataStore';
import { useWashroomData, useCurrentLocation } from '../hooks/useWashroomData';
import { formatDistance } from '../utils/geo';
import { IconMap } from '../components/Icons';
import { Chip } from '../components/ui';
import { Loading, ErrorNote } from '../components/Status';

const SORTS = ['Closest', 'Cleanest', 'Most reviewed'];

export default function ListScreen({ t }) {
  const navigate = useNavigate();
  const sort = useStore((s) => s.sort);
  const setSort = useStore((s) => s.setSort);
  const units = useStore((s) => s.units);
  const radius = useStore((s) => s.radius);
  const loadRegion = useDataStore((s) => s.loadRegion);
  const { sorted, status, error, loading } = useWashroomData();
  const here = useCurrentLocation();

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div style={{ padding: '18px 18px 12px', paddingTop: 'calc(18px + var(--safe-t))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.03em', color: t.text }}>Nearby</div>
            <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Near {here.label} · within {formatDistance(radius, units)}</div>
          </div>
          <button type="button" onClick={() => navigate('/map')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 12, background: t.ink, border: 0, color: t.onInk, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <IconMap color={t.onInk} /> Map
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto' }}>
          {SORTS.map((label) => (
            <Chip key={label} label={label} active={sort === label} t={t} onClick={() => setSort(label)} />
          ))}
        </div>
      </div>
      <div
        className="scroll"
        style={{ padding: '4px 18px 0', paddingBottom: 'var(--scroll-pad-b)', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {status === 'error' && <ErrorNote t={t} message={error} onRetry={() => loadRegion(here.lat, here.lng, { force: true })} />}
        {loading && <Loading t={t} />}

        {status === 'ready' && sorted.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => navigate(`/washroom/${w.id}`)}
            style={{ textAlign: 'left', padding: '15px 16px', borderRadius: 18, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-.02em', color: t.text, lineHeight: 1.25 }}>{w.name}</div>
                <div style={{ fontSize: 11.5, color: t.sub, marginTop: 4 }}>{w.metaLabel}</div>
              </div>
              <div style={{
                flex: 'none', textAlign: 'center', padding: '7px 9px', borderRadius: 13,
                background: w.rated ? w.scoreBg : t.tagBg,
              }}
              >
                <div style={{ fontSize: w.rated ? 16 : 11, fontWeight: 600, color: w.rated ? w.scoreFg : t.sub, lineHeight: 1 }}>
                  {w.rated ? w.scoreText : 'New'}
                </div>
                {w.rated && <div style={{ fontSize: 9, color: w.scoreFg, opacity: 0.75, marginTop: 2 }}>of 5</div>}
              </div>
            </div>
            <div style={{ fontSize: 12, color: t.body, lineHeight: 1.45 }}>{w.reviewLabel}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {w.tags.map((tg) => (
                <span key={tg.label} style={{ padding: '4px 9px', borderRadius: 8, background: t.tagBg, fontSize: 10.5, fontWeight: 500, color: t.body }}>{tg.label}</span>
              ))}
            </div>
          </button>
        ))}

        {status === 'ready' && sorted.length === 0 && (
          <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12.5, lineHeight: 1.6, color: t.sub, padding: '0 20px' }}>
            Nothing matches those filters within {formatDistance(radius, units)}. Widen the radius or clear a filter.
          </div>
        )}

        {status === 'ready' && (
          <button type="button" onClick={() => navigate('/add')} style={{ padding: 16, borderRadius: 18, background: 'transparent', border: `1.5px dashed ${t.line2}`, cursor: 'pointer', fontSize: 12.5, fontWeight: 500, color: t.ink }}>
            Know one that’s missing? Add a washroom
          </button>
        )}
      </div>
    </div>
  );
}
