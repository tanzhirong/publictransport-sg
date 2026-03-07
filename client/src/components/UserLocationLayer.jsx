import { useEffect, useRef } from 'react';

/**
 * Shows the user's real-time GPS position on the map:
 *   • Blue dot  — exact position (zIndex 999, always on top)
 *   • Green translucent circle — GPS accuracy radius
 *
 * Requests browser geolocation on mount; silently does nothing if denied.
 * Requires HTTPS in production (Vercel handles this). Works on localhost too.
 */
export default function UserLocationLayer({ map }) {
  const dotRef    = useRef(null);
  const circleRef = useRef(null);
  const watchRef  = useRef(null);

  useEffect(() => {
    if (!map || !navigator.geolocation) return;

    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords: { latitude: lat, longitude: lng, accuracy } }) => {
        const pos = { lat, lng };

        if (!dotRef.current) {
          // First fix — create marker + circle
          dotRef.current = new window.google.maps.Marker({
            position: pos,
            map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#1A73E8',   // Google-blue dot
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2.5,
              scale: 7,
            },
            zIndex: 999,
            clickable: false,
            optimized: false,
            title: 'Your location',
          });

          // Green translucent accuracy bubble (user requested green)
          circleRef.current = new window.google.maps.Circle({
            center: pos,
            radius: accuracy,
            map,
            fillColor: '#34A853',
            fillOpacity: 0.15,
            strokeColor: '#34A853',
            strokeOpacity: 0.5,
            strokeWeight: 1,
            clickable: false,
            zIndex: 1,
          });
        } else {
          // Subsequent fixes — just move existing objects
          dotRef.current.setPosition(pos);
          circleRef.current.setCenter(pos);
          circleRef.current.setRadius(accuracy);
        }
      },
      (err) => {
        // Permission denied or position unavailable — fail silently
        console.warn('[UserLocation]', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
    );

    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      if (dotRef.current)    { dotRef.current.setMap(null);    dotRef.current    = null; }
      if (circleRef.current) { circleRef.current.setMap(null); circleRef.current = null; }
    };
  }, [map]);

  return null;
}
