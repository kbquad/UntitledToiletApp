import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useWashroomData } from '../hooks/useWashroomData';
import { ScoreBadge } from '../components/ui';
import { Loading } from '../components/Status';

export default function SavedScreen({ t }) {
  const navigate = useNavigate();
  const saved = useStore((s) => s.saved);
  const { allDecorated, loading } = useWashroomData();
  const savedList = allDecorated.filter((w) => saved.includes(w.id));

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div style={{ padding: '18px 18px 12px', paddingTop: 'calc(18px + var(--safe-t))' }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.03em', color: t.text }}>Saved</div>
        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>
          {savedList.length === 0 ? 'Your shortlist lives here' : `${savedList.length} washroom${savedList.length === 1 ? '' : 's'} you trust`}
        </div>
      </div>
      <div
        className="scroll"
        style={{ padding: '4px 18px 0', paddingBottom: 'var(--scroll-pad-b)', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {loading && <Loading t={t} />}

        {!loading && savedList.length === 0 && (
          <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', padding: '0 24px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: t.tagBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth="1.6"><path d="M6 3h12v18l-6-4.6L6 21Z" /></svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>Nothing saved yet</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: t.sub }}>
              Save the washrooms you trust and they’ll be one tap away next time you’re in the neighbourhood.
              Your shortlist is private to this device.
            </div>
            <button type="button" onClick={() => navigate('/map')} style={{ marginTop: 4, height: 44, padding: '0 20px', borderRadius: 14, border: 0, background: t.ink, color: '#FFF4F8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Browse the map</button>
          </div>
        )}

        {savedList.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => navigate(`/washroom/${w.id}`)}
            style={{ textAlign: 'left', padding: '15px 16px', borderRadius: 18, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13 }}
          >
            <ScoreBadge washroom={w} t={t} />
            <span style={{ flex: 1, display: 'block' }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, letterSpacing: '-.02em', color: t.text }}>{w.name}</span>
              <span style={{ display: 'block', fontSize: 11.5, color: t.sub, marginTop: 3 }}>{w.metaLabel}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
