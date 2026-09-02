import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatDistance, formatDuration } from '../utils/geo';

export default function TripHistoryScreen({ t }) {
  const navigate = useNavigate();
  const units = useStore((s) => s.units);
  const trips = useStore((s) => s.trips);
  const setTripFrom = useStore((s) => s.setTripFrom);
  const setTripTo = useStore((s) => s.setTripTo);
  const clearTripVia = useStore((s) => s.clearTripVia);
  const addTripVia = useStore((s) => s.addTripVia);

  const driveAgain = (trip) => {
    setTripFrom({ label: trip.fromLabel, lat: trip.from.lat, lng: trip.from.lng });
    setTripTo({ label: trip.toLabel, lat: trip.to.lat, lng: trip.to.lng });
    clearTripVia();
    (trip.via ?? []).forEach((v) => addTripVia(v));
    navigate('/plan');
  };

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div style={{ padding: '18px 18px 12px', paddingTop: 'calc(18px + var(--safe-t))' }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.03em', color: t.text }}>Trip history</div>
        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>
          {trips.length === 0 ? 'Routes you’ve planned' : `${trips.length} trip${trips.length === 1 ? '' : 's'}`}
        </div>
      </div>

      <div className="scroll" style={{ padding: '4px 18px 0', paddingBottom: 'var(--scroll-pad-b)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {trips.length === 0 && (
          <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '0 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>No trips yet</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: t.sub }}>
              Plan a route and it lands here once you preview the drive.
            </div>
            <button type="button" onClick={() => navigate('/plan')} style={{ marginTop: 4, height: 44, padding: '0 20px', borderRadius: 14, border: 0, background: t.ink, color: t.onInk, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Plan a route
            </button>
          </div>
        )}

        {trips.map((trip) => (
          <div key={trip.id} style={{ borderRadius: 20, background: t.card, border: `1px solid ${t.line}`, padding: 17, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: '-.01em', color: t.text }}>
                {trip.fromLabel?.split(',')[0]} → {trip.toLabel?.split(',')[0]}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: t.sub, whiteSpace: 'nowrap' }}>
                {new Date(trip.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{formatDistance(trip.distanceM, units)}</span>
                <span style={{ fontSize: 11, color: t.sub }}>distance</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{formatDuration(trip.durationS)}</span>
                <span style={{ fontSize: 11, color: t.sub }}>driving</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{trip.via?.length ?? 0}</span>
                <span style={{ fontSize: 11, color: t.sub }}>via stops</span>
              </span>
            </div>
            <button type="button" onClick={() => driveAgain(trip)} style={{ alignSelf: 'flex-start', minHeight: 38, padding: '0 14px', borderRadius: 12, border: `1.5px solid ${t.line2}`, background: t.card, fontSize: 12.5, fontWeight: 600, color: t.text, cursor: 'pointer' }}>
              Drive it again
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
