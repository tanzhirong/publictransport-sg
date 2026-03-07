import { useEffect, useRef, useState, useCallback } from 'react';
import { getBusIcon, getBusStopIcon } from '../utils/icons';
import { apiUrl } from '../utils/api';

const ROUTE_COLOR = '#1565C0';  // Material Blue 800
const BUS_REFRESH_MS = 30000;   // 30-second refresh
const SAMPLE_STOPS = 5;         // Number of stops to query for bus positions
const DEDUP_DISTANCE_M = 100;   // Dedup threshold in metres

// Icon sizing: small while route is selected + zoomed out; full size when zoomed in
const ICON_ZOOM_THRESHOLD = 15; // Match BusStopLayer threshold
const ICON_SIZE_SMALL  = 10;    // px — 50% of normal
const ICON_SIZE_NORMAL = 20;    // px — same as BusStopLayer normal

// Module-level cache — one object per size, created once, shared across re-renders
let _routeIconSmall  = null;
let _routeIconNormal = null;
function getRouteSmallIcon()  { if (!_routeIconSmall)  _routeIconSmall  = getBusStopIcon(ICON_SIZE_SMALL);  return _routeIconSmall; }
function getRouteNormalIcon() { if (!_routeIconNormal) _routeIconNormal = getBusStopIcon(ICON_SIZE_NORMAL); return _routeIconNormal; }

/**
 * Renders:
 *  1. A polyline connecting all stops on the selected bus route
 *  2. Live bus position markers (from LTA API GPS data)
 *  3. A bottom-center badge with the route name + close button
 */
