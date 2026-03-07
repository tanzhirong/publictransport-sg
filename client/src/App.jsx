import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl } from './utils/api';
import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import BusRouteSearch from './components/BusRouteSearch';
import AddressSearch from './components/AddressSearch';
import DelayBanner from './components/DelayBanner';
import DelayToast from './components/DelayToast';
import { useBusRouteData } from './hooks/useBusRouteData';
import './App.css';

const ALERT_POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes

export default function App() {
  // Mutually exclusive layers: 'mrt' or 'bus'
  const [activeLayer, setActiveLayer] = useState('mrt');
  const showMRT = activeLayer === 'mrt';
  const showBus = activeLayer === 'bus';

  // Bus route data + selection
  const { busRoutes } = useBusRouteData();
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Clear selected route when switching away from bus layer
  const handleSetLayer = useCallback((layer) => {
    setActiveLayer(layer);
    if (layer !== 'bus') setSelectedRoute(null);
  }, []);

  // Address search: map instance ref + selected address state
  const mapRef = useRef(null);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const handleAddressSelect = useCallback((lat, lng, label) => {
    if (lat == null) {
      // Cleared — remove pin
      setSelectedAddress(null);
      return;
    }
    setSelectedAddress({ lat, lng, label });
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(17);
    }
  }, []);

  // Delay alert state
  const [alerts, setAlerts] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);

  // Poll for train alerts every 2 minutes
  useEffect(() => {
    function fetchAlerts() {
      fetch(apiUrl('/api/train-alerts'))
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
    fetch(apiUrl('/api/train-alerts/sample'))
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
        onSetLayer={handleSetLayer}
        onSampleDelay={handleSampleDelay}
      />

      {/* Bus route search — top-left, Bus mode only */}
      <BusRouteSearch
        busRoutes={busRoutes}
        onRouteSelect={setSelectedRoute}
        visible={showBus}
      />

      {/* Address / place search — top-left, both modes.
          offsetTop shifts it down in Bus mode so it clears BusRouteSearch. */}
      <AddressSearch
        onSelect={handleAddressSelect}
        offsetTop={showBus}
      />

      <MapView
        showBus={showBus}
        showMRT={showMRT}
        selectedRoute={selectedRoute}
        onRouteSelect={setSelectedRoute}
        busRoutes={busRoutes}
        onMapReady={(m) => { mapRef.current = m; }}
        selectedAddress={selectedAddress}
      />
    </div>
  );
}
