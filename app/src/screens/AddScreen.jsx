import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import MapReady from '../components/MapReady';
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

  // Where the washroom will be filed. The design lets you drag the map to
  // place it, which is both more accurate — you are rarely standing inside the
  // stall — and the only way to add anything at all if location is blocked.
  const [pin, setPin] = useState(null);
  const [map, setMap] = useState(null);
  const onMapReady = useCallback((m) => setMap(m), []);

  // Whatever this screen submits becomes a point on everyone's map, so it asks
  // for a fresh reading on the way in rather than pinning the washroom at
  // wherever the app last saw the user.
  useEffect(() => {
    let cancelled = false;
    setLocating(true);
    requestLocation().finally(() => { if (!cancelled) setLocating(false); });
    return () => { cancelled = true; };
  }, []);

  // The pin is wherever the map is pointing. Reading it from moveend rather
  // than tracking drags keeps it correct however the map was moved — dragged,
  // zoomed, or flown to by the button below.
  useEffect(() => {
    if (!map) return undefined;
    const sync = () => { const c = map.getCenter(); setPin({ lat: c.lat, lng: c.lng }); };
    map.on('moveend', sync);
    sync();
    return () => { map.off('moveend', sync); };
  }, [map]);

  // Once the browser answers, put the map over the user — they are usually
  // adding the washroom they are standing next to. Only the first time, so it
  // never yanks the map out from under someone mid-drag.
  const [centred, setCentred] = useState(false);
  useEffect(() => {
    if (!map || centred || !here.fromDevice) return;
    setCentred(true);
    map.setView([here.lat, here.lng], 17, { animate: false });
  }, [map, centred, here.fromDevice, here.lat, here.lng]);

  const pinned = !!pin;

  const jumpToMe = async () => {
    if (locating) return;
    setLocating(true);
    const fix = await requestLocation();
    setLocating(false);
    if (fix) {
      map?.setView([fix.lat, fix.lng], 17);
      flash('Map moved to where you are. Drag to fine-tune the pin.');
    } else {
      flash('Still can’t get a fix — drag the map to place it yourself.');
    }
  };

  const toggleFeature = (key) => setFeatures((f) => ({ ...f, [key]: !f[key] }));

  const canSubmit = !!name.trim() && pinned && !saving;

  const submit = async () => {
    if (!name.trim() || saving) return;
    if (!pinned) { flash('Move the map to where the washroom is first.'); return; }

    setSaving(true);
    try {
      await submitWashroom({ name: name.trim(), type, lat: pin.lat, lng: pin.lng, features });
      navigate('/map');
      flash(`${name.trim()} submitted — it goes on the map once it's confirmed.`);
    } catch (e) {
      setSaving(false);
      flash(e?.message ?? 'Couldn’t submit that. Try again.');
    }
  };

  const pinNote = () => {
    if (locating && !here.fromDevice) return 'Finding where you are…';
    if (locationStatus === 'denied' && !here.fromDevice) {
      return 'Location is blocked for this site, so the map starts on Canada — drag it to the washroom yourself.';
    }
    return 'Drag the map to put the pin on the washroom, then name it.';
  };

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 10px', paddingTop: 'calc(16px + var(--safe-t))' }}>
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBack color={t.text} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.02em', color: t.text }}>Add a washroom</div>
      </div>
      <div className="scroll" style={{ padding: '8px 18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* flex: 'none' matters — .scroll is a flex column, and an overflow:hidden
            box in one will happily shrink to nothing once the form is tall. */}
        <div style={{ position: 'relative', height: 210, flex: 'none', borderRadius: 18, overflow: 'hidden', border: `1px solid ${t.line}` }}>
          <MapContainer
            center={[here.lat, here.lng]}
            zoom={here.fromDevice ? 17 : 4}
            zoomControl={false}
            attributionControl={false}
            style={{ position: 'absolute', inset: 0 }}
          >
            <MapReady onReady={onMapReady} />
            <TileLayer detectRetina maxZoom={20} maxNativeZoom={20} url={dark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'} />
          </MapContainer>

          {/* The pin is painted over the centre of the map rather than added to
              it, so it stays put while the map slides underneath — which is
              what makes dragging feel like placing something. */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, pointerEvents: 'none' }}>
            <div style={{ padding: '5px 11px', borderRadius: 11, background: t.accent, color: '#FFFFFF', fontSize: 11.5, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,.24)' }}>
              Drag to place
            </div>
            <div style={{ width: 2, height: 14, background: t.accent }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: t.accent, boxShadow: `0 0 0 3px ${t.pinHalo}` }} />
          </div>

          <button
            type="button"
            aria-label="Move the map to my location"
            onClick={jumpToMe}
            disabled={locating}
            style={{
              position: 'absolute', right: 10, bottom: 10, zIndex: 1000,
              height: 34, padding: '0 12px', borderRadius: 11,
              border: `1px solid ${t.line}`, background: t.card, color: t.ink,
              fontSize: 11.5, fontWeight: 600, cursor: locating ? 'progress' : 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,.2)',
            }}
          >
            {locating ? 'Locating…' : 'Use my location'}
          </button>
        </div>
        <div style={{ fontSize: 9.5, color: t.sub, opacity: 0.75, marginTop: -8 }}>
          Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>OpenStreetMap</a> contributors · tiles © <a href="https://carto.com/attributions" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>CARTO</a>
        </div>

        <div style={{ fontSize: 11.5, lineHeight: 1.5, color: t.sub }}>{pinNote()}</div>

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
            color: canSubmit ? t.onInk : t.sub,
            fontSize: 13.5, fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Submitting…'
            : !name.trim() ? 'Name it to submit'
              : !pinned ? 'Place the pin to submit'
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
