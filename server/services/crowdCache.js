const TRAIN_LINES = ['NSL', 'EWL', 'CGL', 'NEL', 'CCL', 'CEL', 'DTL', 'TEL', 'BPL', 'SLRT', 'PLRT'];
const LTA_CROWD_URL = 'https://datamall2.mytransport.sg/ltaodataservice/PCDRealTime';
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// In-memory cache: stationCode -> { crowdLevel, startTime, endTime }
let crowdCache = new Map();
let lastFetchTime = null;

async function fetchAllCrowdData() {
  const apiKey = process.env.LTA_API_KEY;
  if (!apiKey) {
    console.error('[CrowdCache] LTA_API_KEY not set');
    return;
  }

  console.log(`[CrowdCache] Fetching crowd data for ${TRAIN_LINES.length} lines...`);

  const results = await Promise.allSettled(
    TRAIN_LINES.map(line =>
      fetch(`${LTA_CROWD_URL}?TrainLine=${line}`, {
        headers: { AccountKey: apiKey, accept: 'application/json' }
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${line}`);
        return res.json();
      }).then(json => ({ line, data: json.value || [] }))
    )
  );

  let totalStations = 0;
  let failedLines = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { line, data } = result.value;
      for (const entry of data) {
        crowdCache.set(entry.Station, {
          crowdLevel: entry.CrowdLevel,
          startTime: entry.StartTime,
          endTime: entry.EndTime,
          line
        });
        totalStations++;
      }
    } else {
      failedLines.push(result.reason.message);
    }
  }

  lastFetchTime = new Date().toISOString();
  console.log(`[CrowdCache] Cached ${totalStations} stations. Failed: ${failedLines.length > 0 ? failedLines.join(', ') : 'none'}. Time: ${lastFetchTime}`);
}

function getCrowdLevel(stationCode) {
  return crowdCache.get(stationCode) || null;
}

function getCrowdLevels(stationCodes) {
  const result = {};
  for (const code of stationCodes) {
    result[code] = crowdCache.get(code) || null;
  }
  return result;
}

function getLastFetchTime() {
  return lastFetchTime;
}

// Initial fetch + schedule refresh
fetchAllCrowdData();
const refreshTimer = setInterval(fetchAllCrowdData, REFRESH_INTERVAL);

// Allow cleanup
function stop() {
  clearInterval(refreshTimer);
}

function getAllCrowdData() {
  const result = {};
  for (const [code, data] of crowdCache.entries()) {
    result[code] = data;
  }
  return result;
}

module.exports = { getCrowdLevel, getCrowdLevels, getAllCrowdData, getLastFetchTime, stop };
