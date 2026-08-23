import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import MapReady from '../components/MapReady';
import MapCentre from '../components/MapCentre';
import { useStore } from '../store';
import { useDataStore } from '../dataStore';
import { useToastStore } from '../toastStore';
import { useCurrentLocation } from '../hooks/useWashroomData';
import { requestLocation } from '../lib/geolocation';
import { FEATURES, TYPES } from '../data/locations';
import { IconBack } from '../components/Icons';
import { Chip, ToggleTrack } from '../components/ui';
import { ProtectedNote } from '../components/ProtectedNote';

const defaultFeatures = { wheelchair: false, babyChange: false, genderNeutral: false, free: true, openNow: false, noKey: true };

export default function AddScreen({ t }) {
  const navigate = useNavigate();
  const flash = useToastStore((s) => s.flash);
  const submitWashroom = useDataStore((s) => s.submitWashroom);
  const dark = useStore((s) => s.dark);
  const locationStatus = useStore((s) => s.locationStatus);
  const here = useCurrentLocation();

  const [name, setName] = useState('');
  const [type, setType] = useState('Park');
  const [features, setFeatures] = useState(defaultFeatures);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Whatever this screen submits becomes a point on everyone's map, so it asks
  // for a fresh reading on the way in rather than pinning the washroom at
  // wherever the app last saw the user.
  useEffect(() => {
    let cancelled = false;
    setLocating(true);
    requestLocation().finally(() => { if (!cancelled) setLocating(false); });
    return () => { cancelled = true; };
  }, []);

  const pinned = here.fromDevice && here.live;

  const updatePin = async () => {
    if (locating) return;
    setLocating(true);
    const fix = await requestLocation();
    setLocating(false);
    flash(fix ? 'Pin moved to where you are now.' : 'Still can’t get a fix. Check location permission for this site.');
  };

  const toggleFeature = (key) => setFeatures((f) => ({ ...f, [key]: !f[key] }));

  const canSubmit = !!name.trim() && pinned && !saving;

  const submit = async () => {
    if (!name.trim() || saving) return;
    if (!pinned) { flash('We need your location to place this washroom on the map.'); return; }

    setSaving(true);
    try {
      await submitWashroom({ name: name.trim(), type, lat: here.lat, lng: here.lng, features });
      navigate('/map');
      flash(`${name.trim()} submitted — it goes on the map once it's confirmed.`);
    } catch (e) {
      setSaving(false);
      flash(e?.message ?? 'Couldn’t submit that. Try again.');
    }
  };

  const pinNote = () => {
    if (locating && !pinned) return 'Finding where you are…';
    if (pinned) {
      const within = here.accuracy ? ` (accurate to about ${Math.round(here.accuracy)} m)` : '';
      return `Pinned where you are right now${within}. Add it while you’re standing there.`;
    }
    if (locationStatus === 'denied') {
      return 'Location is blocked for this site, so we can’t pin the washroom. Allow it in your browser’s site settings, then update the pin.';
    }
    if (here.fromDevice) {
      return 'This is where you last were, not where you are now. Update the pin before submitting.';
    }
    return 'We need your location to put this washroom in the right place.';
  };

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 10px', paddingTop: 'calc(16px + var(--safe-t))' }}>
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBack color={t.ink} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.02em', color: t.text }}>Add a washroom</div>
      </div>
      <div className="scroll" style={{ padding: '8px 18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* flex: 'none' matters — .scroll is a flex column, and an overflow:hidden
            box in one will happily shrink to nothing once the form is tall. */}
        <div style={{ position: 'relative', height: 150, flex: 'none', borderRadius: 18, overflow: 'hidden', border: `1px solid ${t.line}` }}>
          <MapContainer center={[here.lat, here.lng]} zoom={15} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} attributionControl={false} style={{ position: 'absolute', inset: 0 }}>
            <MapReady />
            <MapCentre lat={here.lat} lng={here.lng} zoom={15} />
            <TileLayer detectRetina maxZoom={20} maxNativeZoom={20} url={dark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'} />
          </MapContainer>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, pointerEvents: 'none', opacity: pinned ? 1 : 0.5 }}>
            <div style={{ padding: '5px 11px', borderRadius: 11, background: pinned ? t.accent : t.sub, color: '#FFFFFF', fontSize: 11.5, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,.24)' }}>
              {pinned ? 'You are here' : 'Location needed'}
            </div>
            <div style={{ width: 2, height: 14, background: pinned ? t.accent : t.sub }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: pinned ? t.accent : t.sub, boxShadow: `0 0 0 3px ${t.pinHalo}` }} />
          </div>
        </div>
        <div style={{ fontSize: 9.5, color: t.sub, opacity: 0.75, marginTop: -8 }}>
          Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>OpenStreetMap</a> contributors · tiles © <a href="https://carto.com/attributions" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>CARTO</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 11, lineHeight: 1.5, color: pinned ? t.sub : t.accent }}>{pinNote()}</div>
          <button
            type="button"
            onClick={updatePin}
            disabled={locating}
            style={{ flex: 'none', height: 32, padding: '0 12px', borderRadius: 11, border: `1px solid ${t.line2}`, background: t.card, color: t.ink, fontSize: 11.5, fontWeight: 600, cursor: locating ? 'progress' : 'pointer' }}
          >
            {locating ? 'Locating…' : pinned ? 'Update pin' : 'Use my location'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>Name or place</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 120))}
            placeholder="e.g. Riley Park fieldhouse"
            style={{ height: 46, padding: '0 14px', borderRadius: 14, border: `1px solid ${t.line2}`, background: t.card, fontSize: 13, color: t.text, outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>What kind of place is it?</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TYPES.map((ty) => (
              <Chip key={ty} label={ty} active={type === ty} t={t} onClick={() => setType(ty)} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>Features</span>
          <div style={{ borderRadius: 16, background: t.card, border: `1px solid ${t.line}`, overflow: 'hidden' }}>
            {FEATURES.filter((f) => f.key !== 'openNow').map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleFeature(f.key)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '13px 15px', border: 0, borderBottom: `1px solid ${t.line}`, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 12.5, color: t.body }}>{f.label}</span>
                <ToggleTrack on={!!features[f.key]} t={t} />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          style={{
            height: 50, borderRadius: 15, border: 0,
            background: canSubmit ? t.ink : t.trackBg,
            color: canSubmit ? '#FFF4F8' : t.sub,
            fontSize: 13.5, fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Submitting…'
            : !name.trim() ? 'Name it to submit'
              : !pinned ? 'Location needed to submit'
                : 'Submit for review'}
        </button>
        <div style={{ fontSize: 11, lineHeight: 1.55, color: t.sub, textAlign: 'center' }}>
          New submissions are checked before they appear on the map, so it won’t show up straight away.
        </div>

        <ProtectedNote t={t} style={{ marginTop: -6 }} />
      </div>
    </div>
  );
}
