import { useState, useEffect } from 'react';

/**
 * Loads busRoutes.json once on mount.
 * Returns { busRoutes, loading } where busRoutes is:
 *   { "74 (Buona Vista Ter)": ["83139", "83141", ...], ... }
 */
export function useBusRouteData() {
  const [busRoutes, setBusRoutes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/busRoutes.json')
      .then((r) => r.json())
      .then((data) => {
        setBusRoutes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useBusRouteData] Failed to load bus routes:', err);
        setLoading(false);
      });
  }, []);

  return { busRoutes, loading };
}
