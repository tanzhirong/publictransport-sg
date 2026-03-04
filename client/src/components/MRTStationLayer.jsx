import { useEffect, useRef } from 'react';
import { getStationIcon, getPulseIcon } from '../utils/icons';
import { getStationPrimaryColor, LINE_COLORS } from '../utils/lineColors';
import { getWorstCrowdLevel } from '../utils/crowd';

// Custom OverlayView for multi-colored station labels
function createStationLabelOverlayClass() {
  class StationLabelOverlay extends window.google.maps.OverlayView {
    constructor(position, html) {
      super();
      this.position = position;
      this.html = html;
      this.div = null;
    }

    onAdd() {
      this.div = document.createElement('div');
      this.div.className = 'station-label';
      this.div.innerHTML = this.html;
      this.div.style.position = 'absolute';
      this.div.style.whiteSpace = 'nowrap';
      this.div.style.pointerEvents = 'none';
      this.div.style.display = 'none'; // Start hidden — toggled by showLabels
      // floatPane is the topmost overlay pane — station labels render above everything
      this.getPanes().floatPane.appendChild(this.div);
    }

    draw() {
      if (!this.div) return;
      const projection = this.getProjection();
      if (!projection) return;
      const pos = projection.fromLatLngToDivPixel(this.position);
      if (pos) {
        this.div.style.left = (pos.x + 12) + 'px';
        this.div.style.top = (pos.y - 8) + 'px';
      }
    }

    onRemove() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
      this.div = null;
    }

    setVisible(visible) {
      if (this.div) {
        this.div.style.display = visible ? '' : 'none';
      }
    }
  }
  return StationLabelOverlay;
}

// Build HTML label with color-coded station codes
function buildLabelHtml(stationName, codes) {
  const shortName = stationName
    .replace(/ MRT STATION$/, '')
    .replace(/ LRT STATION$/, '');

  const codeSpans = codes.map(({ code, line }) => {
    const color = LINE_COLORS[line] || '#666';
    return `<span class="station-code" style="color:${color}">${code}</span>`;
  }).join('<span class="station-sep">|</span>');

  return `${codeSpans} <span class="station-name">${shortName}</span>`;
}

