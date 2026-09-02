import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useDataStore } from '../dataStore';
import { useToastStore } from '../toastStore';
import {
  cumulativeDistances, pointAtFraction, distanceToPath, fractionOfNearestPoint,
} from '../lib/routing';
import { formatDistance, formatDuration } from '../utils/geo';
import { decorateWashroom } from '../utils/decorate';
import { IconBack } from '../components/Icons';

// How close a known stop has to be to the route line to count as "along the
// way" rather than a detour worth mentioning separately.
const CORRIDOR_M = 4000;
// The whole route plays out over this many real seconds, however long the
// actual drive is — a preview, like the drive-sim in the design, not a
// real-time simulation.
const SIM_SECONDS = 75;

export default function DriveScreen({ t }) {
  const navigate = useNavigate();
  const flash = useToastStore((s) => s.flash);
  const units = useStore((s) => s.units);
  const activeRoute = useStore((s) => s.activeRoute);
  const tripFrom = useStore((s) => s.tripFrom);
  const tripTo = useStore((s) => s.tripTo);
  const tripCategories = useStore((s) => s.tripCategories);

  const washrooms = useDataStore((s) => s.washrooms);
  const loadRegion = useDataStore((s) => s.loadRegion);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const arrivedRef = useRef(false);
  const timerRef = useRef(null);

  const path = activeRoute?.path ?? null;
  const cum = useMemo(() => (path ? cumulativeDistances(path) : null), [path]);

  // Cover the whole corridor by loading the region around several points
  // spread along the route — reuses the same per-cell cache the rest of the
  // app already fills, rather than a bespoke long-route query.
  useEffect(() => {
    if (!path || !cum) return;
    const SAMPLES = 6;
    for (let i = 0; i <= SAMPLES; i++) {
      const p = pointAtFraction(path, cum, i / SAMPLES);
      loadRegion(p.lat, p.lng);
    }
  }, [path, cum, loadRegion]);

  useEffect(() => {
    if (!playing) return undefined;
    const stepMs = 200;
    const stepFrac = stepMs / (SIM_SECONDS * 1000);
    timerRef.current = setInterval(() => {
      setProgress((p) => Math.min(1, p + stepFrac));
    }, stepMs);
    return () => clearInterval(timerRef.current);
  }, [playing]);

  useEffect(() => {
    if (progress >= 1 && !arrivedRef.current) {
      arrivedRef.current = true;
      setPlaying(false);
      flash(`Arrived at ${tripTo?.label?.split(',')[0] ?? 'your destination'}.`);
    }
    if (progress < 1) arrivedRef.current = false;
  }, [progress, tripTo, flash]);

  const routeStops = useMemo(() => {
    if (!path || !cum) return [];
    const total = activeRoute.distanceM || 1;
    return washrooms
      .filter((w) => tripCategories.includes(w.category || 'toilet'))
      .map((w) => ({ w, offRouteM: distanceToPath(w, path), frac: fractionOfNearestPoint(w, path, cum) }))
      .filter((x) => x.offRouteM <= CORRIDOR_M)
      .sort((a, b) => a.frac - b.frac)
      .slice(0, 8)
      .map(({ w, offRouteM, frac }) => ({
        ...decorateWashroom(w, offRouteM, units),
        atFraction: frac,
        etaS: frac * (activeRoute.durationS || 0),
        atSeconds: frac * total,
      }));
  }, [washrooms, path, cum, tripCategories, units, activeRoute]);

  if (!activeRoute || !path) {
    return (
      <div className="screen" style={{ background: t.bg, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>No route to preview yet</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: t.sub, maxWidth: 260 }}>
          Plan a route with a starting point and a destination first.
        </div>
        <button type="button" onClick={() => navigate('/plan')} style={{ marginTop: 6, height: 46, padding: '0 20px', borderRadius: 14, border: 0, background: t.accent, color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Plan a route
        </button>
      </div>
    );
  }

  const doneM = progress * activeRoute.distanceM;
  const remainingS = (1 - progress) * activeRoute.durationS;
  const eta = new Date(Date.now() + remainingS * 1000);
  const etaLabel = eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fuelPct = Math.max(12, Math.round(100 - progress * 68));
  const nextStop = routeStops.find((s) => s.atFraction > progress);

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div style={{
        position: 'relative', height: 240, flex: 'none', overflow: 'hidden',
        background: `linear-gradient(180deg, ${t.hero} 0%, ${t.bg} 100%)`,
      }}
      >
        <div style={{
          position: 'absolute', left: '50%', top: 26, transform: 'translateX(-50%)',
          width: 70, height: 70, borderRadius: '50%', background: t.accent, opacity: 0.28, filter: 'blur(2px)',
        }}
        />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%',
          background: t.ink, opacity: 0.9, clipPath: 'polygon(34% 0, 66% 0, 132% 100%, -32% 100%)',
        }}
        />
        <div style={{
          position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', width: 6, height: '55%',
          background: `repeating-linear-gradient(180deg, ${t.card} 0 16px, transparent 16px 32px)`, opacity: 0.9,
        }}
        />

        <div style={{
          position: 'absolute', top: 'calc(14px + var(--safe-t))', left: 16, right: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
        >
          <button type="button" aria-label="Back" onClick={() => navigate(-1)} style={{ width: 42, height: 42, borderRadius: '50%', border: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <IconBack color="#FFFFFF" />
          </button>
          <span style={{ padding: '8px 13px', borderRadius: 12, background: 'rgba(0,0,0,.5)', color: '#FFFFFF', fontSize: 12.5, fontWeight: 700 }}>
            ETA {etaLabel}
          </span>
        </div>

        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, borderRadius: 13, background: 'rgba(255,255,255,.94)', padding: '9px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#71737E' }}>Next stop</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#14151A' }}>{nextStop ? nextStop.name : tripTo?.label?.split(',')[0] ?? 'Destination'}</div>
          </div>
          <div style={{ borderRadius: 13, background: 'rgba(255,255,255,.94)', padding: '9px 12px', minWidth: 74 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#71737E' }}>Fuel</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#14151A' }}>{fuelPct}%</div>
          </div>
        </div>
      </div>

      <div className="scroll" style={{ padding: '18px 20px 30px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => setPlaying((p) => !p)}
            style={{ width: 52, height: 52, flex: 'none', borderRadius: '50%', border: 0, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {playing ? (
              <span style={{ display: 'flex', gap: 4 }}>
                <span style={{ width: 5, height: 16, background: '#FFFFFF', borderRadius: 1 }} />
                <span style={{ width: 5, height: 16, background: '#FFFFFF', borderRadius: 1 }} />
              </span>
            ) : (
              <span style={{ width: 0, height: 0, marginLeft: 4, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: '15px solid #FFFFFF' }} />
            )}
          </button>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ height: 8, borderRadius: 4, background: t.trackBg, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, background: t.accent, width: `${(progress * 100).toFixed(1)}%`, transition: 'width .18s linear' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: t.sub }}>
              <span>{formatDistance(doneM, units)} done</span>
              <span>{formatDistance(activeRoute.distanceM, units)} total · {formatDuration(remainingS)} left</span>
            </div>
          </div>
        </div>

        {activeRoute.source !== 'osrm' && (
          <div style={{ fontSize: 11.5, lineHeight: 1.5, color: t.sub, padding: '10px 13px', borderRadius: 13, background: t.tagBg }}>
            Showing an estimated straight-line route — the live router couldn’t be reached.
          </div>
        )}

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 12 }}>Route strip</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <StripRow t={t} name={tripFrom?.label?.split(',')[0] ?? 'Start'} meta="Departure" passed at="now" last={routeStops.length === 0} />
            {routeStops.map((s) => (
              <StripRow
                key={s.id}
                t={t}
                name={s.name}
                meta={`${s.categoryLabel} · ${s.rated ? `${s.scoreText} clean` : 'New'} · ${formatDistance(s.dist, units)} off route`}
                passed={progress >= s.atFraction}
                at={new Date(Date.now() + s.etaS * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                onOpen={() => navigate(`/washroom/${s.id}`)}
              />
            ))}
            <StripRow t={t} name={tripTo?.label?.split(',')[0] ?? 'Destination'} meta="Arrival" passed={progress >= 1} at={etaLabel} last />
          </div>
        </div>
      </div>
    </div>
  );
}

function StripRow({
  t, name, meta, passed, at, onOpen, last,
}) {
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flex: 'none' }}>
        <span style={{ width: 14, height: 14, borderRadius: '50%', border: `3px solid ${passed ? t.accent : t.line2}`, background: passed ? t.accent : t.bg }} />
        {!last && <span style={{ flex: 1, width: 2, minHeight: 40, background: passed ? t.accent : t.line }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.sub, whiteSpace: 'nowrap' }}>{at}</span>
        </div>
        <span style={{ fontSize: 12.5, color: t.sub }}>{meta}</span>
        {onOpen && (
          <button type="button" onClick={onOpen} style={{ alignSelf: 'flex-start', minHeight: 36, padding: '0 13px', marginTop: 2, borderRadius: 11, border: `1.5px solid ${t.line2}`, background: t.card, fontSize: 12.5, fontWeight: 600, color: t.text, cursor: 'pointer' }}>
            View facilities
          </button>
        )}
      </div>
    </div>
  );
}
