import { useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { getBusStopIcon } from '../utils/icons';

// Renders bus stops with MarkerClusterer:
// - At low zoom: cluster bubbles showing count per region
// - At high zoom: individual red bus icons

// Click is only meaningful when individual stops are visible (zoom >= this threshold)
const CLICK_ZOOM_THRESHOLD = 14;

// Icon switches to full size above this zoom; smaller below to avoid clutter
const ICON_ZOOM_THRESHOLD = 15;
const ICON_SIZE_SMALL  = 13;  // px — zoomed out (stops clustered, icon rarely seen)
const ICON_SIZE_NORMAL = 20;  // px — zoomed in  (individual stops clearly visible)

// Module-level icon cache — two sizes created once, reused forever.
// Sharing a single object reference per size lets the Maps API batch all 5,000+
// markers into one canvas draw call (optimized: true).
let _iconSmall  = null;
let _iconNormal = null;
function getSmallIcon()  { if (!_iconSmall)  _iconSmall  = getBusStopIcon(ICON_SIZE_SMALL);  return _iconSmall;  }
function getNormalIcon() { if (!_iconNormal) _iconNormal = getBusStopIcon(ICON_SIZE_NORMAL); return _iconNormal; }

export default function BusStopLayer({ map, busStops, visible, onBusStopClick, selectedRoute, zoomLevel }) {
  const markersRef  = useRef([]);
  const clustererRef = useRef(null);

  // Keep click handler ref so listeners never hold stale closures
  const onBusStopClickRef = useRef(onBusStopClick);
  useEffect(() => { onBusStopClickRef.current = onBusStopClick; }, [onBusStopClick]);

  // Build markers + clusterer once when stops arrive
  useEffect(() => {
    if (!map || !busStops || busStops.length === 0) return;

    // Start with small icon; the zoom effect below immediately corrects it if needed
    const initialIcon = getNormalIcon();

    const markers = busStops.map((stop) => {
      const marker = new window.google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        icon: initialIcon,
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
      markers.forEach((m) => {
        window.google.maps.event.clearListeners(m, 'click');
        m.setMap(null);
      });
      clusterer.clearMarkers();
      clusterer.setMap(null);
      markersRef.current  = [];
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

  // Zoom-driven updates: clickability + icon size
  // Below CLICK_ZOOM_THRESHOLD — stops are clustered, clicks aren't meaningful.
  // Marking non-clickable removes them from the Maps API hit-test on every mouse
  // move, reducing per-frame CPU cost while panning at low zoom.
  useEffect(() => {
    if (markersRef.current.length === 0) return;
    const clickable = zoomLevel >= CLICK_ZOOM_THRESHOLD;
    const icon      = zoomLevel >= ICON_ZOOM_THRESHOLD ? getNormalIcon() : getSmallIcon();
    markersRef.current.forEach((m) => m.setOptions({ clickable, icon }));
  }, [zoomLevel]);

  return null;
}
