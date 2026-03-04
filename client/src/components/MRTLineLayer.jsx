import { useEffect, useRef } from 'react';

// Future lines that should be rendered as dashed
const FUTURE_LINES = new Set(['CRL', 'JRL']);

// Dash symbol for future lines
function buildDashSymbol(color, weight = 3) {
  return [
    {
      icon: {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        strokeColor: color,
        strokeWeight: weight,
        scale: 3,
      },
      offset: '0',
      repeat: '18px',
    },
  ];
}

// Zigzag symbol for above-ground lines:
// A V/chevron shape repeated along the polyline — resembles a zigzag track icon
function buildZigzagSymbol(color) {
  return [
    {
      icon: {
        path: 'M -2,2 0,-2 2,2',
        strokeOpacity: 1,
        strokeColor: color,
        strokeWeight: 1.5,
        scale: 1.5,
        fillOpacity: 0,
      },
      offset: '6px',
      repeat: '20px',  // ← ZIGZAG SPACING (larger = less dense)
    },
  ];
}

export default function MRTLineLayer({ map, visible }) {
  const polylinesRef = useRef([]);
  const loadedRef = useRef(false);
  const mountedRef = useRef(true);
  const visibleRef = useRef(visible);

  // Keep ref in sync so the async callback uses latest value
  useEffect(() => {
    visibleRef.current = visible;
  });

  // Load GeoJSON and create polylines once
  useEffect(() => {
    mountedRef.current = true;
    if (!map || loadedRef.current) return;
    loadedRef.current = true;

    fetch('/data/railLines.geojson')
      .then((r) => r.json())
      .then((geojson) => {
        if (!mountedRef.current) return; // Component unmounted — bail out

        const polylines = [];

        for (const feature of geojson.features) {
          const props = feature.properties || {};
          const color = props.color || '#999999';
          const line = props.line || '';
          const grndLevel = props.GRND_LEVEL || '';
          const isFuture = FUTURE_LINES.has(line);
          const isAboveGround = grndLevel === 'ABOVEGROUND';

          // Extract coordinates: handle LineString and MultiLineString
          const geom = feature.geometry;
          let paths = [];
          if (geom.type === 'LineString') {
            paths = [geom.coordinates.map((c) => ({ lat: c[1], lng: c[0] }))];
          } else if (geom.type === 'MultiLineString') {
            paths = geom.coordinates.map((ring) =>
              ring.map((c) => ({ lat: c[1], lng: c[0] }))
            );
          }

          for (const path of paths) {
            if (isFuture && isAboveGround) {
              // Future + above-ground: thick dashed colored line + tie marks
              const dashLine = new window.google.maps.Polyline({
                path,
                strokeOpacity: 0,
                strokeWeight: 0,
                icons: buildDashSymbol(color, 5),
                clickable: false,
                zIndex: 50,
                map: visibleRef.current ? map : null,
              });
              polylines.push(dashLine);
            } else if (isFuture) {
              // Dashed line for future underground lines (CRL, JRL)
              const polyline = new window.google.maps.Polyline({
                path,
                strokeOpacity: 0,
                strokeWeight: 0,
                icons: buildDashSymbol(color),
                clickable: false,
                zIndex: 50,
                map: visibleRef.current ? map : null,
              });
              polylines.push(polyline);
            } else if (isAboveGround) {
              // Above-ground: solid base line + zigzag chevron overlay
              // 1. Base colored line
              const baseLine = new window.google.maps.Polyline({
                path,
                strokeColor: color,
                strokeWeight: 3,
                strokeOpacity: 0.85,
                clickable: false,
                zIndex: 50,
                map: visibleRef.current ? map : null,
              });
              polylines.push(baseLine);

              // 2. Colored zigzag on top
              const zigzagColor = new window.google.maps.Polyline({
                path,
                strokeOpacity: 0,
                strokeWeight: 0,
                icons: buildZigzagSymbol(color),
                clickable: false,
                zIndex: 52,
                map: visibleRef.current ? map : null,
              });
              polylines.push(zigzagColor);
            } else {
              // Regular underground line: solid colored stroke
              const polyline = new window.google.maps.Polyline({
                path,
                strokeColor: color,
                strokeWeight: 3,
                strokeOpacity: 0.85,
                clickable: false,
                zIndex: 50,
                map: visibleRef.current ? map : null,
              });
              polylines.push(polyline);
            }
          }
        }

        polylinesRef.current = polylines;
      })
      .catch((err) => console.error('[MRTLineLayer] Failed to load GeoJSON:', err));

    return () => {
      mountedRef.current = false;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      loadedRef.current = false; // Allow reload on remount
    };
  }, [map]);

  // Toggle visibility
  useEffect(() => {
    polylinesRef.current.forEach((p) => {
      p.setMap(visible ? map : null);
    });
  }, [visible, map]);

  return null;
}
