import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useDataStore } from '../dataStore';
import { stars } from '../theme';
import { relativeTime } from '../utils/time';
import { DemoBanner } from '../components/Status';

export default function ProfileScreen({ t }) {
  const navigate = useNavigate();
  const displayName = useStore((s) => s.displayName);
  const dark = useStore((s) => s.dark);
  const toggleDark = useStore((s) => s.toggleDark);
  const myReviews = useDataStore((s) => s.myReviews);
  const myHelpfulReceived = useDataStore((s) => s.myHelpfulReceived);
  const loadProfile = useDataStore((s) => s.loadProfile);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const name = displayName || 'A local';
  const stats = [
    { value: String(myReviews.length), label: 'Reviews written' },
    { value: String(myHelpfulReceived), label: 'Found you helpful' },
  ];

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div className="scroll" style={{ paddingBottom: 'var(--scroll-pad-b)' }}>
        {/* A slab barely lifted off the page, with its own text colours. It
            used to inherit t.onInk — the colour meant for text sitting ON the
            accent — which on a dark header rendered near-black on near-black. */}
        <div style={{ padding: '20px 18px 22px', paddingTop: 'calc(20px + var(--safe-t))', background: t.hero, color: t.text, borderRadius: '0 0 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: t.accent, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 600, flex: 'none' }}>
              {name === 'A local' ? 'AL' : name.split(' ').filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-.03em', color: t.text }}>{name}</div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>
                {myReviews.length === 0 ? 'No reviews yet' : 'Reviewing washrooms across Canada'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              style={{ flex: 'none', height: 38, padding: '0 15px', borderRadius: 12, background: t.tagBg, border: `1px solid ${t.line}`, cursor: 'pointer', color: t.text, fontSize: 12.5, fontWeight: 600 }}
            >
              Edit
            </button>
            <button type="button" aria-label={dark ? 'Switch to light' : 'Switch to dark'} onClick={toggleDark} style={{ width: 38, height: 38, flex: 'none', borderRadius: 12, background: t.tagBg, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.text, fontSize: 14, lineHeight: 1 }}>
              {dark ? '☀' : '☾'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ flex: 1, padding: '13px 12px', borderRadius: 15, background: t.tagBg, border: `1px solid ${t.line}` }}>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.03em', color: t.text }}>{s.value}</div>
                <div style={{ fontSize: 10.5, color: t.sub, marginTop: 3, lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DemoBanner t={t} />

          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.02em', color: t.text }}>Your reviews</div>

          {myReviews.length === 0 ? (
            <div style={{ padding: '22px 18px', borderRadius: 18, background: t.card, border: `1px dashed ${t.line2}`, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>You haven’t reviewed anything yet</div>
              <div style={{ fontSize: 12, lineHeight: 1.55, color: t.sub, marginTop: 6 }}>
                Next time you use a public washroom, rate it. It takes a few seconds and
                it’s what makes the map useful for everyone else.
              </div>
              <button
                type="button"
                onClick={() => navigate('/list')}
                style={{ marginTop: 12, height: 42, padding: '0 18px', borderRadius: 13, border: 0, background: t.ink, color: t.onInk, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Find one nearby
              </button>
            </div>
          ) : (
            myReviews.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate(`/washroom/${r.washroomId}`)}
                style={{ textAlign: 'left', padding: '15px 16px', borderRadius: 18, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{r.washroomName}</span>
                  <span style={{ fontSize: 12, color: t.accent, letterSpacing: 1, flex: 'none' }}>{stars(r.rating)}</span>
                </div>
                {r.body && <div style={{ fontSize: 12.5, lineHeight: 1.55, color: t.body }}>{r.body}</div>}
                <div style={{ fontSize: 10.5, color: t.sub }}>{relativeTime(r.createdAt)}</div>
              </button>
            ))
          )}

          <button
            type="button"
            onClick={() => navigate('/settings')}
            style={{ padding: '15px 16px', borderRadius: 16, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, textAlign: 'left' }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 500, color: t.text }}>Settings</span>
            <span style={{ fontSize: 11.5, color: t.sub }}>Theme, units, privacy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