export default function BusRouteLayer({ map, routeKey, routeStops, busStopMap, onClear, onBusStopClick, zoomLevel }) {
  const polylineRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const busMarkersRef = useRef([]);
  const refreshTimerRef = useRef(null);
  const onBusStopClickRef = useRef(onBusStopClick);
  const [busPositions, setBusPositions] = useState([]);

  // Keep ref up-to-date so click listeners in closed-over effects use latest callback
  useEffect(() => { onBusStopClickRef.current = onBusStopClick; }, [onBusStopClick]);

  const serviceNo = routeKey.split(' (')[0];

  // ── Polyline + direction arrows + route stop markers ──────
  useEffect(() => {
    if (!map || !routeStops || routeStops.length === 0) return;

    // Resolve stop codes → coordinates
    const path = [];
    const resolvedStops = []; // { code, lat, lng }
    const bounds = new window.google.maps.LatLngBounds();
    for (const code of routeStops) {
      const pos = busStopMap.get(code);
      if (pos) {
        const ll = new window.google.maps.LatLng(pos.lat, pos.lng);
        path.push(ll);
        bounds.extend(ll);
        resolvedStops.push({ code, lat: pos.lat, lng: pos.lng });
      }
    }

    if (path.length < 2) return;

    // Direction arrow symbol
    const arrowSymbol = {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 3,
      strokeColor: ROUTE_COLOR,
      strokeWeight: 2,
      fillColor: ROUTE_COLOR,
      fillOpacity: 1,
    };

    const polyline = new window.google.maps.Polyline({
      path,
      strokeColor: ROUTE_COLOR,
      strokeOpacity: 0.85,
      strokeWeight: 4,
      zIndex: 100,
      icons: [{ icon: arrowSymbol, offset: '10%', repeat: '120px' }],
      map,
    });

    polylineRef.current = polyline;

    // Route stop markers — start small; the zoom effect below immediately corrects
    // if the map is already zoomed in past the threshold.
    const stopIcon = getRouteSmallIcon();
    const stopMarkers = resolvedStops.map(({ code, lat, lng }) => {
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        icon: stopIcon,
        title: code,
        map,
        zIndex: 110,
        clickable: true,
      });
      marker.addListener('click', () => {
        if (onBusStopClickRef.current) {
          onBusStopClickRef.current({ id: code, lat, lng }, marker);
        }
      });
      return marker;
    });
    stopMarkersRef.current = stopMarkers;

    map.fitBounds(bounds, { top: 60, bottom: 80, left: 20, right: 20 });

    return () => {
      polyline.setMap(null);
      polylineRef.current = null;
      stopMarkers.forEach((m) => m.setMap(null));
      stopMarkersRef.current = [];
    };
  }, [map, routeStops, busStopMap]);

  // ── Fetch bus GPS positions ───────────────────────────────
  const fetchBusPositions = useCallback(async () => {
    if (!routeStops || routeStops.length === 0) return;

    // Pick evenly spaced sample stops
    const N = routeStops.length;
    const indices = [];
    if (N <= SAMPLE_STOPS * 2) {
      for (let i = 0; i < N; i++) indices.push(i);
    } else {
      for (let s = 0; s < SAMPLE_STOPS; s++) {
        indices.push(Math.round((s * (N - 1)) / (SAMPLE_STOPS - 1)));
      }
    }
    const sampled = [...new Set(indices)].map((i) => routeStops[i]);

    try {
      const responses = await Promise.allSettled(
        sampled.map((code) =>
          fetch(apiUrl(`/api/bus-arrival/${code}`)).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
        )
      );

      const positions = [];

      for (const result of responses) {
        if (result.status !== 'fulfilled') continue;
        const data = result.value;
        if (!data?.Services) continue;

        const svc = data.Services.find((s) => s.ServiceNo === serviceNo);
        if (!svc) continue;

        for (const key of ['NextBus', 'NextBus2', 'NextBus3']) {
          const bus = svc[key];
          if (!bus) continue;
          const lat = parseFloat(bus.Latitude);
          const lng = parseFloat(bus.Longitude);
          if (!lat || !lng || lat === 0 || lng === 0) continue;

          const arrivalMinutes = bus.EstimatedArrival
            ? Math.floor((new Date(bus.EstimatedArrival) - new Date()) / 60000)
            : null;

          positions.push({ lat, lng, load: bus.Load, arrivalMinutes });
        }
      }

      // Deduplicate nearby positions (same bus seen from multiple stops)
      const unique = [];
      for (const pos of positions) {
        const isDup = unique.some(
          (u) => haversineMetres(u.lat, u.lng, pos.lat, pos.lng) < DEDUP_DISTANCE_M
        );
        if (!isDup) unique.push(pos);
      }

      setBusPositions(unique);
    } catch (err) {
      console.error('[BusRouteLayer] Error fetching bus positions:', err);
    }
  }, [routeStops, serviceNo]);

  // Fetch on mount + auto-refresh every 30s
  useEffect(() => {
    fetchBusPositions();
    refreshTimerRef.current = setInterval(fetchBusPositions, BUS_REFRESH_MS);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [fetchBusPositions]);

  // ── Bus position markers ──────────────────────────────────
  useEffect(() => {
    // Clear old markers
    busMarkersRef.current.forEach((m) => m.setMap(null));
    busMarkersRef.current = [];

    if (!map || busPositions.length === 0) return;

    const newMarkers = busPositions.map((pos) => {
      const marker = new window.google.maps.Marker({
        position: { lat: pos.lat, lng: pos.lng },
        icon: getBusIcon(pos.load),
        map,
        zIndex: 200,
        title: `Bus ${serviceNo}${pos.arrivalMinutes != null ? ` (${pos.arrivalMinutes} min)` : ''}`,
      });
      return marker;
    });

    busMarkersRef.current = newMarkers;

    return () => {
      newMarkers.forEach((m) => m.setMap(null));
    };
  }, [map, busPositions, serviceNo]);

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (polylineRef.current) polylineRef.current.setMap(null);
      busMarkersRef.current.forEach((m) => m.setMap(null));
      stopMarkersRef.current.forEach((m) => m.setMap(null));
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, []);

  // ── Zoom-driven icon size for route stop markers ──────────
  // Small (10 px) while zoomed out; full size (20 px) when zoomed in past threshold.
  // Keeps parity with BusStopLayer's zoom behaviour.
  useEffect(() => {
    if (stopMarkersRef.current.length === 0) return;
    const icon = zoomLevel >= ICON_ZOOM_THRESHOLD ? getRouteNormalIcon() : getRouteSmallIcon();
    stopMarkersRef.current.forEach((m) => m.setOptions({ icon }));
  }, [zoomLevel]);

  // ── Route badge (rendered as a portal-style DOM element) ──
  return (
    <div className="bus-route-badge">
      <span>🚌 {routeKey}</span>
      <button onClick={onClear} title="Close route">✕</button>
    </div>
  );
}

// ── Haversine distance (metres) ──────────────────────────────
function haversineMetres(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
