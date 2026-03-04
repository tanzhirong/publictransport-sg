import { useEffect, useRef } from 'react';

// Renders each exit as a single HTML OverlayView:
//   [■] Exit A
// The dark square icon and "Exit A" text sit side-by-side in one div.
// This avoids all Google Maps Marker label quirks.
function createExitOverlayClass() {
  class ExitOverlay extends window.google.maps.OverlayView {
    constructor(position, exitCode) {
      super();
      this.position = position;
      this.exitCode = exitCode; // Already the full string e.g. "Exit A" or "Exit 1"
      this.div = null;
    }

    onAdd() {
      const div = document.createElement('div');
      div.style.cssText = [
        'position:absolute',
        'display:none',        // Start hidden — shown only when isExitZoomedIn
        'align-items:center',
        'gap:5px',
        'pointer-events:none',
        'user-select:none',
      ].join(';');

      // Dark square icon
      const icon = document.createElement('div');
      icon.style.cssText = [
        'width:14px',
        'height:14px',
        'background:#37474F',
        'border:2px solid #FFFFFF',
        'border-radius:3px',
        'flex-shrink:0',
        'box-shadow:0 1px 3px rgba(0,0,0,0.35)',
      ].join(';');

      // Exit label text  ← EXIT LABEL FONT SIZE: change font-size here
      const label = document.createElement('div');
      label.style.cssText = [
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
        'font-size:11px',
        'font-weight:800',
        'color:#263238',
        'background:rgba(255,255,255,0.93)',
        'border:1.5px solid #90A4AE',
        'border-radius:3px',
        'padding:1px 5px',
        'white-space:nowrap',
        'box-shadow:0 1px 3px rgba(0,0,0,0.18)',
        'line-height:1.5',
      ].join(';');
      label.textContent = this.exitCode; // e.g. "Exit A" — no prefix added

      div.appendChild(icon);
      div.appendChild(label);
      this.div = div;
      // overlayImage pane sits above markers but below floatPane (station labels)
      this.getPanes().overlayImage.appendChild(div);
    }

    draw() {
      if (!this.div) return;
      const projection = this.getProjection();
      if (!projection) return;
      const pos = projection.fromLatLngToDivPixel(this.position);
      if (pos) {
        // Center vertically on the point, extend right
        this.div.style.left = (pos.x - 7) + 'px';  // -7 = half icon width
        this.div.style.top = (pos.y - 9) + 'px';   // -9 = half row height
      }
    }

    onRemove() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
    }

    setVisible(vis) {
      if (this.div) this.div.style.display = vis ? 'flex' : 'none';
    }
  }
  return ExitOverlay;
}

export default function MRTExitLayer({ map, mrtExits, visible }) {
  const overlaysRef = useRef([]);
  const OverlayClassRef = useRef(null);

  // Create overlays once
  useEffect(() => {
    if (!map || !mrtExits || mrtExits.length === 0) return;

    if (!OverlayClassRef.current) {
      OverlayClassRef.current = createExitOverlayClass();
    }
    const OverlayClass = OverlayClassRef.current;

    const overlays = mrtExits.map((exit) => {
      // exitCode is already "Exit 1", "Exit A" etc from the GeoJSON — use as-is
      const exitCode = exit.exitCode || 'Exit';
      const overlay = new OverlayClass(
        new window.google.maps.LatLng(exit.lat, exit.lng),
        exitCode
      );
      overlay.setMap(map);
      return overlay;
    });

    overlaysRef.current = overlays;

    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
    };
  }, [map, mrtExits]);

  // Toggle visibility
  useEffect(() => {
    overlaysRef.current.forEach((o) => o.setVisible(visible));
  }, [visible]);

  return null;
}
