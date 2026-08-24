import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToastStore } from '../toastStore';
import { requestLocation } from '../lib/geolocation';

// The one screen that ignores the theme. It runs before anyone has chosen a
// colour or an appearance, and the design fixes it as near-black with a faint
// street grid — so the palette here is literal rather than themed.
const INK = '#0B0B0E';
const GRID = '#17181C';
const BLUE = '#4C8DFF';
const MUTED = '#9A9AA5';
const FAINT = '#6F707A';

export default function Onboarding() {
  const navigate = useNavigate();
  const setOnboarded = useStore((s) => s.setOnboarded);
  const flash = useToastStore((s) => s.flash);
  const [locating, setLocating] = useState(false);

  const finish = () => { setOnboarded(true); navigate('/'); };

  // This grants permission; keeping the position up to date afterwards is the
  // app-wide watcher's job, not something captured once here.
  const allowLocation = async () => {
    if (locating) return;
    setLocating(true);
    const fix = await requestLocation();
    setLocating(false);
    finish();
    flash(fix
      ? 'Location on. Sorting by what’s closest to you.'
      : 'Couldn’t get your location. You can turn it on in Settings.');
  };

  return (
    <div className="screen" style={{ background: INK, justifyContent: 'flex-end', padding: '26px 22px 30px', color: '#FFFFFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        <svg viewBox="0 0 412 780" width="100%" height="100%" preserveAspectRatio="xMidYMin slice" style={{ display: 'block' }} aria-hidden="true">
          <rect width="412" height="780" fill={INK} />
          <g transform="rotate(-24 206 300)" stroke={GRID} fill="none">
            <path d="M-160 60 H620" strokeWidth="26" /><path d="M-160 190 H620" strokeWidth="14" />
            <path d="M-160 300 H620" strokeWidth="26" /><path d="M-160 420 H620" strokeWidth="14" />
            <path d="M-160 540 H620" strokeWidth="22" />
            <path d="M20 -140 V800" strokeWidth="22" /><path d="M150 -140 V800" strokeWidth="13" />
            <path d="M270 -140 V800" strokeWidth="22" /><path d="M390 -140 V800" strokeWidth="13" />
          </g>
          <g>
            {[[300, 128], [110, 208], [330, 232], [172, 268]].map(([cx, cy]) => (
              <g key={`${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r="15" fill="none" stroke={BLUE} strokeWidth="2" opacity=".55" />
                <circle cx={cx} cy={cy} r="6.5" fill={BLUE} />
              </g>
            ))}
          </g>
          {/* Fades the grid out before it reaches the copy, so the text sits on
              flat black rather than competing with the pattern. */}
          <defs>
            <linearGradient id="looFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={INK} stopOpacity="0" />
              <stop offset="1" stopColor={INK} stopOpacity="1" />
            </linearGradient>
          </defs>
          <rect x="0" y="230" width="412" height="180" fill="url(#looFade)" />
          <rect x="0" y="408" width="412" height="372" fill={INK} />
        </svg>
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 54, height: 54, borderRadius: 17, background: BLUE, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, fontWeight: 600 }}>L</div>
        <div style={{ fontSize: 33, fontWeight: 600, letterSpacing: '-.045em', lineHeight: 1.08 }}>
          A clean washroom,<br />wherever you are.
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: MUTED }}>
          Thousands of public washrooms across Canada — how far away they are,
          and what other people said about how clean they were.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}>
          {[
            'Sorted by what is actually closest to you',
            'Cleanliness rated 1–5 by people who went',
            'No account, and your location is never stored',
          ].map((line) => (
            <div key={line} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: BLUE, flex: 'none', marginTop: 7 }} />
              <span style={{ fontSize: 13, lineHeight: 1.5, color: MUTED }}>{line}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 6 }}>
          <button
            type="button"
            onClick={allowLocation}
            disabled={locating}
            style={{ height: 54, borderRadius: 16, border: 0, background: BLUE, color: '#FFFFFF', fontSize: 14.5, fontWeight: 600, cursor: locating ? 'progress' : 'pointer', opacity: locating ? 0.75 : 1 }}
          >
            {locating ? 'Finding you…' : 'Find washrooms near me'}
          </button>
          <button
            type="button"
            onClick={finish}
            style={{ height: 52, borderRadius: 16, border: '1px solid #2A2B31', background: 'transparent', color: '#FFFFFF', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
          >
            Browse the map instead
          </button>
        </div>
        <div style={{ fontSize: 11.5, lineHeight: 1.55, color: FAINT, textAlign: 'center', marginTop: 2 }}>
          Your location never leaves your device and is forgotten when you close
          the app. We ask again each visit.
        </div>
      </div>
    </div>
  );
}
