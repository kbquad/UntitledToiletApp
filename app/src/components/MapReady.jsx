import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Two jobs:
//  1. Hand the Leaflet map instance up to the parent (react-leaflet v5 only
//     exposes it from inside the tree, via useMap()).
//  2. Keep Leaflet's idea of its own size correct. Leaflet measures the
//     container once on init; if that happens before layout settles — or the
//     viewport changes on rotate / when mobile browser chrome hides — tiles
//     and markers end up offset until it re-measures.
export default function MapReady({ onReady }) {
  const map = useMap();

  useEffect(() => {
    if (onReady) onReady(map);
  }, [map, onReady]);

  useEffect(() => {
    const refresh = () => map.invalidateSize();

    // after the first paint, once the container has its real size
    const raf = requestAnimationFrame(refresh);

    const container = map.getContainer();
    const observer = new ResizeObserver(refresh);
    observer.observe(container);

    window.addEventListener('orientationchange', refresh);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('orientationchange', refresh);
    };
  }, [map]);

  return null;
}