export default function MRTStationLayer({
  map, stationCentroids, stationMapping, allCrowdData,
  showMarkers, showLabels, showPulse,
  onStationHover, onStationHoverOut
}) {
  const markersRef = useRef({});
  const pulseMarkersRef = useRef({});
  const pulseIntervalsRef = useRef({});
  const labelsRef = useRef({});
  const OverlayClassRef = useRef(null);
  // Refs for hover callbacks so they don't trigger re-creation
  const onStationHoverRef = useRef(onStationHover);
  const onStationHoverOutRef = useRef(onStationHoverOut);

  useEffect(() => { onStationHoverRef.current = onStationHover; }, [onStationHover]);
  useEffect(() => { onStationHoverOutRef.current = onStationHoverOut; }, [onStationHoverOut]);

  // Create markers + labels once when data arrives
  useEffect(() => {
    if (!map || !stationCentroids || !stationMapping) return;

    // Create overlay class (needs google.maps to be loaded)
    if (!OverlayClassRef.current) {
      OverlayClassRef.current = createStationLabelOverlayClass();
    }
    const OverlayClass = OverlayClassRef.current;

    for (const [stationName, centroid] of Object.entries(stationCentroids)) {
      const codes = stationMapping[stationName];
      if (!codes) continue;

      const primaryColor = getStationPrimaryColor(codes);
      const position = new window.google.maps.LatLng(centroid.lat, centroid.lng);

      // Main station marker (smaller dot, scale 5)
      const marker = new window.google.maps.Marker({
        position: centroid,
        icon: getStationIcon(primaryColor),
        map,
        zIndex: 100,
      });
      // Hover handlers instead of click
      marker.addListener('mouseover', () => {
        if (onStationHoverRef.current) {
          onStationHoverRef.current(stationName, marker);
        }
      });
      marker.addListener('mouseout', () => {
        if (onStationHoverOutRef.current) {
          onStationHoverOutRef.current();
        }
      });
      markersRef.current[stationName] = marker;

      // Pulse overlay marker (initially hidden)
      const pulseMarker = new window.google.maps.Marker({
        position: centroid,
        icon: getPulseIcon('#F44336', 18), // Start at red, scale 18
        map,
        clickable: false,
        zIndex: 99,
        visible: false,
      });
      pulseMarkersRef.current[stationName] = pulseMarker;

      // Label overlay with colored codes (starts hidden — only shown zoomed in)
      const labelHtml = buildLabelHtml(stationName, codes);
      const label = new OverlayClass(position, labelHtml);
      label.setMap(map);
      label.setVisible(false); // Hidden by default
      labelsRef.current[stationName] = label;
    }

    return () => {
      Object.values(markersRef.current).forEach((m) => m.setMap(null));
      Object.values(pulseMarkersRef.current).forEach((m) => m.setMap(null));
      Object.values(pulseIntervalsRef.current).forEach((id) => clearInterval(id));
      Object.values(labelsRef.current).forEach((l) => l.setMap(null));
      markersRef.current = {};
      pulseMarkersRef.current = {};
      pulseIntervalsRef.current = {};
      labelsRef.current = {};
    };
  }, [map, stationCentroids, stationMapping]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update pulse animation when crowd data changes
  useEffect(() => {
    if (!allCrowdData || !stationMapping) return;

    // Clear existing pulse intervals
    Object.values(pulseIntervalsRef.current).forEach((id) => clearInterval(id));
    pulseIntervalsRef.current = {};

    for (const [stationName, codes] of Object.entries(stationMapping)) {
      const pulseMarker = pulseMarkersRef.current[stationName];
      if (!pulseMarker) continue;

      const codeValues = codes.map((c) => c.code);
      const worstLevel = getWorstCrowdLevel(codeValues, allCrowdData);

      if (worstLevel === 'l' || !worstLevel) {
        // Green / no data: static, NO pulse
        pulseMarker.setVisible(false);
      } else if (showPulse) {
        // Yellow or Red: pulsing red ring (always red, bigger scale)
        pulseMarker.setVisible(true);
        const speed = worstLevel === 'h' ? 800 : 1500;
        let scale = 18;
        let growing = true;

        const intervalId = setInterval(() => {
          if (growing) {
            scale += 1.5;
            if (scale >= 30) growing = false;
          } else {
            scale -= 1.5;
            if (scale <= 18) growing = true;
          }
          pulseMarker.setIcon(getPulseIcon('#F44336', scale)); // Always red
        }, speed / 8);

        pulseIntervalsRef.current[stationName] = intervalId;
      }
    }
  }, [allCrowdData, stationMapping, showPulse]);

  // Toggle marker visibility (zoomed out only)
  useEffect(() => {
    Object.values(markersRef.current).forEach((m) => m.setVisible(showMarkers));
  }, [showMarkers]);

  // Toggle label visibility (zoomed in only)
  useEffect(() => {
    Object.values(labelsRef.current).forEach((l) => l.setVisible(showLabels));
  }, [showLabels]);

  // Toggle pulse visibility
  useEffect(() => {
    if (!showPulse) {
      Object.values(pulseMarkersRef.current).forEach((m) => m.setVisible(false));
      // Clear intervals when pulse is hidden
      Object.values(pulseIntervalsRef.current).forEach((id) => clearInterval(id));
      pulseIntervalsRef.current = {};
      return;
    }

    // Re-apply pulse states when becoming visible
    if (allCrowdData && stationMapping) {
      for (const [stationName, codes] of Object.entries(stationMapping)) {
        const pulseMarker = pulseMarkersRef.current[stationName];
        if (!pulseMarker) continue;
        const codeValues = codes.map((c) => c.code);
        const worstLevel = getWorstCrowdLevel(codeValues, allCrowdData);
        if (worstLevel === 'l' || !worstLevel) {
          pulseMarker.setVisible(false);
        } else {
          pulseMarker.setVisible(true);
        }
      }
    }
  }, [showPulse]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
