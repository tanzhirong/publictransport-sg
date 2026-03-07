// SVG symbol definitions for map markers
// These must be called after Google Maps JS API is loaded

export function getBusStopIcon(size = 20) {
  // Red rounded-square with a white bus silhouette (side view).
  // `size` controls the rendered pixel dimensions — call with a smaller value
  // when zoomed out so the icons don't dominate the map.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 26 26">
    <rect width="26" height="26" rx="6" fill="#E53935"/>
    <rect x="3.5" y="7" width="19" height="10" rx="2" fill="white"/>
    <rect x="5" y="8.5" width="6.5" height="4" rx="0.8" fill="#E53935"/>
    <rect x="14.5" y="8.5" width="4.5" height="4" rx="0.8" fill="#E53935"/>
    <line x1="13" y1="8.5" x2="13" y2="12.5" stroke="#E53935" stroke-width="1"/>
    <circle cx="8" cy="19" r="2.5" fill="white"/>
    <circle cx="8" cy="19" r="1.2" fill="#E53935"/>
    <circle cx="18" cy="19" r="2.5" fill="white"/>
    <circle cx="18" cy="19" r="1.2" fill="#E53935"/>
  </svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2),
  };
}

export function getMRTExitIcon() {
  // Clean exit icon: solid dark rounded square, centered on the exit point
  // Uses a simple square path so fill renders correctly and nothing sticks out
  return {
    path: 'M -5,-5 L 5,-5 L 5,5 L -5,5 Z',
    fillColor: '#37474F',    // Dark blue-grey fill
    fillOpacity: 1,
    strokeColor: '#FFFFFF',  // White border for contrast
    strokeWeight: 1.5,
    scale: 1.5,
    anchor: new window.google.maps.Point(0, 0),
  };
}

// Unified station icon (zoomed-out view — small dot)
export function getStationIcon(fillColor = '#E91E63') {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor,
    fillOpacity: 1,
    strokeColor: '#333333',
    strokeWeight: 1.5,
    scale: 5,
  };
}

// Live bus position marker (colored by load)
export function getBusIcon(load) {
  const loadColors = {
    SEA: '#4CAF50',  // Seats available (green)
    SDA: '#FFC107',  // Standing available (yellow)
    LSD: '#F44336',  // Limited standing (red)
  };
  const color = loadColors[load] || '#1565C0'; // Default blue
  return {
    path: 'M -6,-8 L 6,-8 L 6,4 L 4,8 L -4,8 L -6,4 Z', // Bus shape
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 1.8,
    anchor: new window.google.maps.Point(0, 0),
  };
}

// Pulse ring icon (animated overlay for crowd visualization)
export function getPulseIcon(color = '#F44336', scale = 14) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 0.3,
    strokeColor: color,
    strokeWeight: 1,
    scale,
  };
}
