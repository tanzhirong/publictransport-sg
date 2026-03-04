import React, { useState, useEffect, useCallback } from 'react';
import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import DelayBanner from './components/DelayBanner';
import DelayToast from './components/DelayToast';
import './App.css';

const ALERT_POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes

export default function App() {
  // Mutually exclusive layers: 'mrt' or 'bus'
  const [activeLayer, setActiveLayer] = useState('mrt');
  const showMRT = activeLayer === 'mrt';
  const showBus = activeLayer === 'bus';

  // Delay alert state
  const [alerts, setAlerts] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);

  // Poll for train alerts every 2 minutes
  useEffect(() => {
    function fetchAlerts() {
      fetch('/api/train-alerts')
        .then((r) => r.json())
        .then((data) => {
          setAlerts(data);
          // Reset dismiss state if alert transitions from normal → delay
          if (data.Status === 2) {
            setBannerDismissed(false);
            setToastDismissed(false);
          }
        })
        .catch((err) => console.error('[App] Failed to fetch train alerts:', err));
    }

    fetchAlerts();
    const timer = setInterval(fetchAlerts, ALERT_POLL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // Sample delay button handler
  const handleSampleDelay = useCallback(() => {
    fetch('/api/train-alerts/sample')
      .then((r) => r.json())
      .then((data) => {
        setAlerts(data);
        setBannerDismissed(false);
        setToastDismissed(false);
      })
      .catch((err) => console.error('[App] Failed to fetch sample delay:', err));
  }, []);

  return (
    <div className="app">
      {/* Fixed top banner — shown when delay detected & not dismissed */}
      {!bannerDismissed && (
        <DelayBanner
          alerts={alerts}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Floating toast — shown when delay detected & not dismissed */}
      {!toastDismissed && (
        <DelayToast
          alerts={alerts}
          onDismiss={() => setToastDismissed(true)}
        />
      )}

      <FilterPanel
        activeLayer={activeLayer}
        onSetLayer={setActiveLayer}
        onSampleDelay={handleSampleDelay}
      />
      <MapView showBus={showBus} showMRT={showMRT} />
    </div>
  );
}
