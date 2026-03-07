import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import ReactDOMServer from 'react-dom/server';
import { apiUrl } from '../utils/api';
import BusStopLayer from './BusStopLayer';
import MRTExitLayer from './MRTExitLayer';
import MRTLineLayer from './MRTLineLayer';
import MRTStationLayer from './MRTStationLayer';
import StationFootprintLayer from './StationFootprintLayer';
import BusRouteLayer from './BusRouteLayer';
import BusArrivalInfo from './BusArrivalInfo';
import MRTCrowdInfo from './MRTCrowdInfo';
import { useBusArrival } from '../hooks/useBusArrival';

const MAP_CENTER = { lat: 1.3521, lng: 103.8198 };
const MAP_ZOOM = 12;
const ZOOM_THRESHOLD = 15;        // Zoom for station footprints
const LABEL_ZOOM_THRESHOLD = 15; // ← STATION LABEL ZOOM (change this to adjust when labels appear)
const EXIT_ZOOM_THRESHOLD = 17;  // ← EXIT ICON ZOOM (higher = more zoomed in required)
const CROWD_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Fix anomalous GeoJSON entries where STATION_NA is a code instead of a name
const EXIT_NAME_FIXES = {
  'CC9': 'PAYA LEBAR MRT STATION',
  'DT18': 'TELOK AYER MRT STATION',
  'DT4': 'HUME MRT STATION',
};

const mapContainerStyle = {
  width: '100%',
  height: '100vh'
};

// Light greyscale map styling
const GREY_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#999999' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#aaaaaa' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#aaaaaa' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#bbbbbb' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.line', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.station', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#f0f0f0' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e8e8e8' }] },
];

const mapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
  gestureHandling: 'greedy',
  styles: GREY_MAP_STYLES,
};

