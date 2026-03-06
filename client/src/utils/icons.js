// SVG symbol definitions for map markers
// These must be called after Google Maps JS API is loaded

export function getBusStopIcon() {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: '#E53935',   // Red — high contrast on grey map
    fillOpacity: 0.9,
    strokeColor: '#B71C1C', // Dark red border
    strokeWeight: 1,
    scale: 5,               // ← BUS STOP DOT SIZE
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
