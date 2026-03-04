import { useState, useCallback } from 'react';

export function useBusArrival() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchArrival = useCallback(async (busStopCode) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/bus-arrival/${busStopCode}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchArrival };
}
