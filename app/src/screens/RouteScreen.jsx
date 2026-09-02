import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToastStore } from '../toastStore';
import { route as fetchRoute } from '../lib/routing';
import { formatDistance, formatDuration } from '../utils/geo';
import { CATEGORIES } from '../data/locations';
import { IconBack } from '../components/Icons';
import { Chip } from '../components/ui';
import PlaceInput from '../components/PlaceInput';

// Plans a real route between two places — geocoded through Nominatim, routed
// through OSRM — with optional via stops, then hands the result to the drive
// simulation. This is the "travel parts should feel like something" screen:
// distance and time here are the same numbers a real router would give you,
// not a made-up placeholder.
export default function RouteScreen({ t }) {
  const navigate = useNavigate();
  const flash = useToastStore((s) => s.flash);
  const units = useStore((s) => s.units);

  const tripFrom = useStore((s) => s.tripFrom);
  const tripTo = useStore((s) => s.tripTo);
  const tripVia = useStore((s) => s.tripVia);
  const tripCategories = useStore((s) => s.tripCategories);
  const activeRoute = useStore((s) => s.activeRoute);

  const setTripFrom = useStore((s) => s.setTripFrom);
  const setTripTo = useStore((s) => s.setTripTo);
  const swapTripEnds = useStore((s) => s.swapTripEnds);
  const removeTripVia = useStore((s) => s.removeTripVia);
  const toggleTripCategory = useStore((s) => s.toggleTripCategory);
  const setActiveRoute = useStore((s) => s.setActiveRoute);
  const addTrip = useStore((s) => s.addTrip);

  const [addingVia, setAddingVia] = useState(false);
  const [loading, setLoading] = useState(false);

  const ready = !!(tripFrom && tripTo);

  // Re-fetch whenever the endpoints or via stops actually change — not on
  // every keystroke, since PlaceInput only calls back once a suggestion is
  // picked.
  useEffect(() => {
    if (!ready) { setActiveRoute(null); return; }
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    const points = [tripFrom, ...tripVia, tripTo];
    fetchRoute(points, { signal: controller.signal }).then((r) => {
      if (cancelled) return;
      setActiveRoute(r);
      setLoading(false);
      if (r.source === 'fallback') {
        flash('Couldn’t reach the live router — showing an estimated straight-line distance.');
      }
    });
    return () => { cancelled = true; controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tripFrom, tripTo, tripVia]);

  const startDrive = () => {
    if (!ready) { flash('Add a starting point and destination first.'); return; }
    if (activeRoute) {
      addTrip({
        fromLabel: tripFrom.label, toLabel: tripTo.label,
        from: { lat: tripFrom.lat, lng: tripFrom.lng }, to: { lat: tripTo.lat, lng: tripTo.lng },
        via: tripVia.map((v) => ({ lat: v.lat, lng: v.lng, label: v.label })),
        distanceM: activeRoute.distanceM, durationS: activeRoute.durationS,
      });
    }
    navigate('/drive');
  };

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 6px', paddingTop: 'calc(16px + var(--safe-t))' }}>
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 13, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBack color={t.text} />
        </button>
        <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-.035em', color: t.text }}>Plan your route</div>
      </div>

      <div className="scroll" style={{ padding: '10px 18px 30px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ borderRadius: 20, background: t.card, border: `1px solid ${t.line}`, padding: 16, display: 'flex', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 22 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', border: `3px solid ${t.accent}` }} />
            <span style={{ flex: 1, width: 2, minHeight: 30, background: t.line2 }} />
            {tripVia.map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <span key={i} style={{ width: 7, height: 7, borderRadius: 2, background: t.sub, margin: '4px 0' }} />
            ))}
            <span style={{ width: 11, height: 11, borderRadius: 2, background: t.hero }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: t.sub }}>Starting point</span>
              <PlaceInput t={t} value={tripFrom} placeholder="Enter a starting point" ariaLabel="Starting point" onSelect={setTripFrom} />
            </label>

            {tripVia.map((v, i) => (
              <div key={`${v.lat}-${v.lng}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minHeight: 40, borderRadius: 11, background: t.bg, border: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12.5, color: t.text }}>
                  {v.label}
                </div>
                <button type="button" aria-label="Remove via stop" onClick={() => removeTripVia(i)} style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, border: `1px solid ${t.line2}`, background: t.card, cursor: 'pointer', color: t.sub, fontSize: 15, lineHeight: 1 }}>×</button>
              </div>
            ))}

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: t.sub }}>Destination</span>
              <PlaceInput t={t} value={tripTo} placeholder="Where are you heading?" ariaLabel="Destination" onSelect={setTripTo} />
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => { swapTripEnds(); }}
                disabled={!tripFrom && !tripTo}
                style={{ minHeight: 40, padding: '0 13px', borderRadius: 11, border: `1.5px solid ${t.line2}`, background: t.card, fontSize: 13, fontWeight: 600, color: t.text, cursor: 'pointer' }}
              >
                ⇅ Swap
              </button>
              <button
                type="button"
                onClick={() => setAddingVia((v) => !v)}
                style={{ minHeight: 40, padding: '0 13px', borderRadius: 11, border: `1.5px solid ${t.line2}`, background: t.card, fontSize: 13, fontWeight: 600, color: t.text, cursor: 'pointer' }}
              >
                + Add a via stop
              </button>
            </div>
            {addingVia && (
              <PlaceInput
                t={t}
                placeholder="Search a place to route through"
                ariaLabel="Via stop"
                autoFocus
                onSelect={(r) => { useStore.getState().addTripVia(r); setAddingVia(false); }}
              />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.sub }}>Stops to plan in</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} label={c.label} active={tripCategories.includes(c.id)} t={t} onClick={() => toggleTripCategory(c.id)} />
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 18, background: t.card, border: `1px solid ${t.line}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!ready && (
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: t.sub }}>
              Pick a starting point and a destination to see the route.
            </div>
          )}
          {ready && loading && <div style={{ fontSize: 12.5, color: t.sub }}>Routing…</div>}
          {ready && !loading && activeRoute && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', color: t.accent }}>{formatDuration(activeRoute.durationS)}</span>
                <span style={{ fontSize: 13, color: t.sub }}>{formatDistance(activeRoute.distanceM, units)}</span>
              </div>
              <div style={{ fontSize: 11.5, color: t.sub }}>
                {activeRoute.source === 'osrm' ? 'Real driving directions' : 'Estimated — the live router was unreachable'}
                {tripVia.length > 0 ? ` · ${tripVia.length} via stop${tripVia.length === 1 ? '' : 's'}` : ''}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={startDrive}
          disabled={!ready}
          style={{
            width: '100%', minHeight: 54, borderRadius: 16, border: 0,
            background: ready ? t.accent : t.trackBg, color: ready ? '#FFFFFF' : t.sub,
            fontSize: 15, fontWeight: 700, cursor: ready ? 'pointer' : 'not-allowed',
          }}
        >
          Preview the drive
        </button>
      </div>
    </div>
  );
}
