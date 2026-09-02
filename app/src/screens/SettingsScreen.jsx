import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToastStore } from '../toastStore';
import { useCurrentLocation } from '../hooks/useWashroomData';
import { requestLocation } from '../lib/geolocation';
import { relativeTime } from '../utils/time';
import { PRESETS, swatch, hueName } from '../theme';
import { isLive } from '../lib/db';
import { isProtected } from '../lib/firebase';
import { IconBack, IconChevronRight } from '../components/Icons';
import { Chip, Toggle } from '../components/ui';

// Small uppercase label above each card, so a long settings page reads as
// groups rather than one undifferentiated stack.
const Section = ({ t, title, children, note }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.11em', textTransform: 'uppercase', color: t.sub, paddingLeft: 4 }}>
      {title}
    </div>
    <div style={{ borderRadius: 20, background: t.card, border: `1px solid ${t.line}`, overflow: 'hidden' }}>
      {children}
    </div>
    {note && <div style={{ fontSize: 11, lineHeight: 1.5, color: t.sub, padding: '0 4px' }}>{note}</div>}
  </div>
);

const Row = ({ t, children, last, onClick, as = 'div' }) => {
  const style = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    width: '100%', padding: '14px 15px', textAlign: 'left',
    borderBottom: last ? 0 : `1px solid ${t.line}`,
    background: 'transparent', border: 0,
    ...(onClick ? { cursor: 'pointer' } : {}),
  };
  if (as === 'button') {
    return <button type="button" onClick={onClick} style={{ ...style, borderBottom: last ? 0 : `1px solid ${t.line}` }}>{children}</button>;
  }
  return <div style={style}>{children}</div>;
};

const Label = ({ t, title, hint }) => (
  <span style={{ display: 'block', minWidth: 0 }}>
    <span style={{ display: 'block', fontSize: 12.5, color: t.text }}>{title}</span>
    {hint && <span style={{ display: 'block', fontSize: 10.5, lineHeight: 1.45, color: t.sub, marginTop: 3 }}>{hint}</span>}
  </span>
);

const Pair = ({ t, a, b, value, onPick }) => (
  <div style={{ display: 'flex', gap: 8, padding: '13px 15px' }}>
    <Chip label={a} active={value === a} t={t} onClick={() => onPick(a)} style={{ flex: 1, textAlign: 'center', padding: '12px 0' }} />
    <Chip label={b} active={value === b} t={t} onClick={() => onPick(b)} style={{ flex: 1, textAlign: 'center', padding: '12px 0' }} />
  </div>
);

