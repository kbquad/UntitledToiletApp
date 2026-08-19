import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToastStore } from '../toastStore';
import { requestLocation } from '../lib/geolocation';

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
      : 'Couldn’t get your location — showing Calgary. You can turn it on in Settings.');
  };

  return (
    <div className="screen" style={{ background: '#8E5B75', justifyContent: 'flex-end', padding: '26px 22px 30px', color: '#FFF4F8', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '56%', opacity: 0.9 }}>
        <svg viewBox="0 0 412 460" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
          <rect width="412" height="460" fill="#9C6782" />
          <g transform="rotate(-28 206 230)" stroke="#AC768C" fill="none">
            <path d="M-140 40 H560" strokeWidth="13" /><path d="M-140 120 H560" strokeWidth="13" /><path d="M-140 200 H560" strokeWidth="13" /><path d="M-140 280 H560" strokeWidth="13" /><path d="M-140 360 H560" strokeWidth="13" /><path d="M-140 440 H560" strokeWidth="13" />
            <path d="M20 -80 V560" strokeWidth="9" /><path d="M120 -80 V560" strokeWidth="9" /><path d="M220 -80 V560" strokeWidth="9" /><path d="M320 -80 V560" strokeWidth="9" />
          </g>
          <path d="M-20 0 H432 V72 C340 96 292 62 224 88 C160 112 90 96 -20 130 Z" fill="#835068" />
          <g fill="#FFD9E4">
            <circle cx="118" cy="286" r="6" /><circle cx="268" cy="212" r="6" /><circle cx="196" cy="362" r="6" /><circle cx="322" cy="330" r="6" />
          </g>
          <g fill="none" stroke="#FFD9E4" strokeWidth="1.4" opacity=".5">
            <circle cx="118" cy="286" r="16" /><circle cx="268" cy="212" r="16" /><circle cx="196" cy="362" r="16" /><circle cx="322" cy="330" r="16" />
          </g>
        </svg>
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF4F8', color: '#8E5B75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 600 }}>L</div>
        <div style={{ fontSize: 31, fontWeight: 600, letterSpacing: '-.04em', lineHeight: 1.1 }}>A clean washroom, wherever you are.</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.82 }}>Loo shows the public washrooms around you in Calgary, how far they are, and what other people said about how clean they were.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={allowLocation} disabled={locating} style={{ height: 52, borderRadius: 16, border: 0, background: '#FFF4F8', color: '#8E5B75', fontSize: 14, fontWeight: 600, cursor: locating ? 'progress' : 'pointer', opacity: locating ? 0.75 : 1 }}>{locating ? 'Finding you…' : 'Use my location'}</button>
          <button type="button" onClick={finish} style={{ height: 48, borderRadius: 16, border: '1px solid rgba(255,244,248,.3)', background: 'transparent', color: '#FFF4F8', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Browse Calgary instead</button>
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.55, opacity: 0.6, textAlign: 'center', marginTop: 2 }}>Your location stays on your device. We only use it to sort what’s nearby, and it updates as you move.</div>
      </div>
    </div>
  );
}
