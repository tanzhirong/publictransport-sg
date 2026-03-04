import { useEffect, useRef } from 'react';
import polygonClipping from 'polygon-clipping';

// Normalize station name for grouping (strip trailing spaces, etc.)
function normalizeName(name) {
  return (name || '').trim().toUpperCase();
}

// Check if a polygon name matches a known operational station
function isOperational(name, nameMap) {
  if (!nameMap) return false;
  const trimmed = name.trim();
  return !!(
    nameMap[trimmed] ||
    nameMap[trimmed.replace(/ INTERCHANGE$/, '')] ||
    nameMap[trimmed.replace(/ STATION$/, '')]
  );
}

// Resolve polygon name to full mapped station name
function resolveMappedName(name, nameMap) {
  if (!nameMap) return null;
  const trimmed = name.trim();
  return (
    nameMap[trimmed] ||
    nameMap[trimmed.replace(/ INTERCHANGE$/, '')] ||
    nameMap[trimmed.replace(/ STATION$/, '')] ||
    null
  );
}

export default function StationFootprintLayer({ map, footprintNameMap, visible, onFootprintHover, onFootprintHoverOut }) {
  const dataLayerRef = useRef(null);
  const plannedLabelsRef = useRef([]);
  const PlannedOverlayRef = useRef(null);

  // Use refs for callbacks so the Data layer handler always has latest values
  const footprintNameMapRef = useRef(footprintNameMap);
  const onFootprintHoverRef = useRef(onFootprintHover);
  const onFootprintHoverOutRef = useRef(onFootprintHoverOut);

  useEffect(() => { footprintNameMapRef.current = footprintNameMap; }, [footprintNameMap]);
  useEffect(() => { onFootprintHoverRef.current = onFootprintHover; }, [onFootprintHover]);
  useEffect(() => { onFootprintHoverOutRef.current = onFootprintHoverOut; }, [onFootprintHoverOut]);

  // Create Data layer once when map is available
  useEffect(() => {
    if (!map) return;

    const dataLayer = new window.google.maps.Data({ map: null });
    dataLayerRef.current = dataLayer;

    // Fetch and process GeoJSON manually for merge + planned detection
    fetch('/data/railStations.geojson')
      .then((r) => r.json())
      .then((geojson) => {
        const nameMap = footprintNameMapRef.current || {};

        // Group features by normalized name
        const groups = {};
        for (const feature of geojson.features) {
          const rawName = feature.properties.NAME || '';
          const key = normalizeName(rawName);
          if (!groups[key]) groups[key] = [];
          groups[key].push(feature);
        }

        // Build merged GeoJSON
        const mergedFeatures = [];
        for (const [key, features] of Object.entries(groups)) {
          const name = features[0].properties.NAME;
          const operational = isOperational(name, nameMap);

          if (features.length === 1) {
            // Single polygon — add as-is with planned flag
            const f = { ...features[0] };
            f.properties = { ...f.properties, _planned: !operational };
            mergedFeatures.push(f);
          } else {
            // Multiple polygons for same station (interchange) — compute geometric union
            // so overlapping areas become one shape with no internal boundaries
            try {
              // Collect all polygon coordinate arrays
              const polys = [];
              for (const f of features) {
                const geom = f.geometry;
                if (geom.type === 'Polygon') {
                  polys.push(geom.coordinates);
                } else if (geom.type === 'MultiPolygon') {
                  polys.push(...geom.coordinates);
                }
              }

              // Compute union of all polygons using polygon-clipping
              let merged = polys[0];
              for (let p = 1; p < polys.length; p++) {
                merged = polygonClipping.union(merged, polys[p]);
                // union returns MultiPolygon coords — if single polygon, unwrap
                if (merged.length === 1) merged = merged[0];
              }

              // Determine output geometry type
              const geomType = Array.isArray(merged[0]) && Array.isArray(merged[0][0]) && Array.isArray(merged[0][0][0])
                ? 'MultiPolygon'
                : 'Polygon';

              mergedFeatures.push({
                type: 'Feature',
                properties: { ...features[0].properties, _planned: !operational },
                geometry: { type: geomType, coordinates: merged },
              });
            } catch {
              // Fallback: if union fails, just use first polygon
              const f = { ...features[0] };
              f.properties = { ...f.properties, _planned: !operational };
              mergedFeatures.push(f);
            }
          }
        }

        const mergedGeoJson = { type: 'FeatureCollection', features: mergedFeatures };
        dataLayer.addGeoJson(mergedGeoJson);

        // Dynamic style: operational=grey, planned=yellow
        dataLayer.setStyle((feature) => {
          const planned = feature.getProperty('_planned');
          if (planned) {
            return {
              fillColor: '#FDD835',    // Yellow
              fillOpacity: 0.35,
              strokeColor: '#F9A825',  // Darker yellow
              strokeWeight: 1.5,
              strokeOpacity: 0.8,
              clickable: true,
            };
          }
          return {
            fillColor: '#BDBDBD',
            fillOpacity: 0.4,
            strokeColor: '#757575',
            strokeWeight: 1.5,
            clickable: true,
          };
        });

        // Create planned station labels
        if (!PlannedOverlayRef.current) {
          PlannedOverlayRef.current = createPlannedLabelClass();
        }
        const PlannedOverlay = PlannedOverlayRef.current;

        for (const feature of mergedFeatures) {
          if (!feature.properties._planned) continue;
          const name = (feature.properties.NAME || '').trim();
          // Compute centroid from polygon coordinates
          const centroid = computeCentroid(feature.geometry);
          if (!centroid) continue;

          const label = new PlannedOverlay(
            new window.google.maps.LatLng(centroid.lat, centroid.lng),
            name + ' (Planned)'
          );
          label.setMap(map);
          plannedLabelsRef.current.push(label);
        }
      });

    // Hover handler (mouseover)
    dataLayer.addListener('mouseover', (event) => {
      const name = event.feature.getProperty('NAME');
      const planned = event.feature.getProperty('_planned');
      if (!name) return;

      if (planned) {
        // Highlight planned polygon
        dataLayer.overrideStyle(event.feature, {
          fillOpacity: 0.55,
          strokeWeight: 2.5,
          strokeColor: '#F57F17',
        });
        // Show simple planned info popup
        if (onFootprintHoverRef.current) {
          onFootprintHoverRef.current(name.trim() + ' (Planned)', event.latLng);
        }
      } else {
        const nameMap = footprintNameMapRef.current;
        const mappedName = resolveMappedName(name, nameMap);
        if (mappedName && onFootprintHoverRef.current) {
          dataLayer.overrideStyle(event.feature, {
            fillOpacity: 0.6,
            strokeWeight: 2.5,
            strokeColor: '#424242',
          });
          onFootprintHoverRef.current(mappedName, event.latLng);
        }
      }
    });

    // Hover out handler
    dataLayer.addListener('mouseout', (event) => {
      dataLayer.revertStyle(event.feature);
      if (onFootprintHoverOutRef.current) {
        onFootprintHoverOutRef.current();
      }
    });

    return () => {
      if (dataLayerRef.current) {
        dataLayerRef.current.setMap(null);
        dataLayerRef.current = null;
      }
      plannedLabelsRef.current.forEach((l) => l.setMap(null));
      plannedLabelsRef.current = [];
    };
  }, [map]);

  // Toggle visibility (separate from creation)
  useEffect(() => {
    if (!dataLayerRef.current) return;
    dataLayerRef.current.setMap(visible ? map : null);
    // Show planned labels only when zoomed in very close (EXIT_ZOOM_THRESHOLD = 17)
    // This is handled by the visible prop which already checks isZoomedIn
    plannedLabelsRef.current.forEach((l) => l.setVisible(visible));
  }, [visible, map]);

  return null;
}

