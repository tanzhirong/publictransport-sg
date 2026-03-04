const LTA_ALERTS_URL = 'https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts';
const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes

let alertCache = { Status: 1, AffectedSegments: [], Message: [] };
let lastFetchTime = null;

async function fetchAlerts() {
  const apiKey = process.env.LTA_API_KEY;
  if (!apiKey) {
    console.error('[AlertCache] LTA_API_KEY not set');
    return;
  }

  try {
    const res = await fetch(LTA_ALERTS_URL, {
      headers: { AccountKey: apiKey, accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const value = json.value || {};

    alertCache = {
      Status: value.Status ?? 1,
      AffectedSegments: value.AffectedSegments || [],
      Message: value.Message || [],
    };
    lastFetchTime = new Date().toISOString();

    const hasDelay = alertCache.Status === 2;
    console.log(`[AlertCache] Fetched. Status=${alertCache.Status} (${hasDelay ? 'DELAY' : 'Normal'}). Segments=${alertCache.AffectedSegments.length}. Time=${lastFetchTime}`);
  } catch (err) {
    console.error('[AlertCache] Fetch failed:', err.message);
  }
}

function getAlerts() {
  return { ...alertCache, lastFetchTime };
}

// Sample delay data for UAT testing
function getSampleDelay() {
  return {
    Status: 2,
    AffectedSegments: [
      {
        Line: 'NSL',
        Direction: 'Both',
        Stations: 'NS1 to NS28',
        FreePublicBus: 'Yes',
        FreeMRTShuttle: 'Yes',
        MRTShuttleDirection: 'Both',
      },
      {
        Line: 'EWL',
        Direction: 'Both',
        Stations: 'EW1 to EW12',
        FreePublicBus: 'No',
        FreeMRTShuttle: 'Yes',
        MRTShuttleDirection: 'EW1 to EW12',
      },
    ],
    Message: [
      {
        Content: 'NSL: Train service between Jurong East and Marina South Pier is delayed due to a signal fault. Free bus and shuttle services are available.',
        CreatedDate: new Date().toISOString(),
      },
      {
        Content: 'EWL: Train service between Pasir Ris and Bugis is delayed due to a track fault. Free shuttle service is available.',
        CreatedDate: new Date().toISOString(),
      },
    ],
    lastFetchTime: new Date().toISOString(),
  };
}

// Initial fetch + schedule refresh
fetchAlerts();
const refreshTimer = setInterval(fetchAlerts, REFRESH_INTERVAL);

function stop() {
  clearInterval(refreshTimer);
}

module.exports = { getAlerts, getSampleDelay, stop };
