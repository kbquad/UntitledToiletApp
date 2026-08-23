import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MapReady from '../components/MapReady';
import { useStore } from '../store';
import { useToastStore } from '../toastStore';
import { useWashroomData, useCurrentLocation } from '../hooks/useWashroomData';
import { useDataStore } from '../dataStore';
import { requestLocation } from '../lib/geolocation';
import { CITIES, CANADA_VIEW } from '../data/locations';
import { pinIcon, youAreHereIcon } from '../utils/mapIcons';
import { IconSearch, IconFilter, IconPlus, IconTarget } from '../components/Icons';
import { Chip } from '../components/ui';


export default function MapScreen({ t }) {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const flash = useToastStore((s) => s.flash);
  const dark = useStore((s) => s.dark);
  const saved = useStore((s) => s.saved);
  const filters = useStore((s) => s.filters);
  const minClean = useStore((s) => s.minClean);

  const { mapPool, sorted } = useWashroomData();
  const here = useCurrentLocation();
  const loadRegion = useDataStore((s) => s.loadRegion);

  const [map, setMap] = useState(null);
  const [recentring, setRecentring] = useState(false);
  const onReady = useCallback((m) => setMap(m), []);
  const flownForState = useRef(false);

  useEffect(() => {
    if (!map || flownForState.current) return;
    flownForState.current = true;
    const flyTo = routerLocation.state?.flyTo;
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], 13, { duration: 1 });
      flash(`Looking around ${flyTo.name}…`);
    }
  }, [map, routerLocation.state, flash]);

  // Panning somewhere new fetches that region. Washrooms accumulate as you
  // explore rather than being thrown away, so panning back is instant.
  useEffect(() => {
    if (!map) return undefined;
    const onMoved = () => {
      const c = map.getCenter();
      loadRegion(c.lat, c.lng);
    };
    map.on('moveend', onMoved);
    onMoved();
    return () => { map.off('moveend', onMoved); };
  }, [map, loadRegion]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (minClean ? 1 : 0);

  // Take a fresh reading rather than flying to wherever we last saw them —
  // "recentre on me" is exactly the moment a stale position is most obvious.
  const recentre = async () => {
    if (recentring) return;
    setRecentring(true);
    const fix = await requestLocation();
    setRecentring(false);
    const target = fix ?? here;
    map?.flyTo([target.lat, target.lng], 15, { duration: 1 });
    flash(fix
      ? 'Centred on where you are now.'
      : `Couldn’t get a fix — centred on ${here.label}.`);
  };

  return (
    <div className="screen" style={{ background: t.mapWater }}>
      <MapContainer
        // Opens where the user is. Without a fix it opens on the whole country
        // rather than on some city they may be nowhere near.
        center={here.fromDevice ? [here.lat, here.lng] : [CANADA_VIEW.lat, CANADA_VIEW.lng]}
        zoom={here.fromDevice ? 14 : CANADA_VIEW.zoom}
        zoomControl={false}
        attributionControl={false}
        style={{ position: 'absolute', inset: 0 }}
      >
        <MapReady onReady={onReady} />
        <TileLayer
          key={dark ? 'dark' : 'light'}
          // detectRetina is what makes {r} resolve to "@2x" — without it the
          // placeholder collapses to nothing and a phone gets tiles at half
          // the resolution its screen can show.
          detectRetina
          maxZoom={20}
          maxNativeZoom={20}
          url={dark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}
        />
        {here.fromDevice && <Marker position={[here.lat, here.lng]} icon={youAreHereIcon(t.ink)} opacity={here.live ? 1 : 0.45} />}
        {mapPool.map((w) => (
          <Marker
            key={`${w.id}-${dark}-${saved.includes(w.id)}-${w.scoreText}`}
            position={[w.lat, w.lng]}
            icon={pinIcon(w, { saved: saved.includes(w.id), cardColor: t.card, unratedColor: t.sub })}
            eventHandlers={{ click: () => navigate(`/washroom/${w.id}`) }}
          >
            <Popup>{w.name}</Popup>
          </Marker>
        ))}
      </MapContainer>

      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, padding: '14px 16px 18px', paddingTop: 'calc(14px + var(--safe-t))',
        background: `linear-gradient(${t.bg} 0%, ${t.fadeOut} 100%)`, pointerEvents: 'none', zIndex: 1000,
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 15px', borderRadius: 14, background: t.card, border: `1px solid ${t.line}`, boxShadow: '0 6px 20px rgba(0,0,0,.1)' }}>
            <IconSearch color={t.sub} />
            <span style={{ fontSize: 13.5, color: t.sub }}>Search a place in Canada</span>
          </div>
          <button type="button" aria-label="Filters" onClick={() => navigate('/filters')} style={{ width: 46, height: 46, borderRadius: 14, background: t.ink, border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,.2)', position: 'relative' }}>
            <IconFilter />
            {activeFilterCount > 0 && (
              <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 9, background: t.accent, color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${t.bg}` }}>{activeFilterCount}</span>
            )}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 11, overflowX: 'auto', pointerEvents: 'auto', paddingRight: 8 }}>
          {CITIES.map((n) => (
            <Chip
              key={n.name}
              label={n.name}
              t={t}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}
              onClick={() => {
                map?.flyTo([n.lat, n.lng], 13, { duration: 1 });
                flash(`Looking around ${n.name}…`);
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', right: 16, bottom: 'calc(204px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000 }}>
        <div style={{ borderRadius: 14, overflow: 'hidden', background: t.card, border: `1px solid ${t.line}`, boxShadow: '0 6px 18px rgba(0,0,0,.14)' }}>
          <button type="button" aria-label="Zoom in" onClick={() => map?.zoomIn()} style={{ display: 'block', width: 44, height: 40, border: 0, borderBottom: `1px solid ${t.line}`, background: 'transparent', cursor: 'pointer', color: t.text, fontSize: 17, lineHeight: 1 }}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => map?.zoomOut()} style={{ display: 'block', width: 44, height: 40, border: 0, background: 'transparent', cursor: 'pointer', color: t.text, fontSize: 17, lineHeight: 1 }}>−</button>
        </div>
        <button
          type="button"
          aria-label="Recentre on my location"
          onClick={recentre}
          style={{ width: 44, height: 44, borderRadius: 14, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,.14)' }}
        >
          <IconTarget color={recentring ? t.sub : t.ink} />
        </button>
        <button type="button" aria-label="Add a washroom" onClick={() => navigate('/add')} style={{ width: 44, height: 44, borderRadius: 14, background: t.accent, border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,.2)' }}>
          <IconPlus />
        </button>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: '22px 22px 0 0', background: t.card, borderTop: `1px solid ${t.line}`, boxShadow: '0 -12px 34px rgba(0,0,0,.16)', padding: '9px 0 16px', paddingBottom: 'var(--scroll-pad-b)', zIndex: 1000 }}>
        <button type="button" onClick={() => navigate('/list')} style={{ display: 'block', width: '100%', border: 0, background: 'transparent', padding: '0 0 6px', cursor: 'pointer' }}>
          <div style={{ width: 42, height: 4, borderRadius: 2, background: t.line2, margin: '0 auto' }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '4px 18px 10px' }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-.02em', color: t.text }}>
            {mapPool.length} washroom{mapPool.length === 1 ? '' : 's'} around here
          </div>
          <button type="button" onClick={() => navigate('/list')} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: t.ink }}>See all</button>
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 18px 6px', overflowX: 'auto' }}>
          {(sorted.length ? sorted : mapPool).slice(0, 4).map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => navigate(`/washroom/${w.id}`)}
              style={{ flex: 'none', width: 212, textAlign: 'left', padding: '13px 14px', borderRadius: 16, background: t.bg, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 7 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: w.rated ? w.scoreBg : t.tagBg, color: w.rated ? w.scoreFg : t.sub,
                }}
                >
                  {w.rated ? w.scoreText : 'New'}
                </span>
                <span style={{ fontSize: 11, color: t.sub }}>{w.distLabel}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-.01em', color: t.text, lineHeight: 1.3 }}>{w.name}</div>
              <div style={{ fontSize: 11, color: t.sub, lineHeight: 1.4 }}>{w.reviewLabel}</div>
            </button>
          ))}
        </div>
        <div style={{ padding: '8px 18px 0', fontSize: 9.5, color: t.sub, opacity: 0.75 }}>
          Map data ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>OpenStreetMap</a>
          {' '}contributors · tiles ©{' '}
          <a href="https://carto.com/attributions" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>CARTO</a>
        </div>
      </div>
    </div>
  );
}
