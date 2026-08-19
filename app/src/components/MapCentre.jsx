import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Keeps a map pinned to a moving coordinate. `MapContainer`'s `center` prop is
// only read when the map is created, so a map that should follow the user
// needs this — otherwise it sits wherever the first render put it.
export default function MapCentre({ lat, lng, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], zoom ?? map.getZoom(), { animate: false });
  }, [map, lat, lng, zoom]);

  return null;
}
