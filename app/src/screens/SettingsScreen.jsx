import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToastStore } from '../toastStore';
import { PRESETS, swatch, hueName } from '../theme';
import { IconBack, IconChevronRight } from '../components/Icons';
import { Chip, Toggle } from '../components/ui';

export default function SettingsScreen({ t }) {
  const navigate = useNavigate();
  const flash = useToastStore((s) => s.flash);
  const hue = useStore((s) => s.hue);
  const setHue = useStore((s) => s.setHue);
  const dark = useStore((s) => s.dark);
  const setDark = useStore((s) => s.setDark);
  const units = useStore((s) => s.units);
  const setUnits = useStore((s) => s.setUnits);
  const notify = useStore((s) => s.notify);
  const toggleNotify = useStore((s) => s.toggleNotify);

  const dragging = useRef(false);

  const hueFromEvent = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    return Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 450) % 360);
  };
  const wheelDown = (e) => { dragging.current = true; setHue(hueFromEvent(e)); };
  const wheelMove = (e) => { if (dragging.current) setHue(hueFromEvent(e)); };
  const wheelUp = () => { dragging.current = false; };

  const knobLeft = (92 + 74 * Math.cos(((hue - 90) * Math.PI) / 180)).toFixed(1);
  const knobTop = (92 + 74 * Math.sin(((hue - 90) * Math.PI) / 180)).toFixed(1);

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 10px', paddingTop: 'calc(16px + var(--safe-t))' }}>
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBack color={t.ink} />
        </button>
        <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-.03em', color: t.text }}>Settings</div>
      </div>
      <div className="scroll" style={{ padding: '8px 18px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ padding: '18px 16px 20px', borderRadius: 20, background: t.card, border: `1px solid ${t.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: t.text }}>Theme colour</span>
            <span style={{ fontSize: 11.5, color: t.sub }}>{hueName(hue)} · {hue}°</span>
          </div>
          <div
            onPointerDown={wheelDown}
            onPointerMove={wheelMove}
            onPointerUp={wheelUp}
            onPointerLeave={wheelUp}
            style={{
              position: 'relative', width: 184, height: 184, borderRadius: '50%', cursor: 'pointer', touchAction: 'none',
              background: 'conic-gradient(from 0deg,oklch(70% .15 0),oklch(70% .15 30),oklch(70% .15 60),oklch(70% .15 90),oklch(70% .15 120),oklch(70% .15 150),oklch(70% .15 180),oklch(70% .15 210),oklch(70% .15 240),oklch(70% .15 270),oklch(70% .15 300),oklch(70% .15 330),oklch(70% .15 360))',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)',
            }}
          >
            <div style={{ position: 'absolute', inset: 34, borderRadius: '50%', background: t.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 2px 10px rgba(0,0,0,.12)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, background: swatch(hue) }} />
              <div style={{ fontSize: 11, fontWeight: 500, color: t.sub }}>Drag the ring</div>
            </div>
            <div style={{ position: 'absolute', left: `${knobLeft}px`, top: `${knobTop}px`, width: 26, height: 26, margin: '-13px 0 0 -13px', borderRadius: '50%', background: swatch(hue), border: '3px solid #FFFFFF', boxShadow: '0 3px 10px rgba(0,0,0,.28)', pointerEvents: 'none' }} />
          </div>
          <input type="range" min={0} max={359} value={hue} onChange={(e) => setHue(Number(e.target.value))} style={{ width: '100%', accentColor: t.ink }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center' }}>
            {PRESETS.map((pr) => (
              <button
                key={pr.name}
                type="button"
                onClick={() => setHue(pr.hue)}
                title={pr.name}
                style={{
                  width: 34, height: 34, borderRadius: 11, background: swatch(pr.hue), cursor: 'pointer',
                  outline: '1px solid rgba(0,0,0,.06)',
                  border: Math.abs(pr.hue - hue) < 6 ? `2px solid ${t.ink}` : '2px solid transparent',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 18, background: t.card, border: `1px solid ${t.line}` }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text, marginBottom: 11 }}>Appearance</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Chip label="Light" active={!dark} t={t} onClick={() => setDark(false)} style={{ flex: 1, textAlign: 'center', padding: '12px 0' }} />
            <Chip label="Dark" active={dark} t={t} onClick={() => setDark(true)} style={{ flex: 1, textAlign: 'center', padding: '12px 0' }} />
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.5, color: t.sub, marginTop: 10 }}>The sun and moon button on Home switches these too.</div>
        </div>

        <div style={{ padding: 16, borderRadius: 18, background: t.card, border: `1px solid ${t.line}` }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text, marginBottom: 11 }}>Distance units</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Chip label="Metric" active={units === 'Metric'} t={t} onClick={() => setUnits('Metric')} style={{ flex: 1, textAlign: 'center', padding: '12px 0' }} />
            <Chip label="Imperial" active={units === 'Imperial'} t={t} onClick={() => setUnits('Imperial')} style={{ flex: 1, textAlign: 'center', padding: '12px 0' }} />
          </div>
        </div>

        <div style={{ borderRadius: 18, background: t.card, border: `1px solid ${t.line}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', padding: 15, borderBottom: `1px solid ${t.line}` }}>
            <span style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 12.5, color: t.text }}>Notify me about washrooms I saved</span>
              <span style={{ display: 'block', fontSize: 10.5, color: t.sub, marginTop: 3 }}>New reviews and closures</span>
            </span>
            <Toggle on={notify} onClick={() => { toggleNotify(); flash(notify ? 'Saved-washroom alerts off.' : 'We’ll tell you when a saved washroom gets new reviews.'); }} t={t} />
          </div>
          <button type="button" onClick={() => navigate('/onboarding')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', padding: 15, border: 0, borderBottom: `1px solid ${t.line}`, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 12.5, color: t.text }}>Replay the intro</span>
            <IconChevronRight color={t.sub} />
          </button>
          <button type="button" onClick={() => flash('Your location is only used on-device to sort what’s nearby.')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', padding: 15, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 12.5, color: t.text }}>Privacy and location</span>
              <span style={{ display: 'block', fontSize: 10.5, color: t.sub, marginTop: 3 }}>Location stays on your device</span>
            </span>
            <IconChevronRight color={t.sub} />
          </button>
        </div>
      </div>
    </div>
  );
}