export default function MapView({ showBus, showMRT, selectedRoute, onRouteSelect, busRoutes }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState(null);
  const infoWindowRef = useRef(null);

  // Zoom tracking
  const [zoomLevel, setZoomLevel] = useState(MAP_ZOOM);
  const zoomTimerRef = useRef(null);
  const isZoomedIn = zoomLevel >= ZOOM_THRESHOLD;
  const isLabelZoomedIn = zoomLevel >= LABEL_ZOOM_THRESHOLD;
  const isExitZoomedIn = zoomLevel >= EXIT_ZOOM_THRESHOLD;

  // Data state
  const [busStops, setBusStops] = useState([]);
  const busStopsLoadedRef = useRef(false);
  const [mrtExits, setMRTExits] = useState([]);
  const [stationMapping, setStationMapping] = useState(null);
  const [trainSchedule, setTrainSchedule] = useState(null);
  const [stationCentroids, setStationCentroids] = useState(null);
  const [allCrowdData, setAllCrowdData] = useState(null);

  // Bus arrival state
  const { data: busData, loading: busLoading, error: busError, fetchArrival } = useBusArrival();
  const [selectedBusStop, setSelectedBusStop] = useState(null);

  // Debounced zoom listener
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('zoom_changed', () => {
      if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
      zoomTimerRef.current = setTimeout(() => {
        setZoomLevel(map.getZoom());
      }, 150);
    });
    return () => {
      window.google.maps.event.removeListener(listener);
      if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    };
  }, [map]);

  // Load MRT data + station mapping on mount (NOT bus stops — lazy loaded)
  useEffect(() => {
    Promise.all([
      fetch('/data/mrtExits.geojson').then((r) => r.json()),
      fetch(apiUrl('/api/mrt-crowd/station-mapping')).then((r) => r.json()),
      fetch('/data/trainSchedule.json').then((r) => r.json()).catch(() => ({})),
    ]).then(([mrtGeo, mapping, schedule]) => {
      const exits = mrtGeo.features.map((f) => ({
        id: f.properties.OBJECTID,
        stationName: EXIT_NAME_FIXES[f.properties.STATION_NA] || f.properties.STATION_NA,
        exitCode: f.properties.EXIT_CODE,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0]
      }));
      setMRTExits(exits);

      // Compute station centroids
      const groups = {};
      for (const exit of exits) {
        if (!groups[exit.stationName]) groups[exit.stationName] = [];
        groups[exit.stationName].push(exit);
      }

      const centroids = {};
      for (const [name, stationExits] of Object.entries(groups)) {
        const sumLat = stationExits.reduce((s, e) => s + e.lat, 0);
        const sumLng = stationExits.reduce((s, e) => s + e.lng, 0);
        centroids[name] = {
          lat: sumLat / stationExits.length,
          lng: sumLng / stationExits.length,
        };
      }
      setStationCentroids(centroids);
      setStationMapping(mapping);
      setTrainSchedule(schedule);
    });
  }, []);

  // Lazy-load bus stops on first showBus=true OR when a route is selected
  useEffect(() => {
    if ((!showBus && !selectedRoute) || busStopsLoadedRef.current) return;
    busStopsLoadedRef.current = true;

    // busStops.json is pre-slimmed to [{id, lat, lng}] — 87% smaller than the original geojson
    fetch('/data/busStops.json')
      .then((r) => r.json())
      .then((stops) => {
        setBusStops(stops);
      });
  }, [showBus, selectedRoute]);

  // Build stopCode → { lat, lng } lookup map for route polyline rendering
  const busStopMap = useMemo(() => {
    const m = new Map();
    for (const stop of busStops) {
      m.set(stop.id, { lat: stop.lat, lng: stop.lng });
    }
    return m;
  }, [busStops]);

  // Pre-fetch all crowd data on mount + refresh every 10 min
  useEffect(() => {
    function fetchCrowd() {
      fetch(apiUrl('/api/mrt-crowd/all'))
        .then((r) => r.json())
        .then((data) => setAllCrowdData(data.stations || {}))
        .catch((err) => console.error('[MapView] Failed to fetch crowd data:', err));
    }

    fetchCrowd();
    const timer = setInterval(fetchCrowd, CROWD_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // Create a single reusable InfoWindow with "More Details" toggle support
  useEffect(() => {
    if (!isLoaded) return;
    const iw = new window.google.maps.InfoWindow({ disableAutoPan: true });

    // Attach domready listener to wire up "More Details" toggle + bus service clicks
    iw.addListener('domready', () => {
      // MRT "More Details" toggle
      const toggle = document.getElementById('mrt-details-toggle');
      const content = document.getElementById('mrt-details-content');
      if (toggle && content) {
        toggle.onclick = () => {
          const isHidden = content.style.display === 'none';
          content.style.display = isHidden ? 'block' : 'none';
          toggle.textContent = isHidden ? 'Less Details ▲' : 'More Details ▼';
        };
      }

      // Bus service number clicks → show route
      const serviceEls = document.querySelectorAll('[data-service-no]');
      serviceEls.forEach((el) => {
        el.onclick = () => {
          const svcNo = el.getAttribute('data-service-no');
          const stopCode = el.getAttribute('data-bus-stop');
          if (handleServiceClickRef.current) {
            handleServiceClickRef.current(svcNo, stopCode);
          }
        };
      });
    });

    infoWindowRef.current = iw;
    return () => {
      if (infoWindowRef.current) infoWindowRef.current.close();
    };
  }, [isLoaded]);

  // Update bus InfoWindow when data changes
  useEffect(() => {
    if (!selectedBusStop || !infoWindowRef.current) return;

    const html = ReactDOMServer.renderToString(
      <BusArrivalInfo
        busStopCode={selectedBusStop.id}
        data={busData}
        loading={busLoading}
        error={busError}
      />
    );
    infoWindowRef.current.setContent(html);
  }, [busData, busLoading, busError, selectedBusStop]);

  // Build footprintNameMap
  const footprintNameMap = useMemo(() => {
    if (!stationMapping) return {};
    const nameMap = {};
    for (const fullName of Object.keys(stationMapping)) {
      const base = fullName
        .replace(/ MRT STATION$/, '')
        .replace(/ LRT STATION$/, '');
      nameMap[base] = fullName;
      nameMap[base + ' INTERCHANGE'] = fullName;
      nameMap[base + ' STATION'] = fullName;
      nameMap[fullName] = fullName;
    }
    return nameMap;
  }, [stationMapping]);

  // Helper: build station crowd InfoWindow HTML
  const buildStationInfoHtml = useCallback((stationName) => {
    const codes = stationMapping?.[stationName] || [];
    if (!allCrowdData || codes.length === 0) {
      return ReactDOMServer.renderToString(
        <MRTCrowdInfo
          stationName={stationName}
          stationCodes={codes}
          crowdData={null}
          loading={false}
          error={null}
          trainSchedule={trainSchedule}
        />
      );
    }

    const stationCrowdData = {};
    for (const { code } of codes) {
      stationCrowdData[code] = allCrowdData[code] || null;
    }

    return ReactDOMServer.renderToString(
      <MRTCrowdInfo
        stationName={stationName}
        stationCodes={codes}
        crowdData={{ stations: stationCrowdData }}
        loading={false}
        error={null}
        trainSchedule={trainSchedule}
      />
    );
  }, [stationMapping, allCrowdData, trainSchedule]);

  // Handle service number click from bus arrival popup → show route
  const handleServiceClick = useCallback((serviceNo, busStopCode) => {
    if (!busRoutes) return;
    const candidates = Object.keys(busRoutes).filter(
      (k) => k.split(' (')[0] === serviceNo
    );
    if (candidates.length === 0) return;

    // Pick direction whose stop list contains this bus stop
    let selected = candidates[0];
    for (const key of candidates) {
      if (busRoutes[key].includes(busStopCode)) {
        selected = key;
        break;
      }
    }

    if (onRouteSelect) onRouteSelect(selected);
    if (infoWindowRef.current) infoWindowRef.current.close();
  }, [busRoutes, onRouteSelect]);

  // Keep a ref so the domready closure can always call the latest version
  const handleServiceClickRef = useRef(handleServiceClick);
  useEffect(() => {
    handleServiceClickRef.current = handleServiceClick;
  }, [handleServiceClick]);

  // Bus stop click handler
  const handleBusStopClick = useCallback((stop, marker) => {
    setSelectedBusStop(stop);

    const html = ReactDOMServer.renderToString(
      <BusArrivalInfo busStopCode={stop.id} data={null} loading={true} error={null} />
    );
    infoWindowRef.current.setContent(html);
    infoWindowRef.current.open(map, marker);

    fetchArrival(stop.id);
  }, [map, fetchArrival]);

  // Station hover handler (zoomed out — unified station dots)
  const handleStationHover = useCallback((stationName, marker) => {
    if (!infoWindowRef.current) return;
    const html = buildStationInfoHtml(stationName);
    infoWindowRef.current.setContent(html);
    infoWindowRef.current.open(map, marker);
  }, [map, buildStationInfoHtml]);

  // Station hover out — close InfoWindow
  const handleStationHoverOut = useCallback(() => {
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  }, []);

  // Footprint hover handler (zoomed in — polygon hover)
  const handleFootprintHover = useCallback((stationName, latLng) => {
    if (!infoWindowRef.current) return;
    const html = buildStationInfoHtml(stationName);
    infoWindowRef.current.setContent(html);
    infoWindowRef.current.setPosition(latLng);
    infoWindowRef.current.open(map);
  }, [map, buildStationInfoHtml]);

  // Footprint hover out — close InfoWindow
  const handleFootprintHoverOut = useCallback(() => {
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  }, []);

  if (loadError) return <div className="map-status">Error loading Google Maps</div>;
  if (!isLoaded) return <div className="map-status">Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      options={mapOptions}
      onLoad={(mapInstance) => setMap(mapInstance)}
    >
      {/* Bus stop layer — lazy loaded, always mounted once loaded */}
      {map && busStops.length > 0 && (
        <BusStopLayer
          map={map}
          busStops={busStops}
          visible={showBus}
          onBusStopClick={handleBusStopClick}
          selectedRoute={selectedRoute}
          zoomLevel={zoomLevel}
        />
      )}

      {/* MRT Line paths — always mounted once map is ready, visibility toggled via prop */}
      {map && (
        <MRTLineLayer
          map={map}
          visible={showMRT}
        />
      )}

      {/* Station markers + labels + pulse (3 independent visibility flags) */}
      {map && stationCentroids && stationMapping && (
        <MRTStationLayer
          map={map}
          stationCentroids={stationCentroids}
          stationMapping={stationMapping}
          allCrowdData={allCrowdData}
          showMarkers={showMRT && !isLabelZoomedIn}
          showLabels={showMRT && isLabelZoomedIn}
          showPulse={showMRT}
          onStationHover={handleStationHover}
          onStationHoverOut={handleStationHoverOut}
        />
      )}

      {/* Zoomed-in: station building footprints (hover to see info) */}
      {map && (
        <StationFootprintLayer
          map={map}
          footprintNameMap={footprintNameMap}
          visible={showMRT && isZoomedIn}
          onFootprintHover={handleFootprintHover}
          onFootprintHoverOut={handleFootprintHoverOut}
        />
      )}

      {/* Very zoomed-in: individual MRT exit markers (display only) */}
      {map && mrtExits.length > 0 && (
        <MRTExitLayer
          map={map}
          mrtExits={mrtExits}
          visible={showMRT && isExitZoomedIn}
        />
      )}

      {/* Bus route polyline + live bus markers */}
      {map && selectedRoute && busRoutes?.[selectedRoute] && busStopMap.size > 0 && (
        <BusRouteLayer
          map={map}
          routeKey={selectedRoute}
          routeStops={busRoutes[selectedRoute]}
          busStopMap={busStopMap}
          onClear={() => onRouteSelect(null)}
          onBusStopClick={handleBusStopClick}
        />
      )}
    </GoogleMap>
  );
}
