import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useWashroomData } from '../hooks/useWashroomData';
import { formatDistance } from '../utils/geo';
import { FEATURES } from '../data/locations';
import { Chip, ToggleTrack } from '../components/ui';

const MIN_CLEAN_OPTIONS = [{ v: 0, l: 'Any' }, { v: 3, l: '3.0+' }, { v: 4, l: '4.0+' }, { v: 4.5, l: '4.5+' }];

export default function FiltersScreen({ t }) {
  const navigate = useNavigate();
  const units = useStore((s) => s.units);
  const radius = useStore((s) => s.radius);
  const setRadius = useStore((s) => s.setRadius);
  const minClean = useStore((s) => s.minClean);
  const setMinClean = useStore((s) => s.setMinClean);
  const filters = useStore((s) => s.filters);
  const toggleFilter = useStore((s) => s.toggleFilter);
  const clearFilters = useStore((s) => s.clearFilters);
  const { mapPool } = useWashroomData();

  return (
    <div className="screen" style={{ background: 'rgba(58,41,50,.4)', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', maxHeight: '88%', overflow: 'auto', borderRadius: '24px 24px 0 0', background: t.bg, padding: '12px 18px 20px', animation: 'looRise .28s ease' }}>
        <div style={{ width: 42, height: 4, borderRadius: 2, background: t.line2, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-.03em', color: t.text }}>Filters</div>
          <button type="button" onClick={clearFilters} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: t.accent }}>Clear all</button>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>Distance from you</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{formatDistance(radius, units)}</span>
          </div>
          <input
            type="range" min={200} max={10000} step={200} value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            style={{ width: '100%', marginTop: 14, accentColor: '#A9557A' }}
          />
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 11 }}>Minimum cleanliness</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {MIN_CLEAN_OPTIONS.map((o) => (
              <Chip key={o.l} label={o.l} active={minClean === o.v} t={t} onClick={() => setMinClean(o.v)} style={{ flex: 1, textAlign: 'center', padding: '11px 0' }} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 11 }}>Must have</div>
          <div style={{ borderRadius: 16, background: t.card, border: `1px solid ${t.line}`, overflow: 'hidden' }}>
            {FEATURES.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleFilter(f.key)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '13px 15px', border: 0, borderBottom: `1px solid ${t.line}`, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12.5, color: t.text }}>{f.label}</span>
                  <span style={{ display: 'block', fontSize: 10.5, color: t.sub, marginTop: 2 }}>{f.sub}</span>
                </span>
                <ToggleTrack on={!!filters[f.key]} t={t} />
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={() => navigate(-1)} style={{ width: '100%', height: 50, marginTop: 22, borderRadius: 15, border: 0, background: t.ink, color: t.onInk, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
          Show {mapPool.length} washroom{mapPool.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  );
}
