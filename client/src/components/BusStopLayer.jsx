import { useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { getBusStopIcon } from '../utils/icons';

// Renders bus stops with MarkerClusterer:
// - At low zoom: cluster bubbles showing count per region
// - At high zoom: individual red dot markers

export default function BusStopLayer({ map, busStops, visible, onBusStopClick }) {
  const markersRef = useRef([]);
  const clustererRef = useRef(null);

  // Build markers + clusterer once when stops arrive
  useEffect(() => {
    if (!map || !busStops || busStops.length === 0) return;

    const stopIcon = getBusStopIcon();

    const markers = busStops.map((stop) => {
      const marker = new window.google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        icon: stopIcon,
        title: stop.id,
        clickable: true,
      });

      marker.addListener('click', () => {
        if (onBusStopClick) onBusStopClick(stop, marker);
      });

      return marker;
    });

    markersRef.current = markers;

    const clusterer = new MarkerClusterer({
      map: visible ? map : null,
      markers,
    });

    clustererRef.current = clusterer;

    return () => {
      // Clean up markers and clusterer
      markers.forEach((m) => {
        window.google.maps.event.clearListeners(m, 'click');
        m.setMap(null);
      });
      clusterer.clearMarkers();
      clusterer.setMap(null);
      markersRef.current = [];
      clustererRef.current = null;
    };
  }, [map, busStops]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle visibility
  useEffect(() => {
    if (!clustererRef.current) return;
    if (visible) {
      clustererRef.current.setMap(map);
    } else {
      clustererRef.current.setMap(null);
      // Also hide individual markers that may be outside clusters
      markersRef.current.forEach((m) => m.setMap(null));
    }
  }, [visible, map]);

  return null;
}
