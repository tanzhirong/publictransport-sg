import { useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { getBusStopIcon } from '../utils/icons';

// Renders bus stops with MarkerClusterer:
// - At low zoom: cluster bubbles showing count per region
// - At high zoom: individual red dot markers

// Click is only meaningful when individual stops are visible (zoom >= this threshold)
const CLICK_ZOOM_THRESHOLD = 14;

// Module-level icon cache — created once after Google Maps API loads, reused across all
// mounts. Sharing a single object reference lets the Maps API batch all 5,000+ stops
// into one canvas draw call (optimized: true) instead of drawing each individually.
let _cachedStopIcon = null;
function getStopIcon() {
  if (!_cachedStopIcon) _cachedStopIcon = getBusStopIcon();
  return _cachedStopIcon;
}

export default function BusStopLayer({ map, busStops, visible, onBusStopClick, selectedRoute, zoomLevel }) {
  const markersRef = useRef([]);
  const clustererRef = useRef(null);

  // Keep click handler ref so listeners never hold stale closures
  const onBusStopClickRef = useRef(onBusStopClick);
  useEffect(() => { onBusStopClickRef.current = onBusStopClick; }, [onBusStopClick]);

  // Build markers + clusterer once when stops arrive
  useEffect(() => {
    if (!map || !busStops || busStops.length === 0) return;

    const stopIcon = getStopIcon();

    const markers = busStops.map((stop) => {
      const marker = new window.google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        icon: stopIcon,
        // No `title` — unique per-marker titles prevent the Maps API from batching
        // markers into a single canvas draw call, causing significant render overhead.
        optimized: true,  // Canvas rendering: all stops drawn in one batched pass
        clickable: true,
      });

      marker.addListener('click', () => {
        if (onBusStopClickRef.current) onBusStopClickRef.current(stop, marker);
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

  // Toggle visibility — hide when not visible OR when a route is selected
  useEffect(() => {
    if (!clustererRef.current) return;
    if (visible && !selectedRoute) {
      clustererRef.current.setMap(map);
    } else {
      clustererRef.current.setMap(null);
      markersRef.current.forEach((m) => m.setMap(null));
    }
  }, [visible, map, selectedRoute]);

  // Fix 4: Toggle clickability based on zoom level.
  // Below CLICK_ZOOM_THRESHOLD individual stops are clustered so clicks aren't
  // meaningful. Marking them non-clickable removes them from the Maps API's
  // hit-test pass on every mouse move — reduces per-frame CPU cost while panning.
  useEffect(() => {
    if (markersRef.current.length === 0) return;
    const shouldBeClickable = zoomLevel >= CLICK_ZOOM_THRESHOLD;
    markersRef.current.forEach((m) => m.setOptions({ clickable: shouldBeClickable }));
  }, [zoomLevel]);

  return null;
}