export default function SettingsScreen({ t }) {
  const navigate = useNavigate();
  const flash = useToastStore((s) => s.flash);
  const hue = useStore((s) => s.hue);
  const setHue = useStore((s) => s.setHue);
  const dark = useStore((s) => s.dark);
  const setDark = useStore((s) => s.setDark);
  const units = useStore((s) => s.units);
  const setUnits = useStore((s) => s.setUnits);
  const locationAccuracy = useStore((s) => s.locationAccuracy);
  const setLocationAccuracy = useStore((s) => s.setLocationAccuracy);
  const notify = useStore((s) => s.notify);
  const toggleNotify = useStore((s) => s.toggleNotify);
  const locationStatus = useStore((s) => s.locationStatus);
  const forgetLocation = useStore((s) => s.forgetLocation);
  const displayName = useStore((s) => s.displayName);
  const setDisplayName = useStore((s) => s.setDisplayName);
  const breaksOn = useStore((s) => s.breaksOn);
  const toggleBreaks = useStore((s) => s.toggleBreaks);
  const breakHours = useStore((s) => s.breakHours);
  const setBreakHours = useStore((s) => s.setBreakHours);
  const here = useCurrentLocation();

  const [locating, setLocating] = useState(false);
  const dragging = useRef(false);

  // Somewhere to turn location on after skipping it at the start, or to force
  // a fresh fix if the browser has been sitting on an old one.
  const useMyLocation = async () => {
    if (locating) return;
    setLocating(true);
    const fix = await requestLocation();
    setLocating(false);
    flash(fix
      ? 'Got it — distances are measured from where you are now.'
      : 'Couldn’t get a location. Check that this site is allowed to use it.');
  };

  const locationLine = () => {
    if (locating) return 'Finding you…';
    if (locationStatus === 'denied') return 'Blocked for this site — allow it in your browser settings';
    if (locationStatus === 'unavailable') return 'Your browser couldn’t provide a position';
    if (!here.fromDevice) return 'Off — distances are measured from downtown Toronto';
    if (here.live) return `Following you${here.at ? ` · updated ${relativeTime(here.at).toLowerCase()}` : ''}`;
    return `Last fix ${relativeTime(here.at).toLowerCase()} — tap to refresh`;
  };

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 12px', paddingTop: 'calc(16px + var(--safe-t))' }}>
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 13, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBack color={t.text} />
        </button>
        <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-.035em', color: t.text }}>Settings</div>
      </div>

      <div className="scroll" style={{ padding: '6px 18px 30px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <Section t={t} title="You" note="Your name is only attached to reviews you post. Leave it blank to stay anonymous.">
          <div style={{ padding: '14px 15px', borderBottom: `1px solid ${t.line}` }}>
            <div style={{ fontSize: 12.5, color: t.text, marginBottom: 9 }}>Display name</div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
              placeholder="A local"
              style={{ width: '100%', height: 46, padding: '0 14px', borderRadius: 14, border: `1px solid ${t.line2}`, background: t.bg, fontSize: 13, color: t.text, outline: 'none' }}
            />
          </div>
          <Row t={t} last>
            <Label t={t} title="Account" hint={isLive ? 'No signup — this device has an anonymous session' : 'Demo mode — nothing leaves this browser'} />
            <span style={{ fontSize: 12, fontWeight: 500, color: t.sub }}>{isLive ? 'Anonymous' : 'Local'}</span>
          </Row>
        </Section>

        <Section t={t} title="Appearance">
          <Pair t={t} a="Light" b="Dark" value={dark ? 'Dark' : 'Light'} onPick={(v) => setDark(v === 'Dark')} />
        </Section>

        <Section t={t} title="Accent colour" note="Colours the buttons, chips and highlights. The rest of the app stays black.">
          <div style={{ padding: '18px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, color: t.text }}>Accent</span>
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
              <div style={{ position: 'absolute', inset: 34, borderRadius: '50%', background: t.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: swatch(hue) }} />
                <div style={{ fontSize: 11, fontWeight: 500, color: t.sub }}>Drag the ring</div>
              </div>
              <div style={{ position: 'absolute', left: `${knobLeft}px`, top: `${knobTop}px`, width: 26, height: 26, margin: '-13px 0 0 -13px', borderRadius: '50%', background: swatch(hue), border: '3px solid #FFFFFF', boxShadow: '0 3px 10px rgba(0,0,0,.28)', pointerEvents: 'none' }} />
            </div>
            <input type="range" min={0} max={359} value={hue} onChange={(e) => setHue(Number(e.target.value))} style={{ width: '100%', accentColor: t.accent }} aria-label="Theme hue" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center' }}>
              {PRESETS.map((pr) => (
                <button
                  key={pr.name}
                  type="button"
                  onClick={() => setHue(pr.hue)}
                  title={pr.name}
                  aria-label={pr.name}
                  style={{
                    width: 36, height: 36, borderRadius: 12, background: swatch(pr.hue), cursor: 'pointer',
                    outline: '1px solid rgba(0,0,0,.06)',
                    border: Math.abs(pr.hue - hue) < 6 ? `2px solid ${t.text}` : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section
          t={t}
          title="Location"
          note={locationAccuracy === 'Exact'
            ? 'Distances are measured from where you are standing.'
            : 'Your position is rounded to about a kilometre before anything uses it.'}
        >
          <Pair t={t} a="Exact location" b="General area" value={locationAccuracy === 'Exact' ? 'Exact location' : 'General area'} onPick={(v) => setLocationAccuracy(v === 'Exact location' ? 'Exact' : 'General')} />
          <Row t={t} as="button" onClick={useMyLocation}>
            <Label t={t} title="Use my location" hint={locationLine()} />
            <IconChevronRight color={t.sub} />
          </Row>
          <Row t={t} as="button" last onClick={() => { forgetLocation(); flash('Location forgotten. It is never stored between visits anyway.'); }}>
            <Label t={t} title="Forget my location" hint="Never saved between visits — cleared when you close the app" />
            <IconChevronRight color={t.sub} />
          </Row>
        </Section>

        <Section t={t} title="Distance units">
          <Pair t={t} a="Kilometres" b="Miles" value={units === 'Metric' ? 'Kilometres' : 'Miles'} onPick={(v) => setUnits(v === 'Kilometres' ? 'Metric' : 'Imperial')} />
        </Section>

        <Section t={t} title="Break reminders" note="Suggests a stop while you're driving, spaced by this interval.">
          <Row t={t}>
            <Label t={t} title="Remind me to take a break" hint={breaksOn ? `Every ${breakHours}h` : 'Off'} />
            <Toggle on={breaksOn} onClick={toggleBreaks} t={t} />
          </Row>
          {breaksOn && (
            <div style={{ padding: '13px 15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: t.text }}>Reminder interval</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.accent }}>{breakHours}h</span>
              </div>
              <input
                type="range" min={1} max={4} step={0.5} value={breakHours}
                onChange={(e) => setBreakHours(Number(e.target.value))}
                style={{ width: '100%', accentColor: t.accent }}
                aria-label="Break reminder interval"
              />
            </div>
          )}
        </Section>

        <Section t={t} title="Notifications">
          <Row t={t} last>
            <Label t={t} title="Notify me about washrooms I saved" hint="New reviews and closures" />
            <Toggle on={notify} onClick={() => { toggleNotify(); flash(notify ? 'Saved-washroom alerts off.' : 'We’ll tell you when a saved washroom gets new reviews.'); }} t={t} />
          </Row>
        </Section>

        <Section t={t} title="About">
          <Row t={t}>
            <Label t={t} title="Where washrooms come from" hint="OpenStreetMap contributors, plus places people add here" />
            <span style={{ fontSize: 12, fontWeight: 500, color: t.sub }}>OSM</span>
          </Row>
          <Row t={t}>
            <Label t={t} title="Spam protection" hint={isProtected ? 'reCAPTCHA checks each post before it is accepted' : 'Not configured for this build'} />
            <span style={{ fontSize: 12, fontWeight: 500, color: isProtected ? t.accent : t.sub }}>{isProtected ? 'On' : 'Off'}</span>
          </Row>
          <Row t={t} as="button" last onClick={() => navigate('/onboarding')}>
            <Label t={t} title="Replay the intro" />
            <IconChevronRight color={t.sub} />
          </Row>
        </Section>
      </div>
    </div>
  );
}