// Compute centroid from a Polygon or MultiPolygon geometry
function computeCentroid(geometry) {
  let coords = [];
  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0]; // outer ring
  } else if (geometry.type === 'MultiPolygon') {
    // Use all outer rings
    for (const poly of geometry.coordinates) {
      coords.push(...poly[0]);
    }
  }
  if (coords.length === 0) return null;
  const sumLng = coords.reduce((s, c) => s + c[0], 0);
  const sumLat = coords.reduce((s, c) => s + c[1], 0);
  return { lat: sumLat / coords.length, lng: sumLng / coords.length };
}

// OverlayView for planned station labels
function createPlannedLabelClass() {
  class PlannedLabelOverlay extends window.google.maps.OverlayView {
    constructor(position, text) {
      super();
      this.position = position;
      this.text = text;
      this.div = null;
    }

    onAdd() {
      this.div = document.createElement('div');
      this.div.style.cssText = [
        'position:absolute',
        'display:none',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
        'font-size:11px',
        'font-weight:600',
        'color:#F57F17',
        'background:rgba(255,255,255,0.9)',
        'border:1.5px solid #FDD835',
        'border-radius:3px',
        'padding:2px 6px',
        'white-space:nowrap',
        'pointer-events:none',
        'user-select:none',
        'box-shadow:0 1px 3px rgba(0,0,0,0.15)',
      ].join(';');
      this.div.textContent = this.text;
      this.getPanes().overlayLayer.appendChild(this.div);
    }

    draw() {
      if (!this.div) return;
      const projection = this.getProjection();
      if (!projection) return;
      const pos = projection.fromLatLngToDivPixel(this.position);
      if (pos) {
        this.div.style.left = (pos.x + 10) + 'px';
        this.div.style.top = (pos.y - 8) + 'px';
      }
    }

    onRemove() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
    }

    setVisible(vis) {
      if (this.div) this.div.style.display = vis ? '' : 'none';
    }
  }
  return PlannedLabelOverlay;
}
