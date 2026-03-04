const express = require('express');
const router = express.Router();
const { getCrowdLevels, getAllCrowdData, getLastFetchTime } = require('../services/crowdCache');
const stationCodeMapping = require('../data/stationCodeMapping');

// GET /api/mrt-crowd?codes=TE7,CC15
router.get('/', (req, res) => {
  const { codes } = req.query;

  if (!codes) {
    return res.status(400).json({ error: 'Missing "codes" query parameter. E.g. ?codes=TE7,CC15' });
  }

  const stationCodes = codes.split(',').map(c => c.trim()).filter(Boolean);

  if (stationCodes.length === 0) {
    return res.status(400).json({ error: 'No valid station codes provided.' });
  }

  const crowdData = getCrowdLevels(stationCodes);
  res.json({
    lastUpdated: getLastFetchTime(),
    stations: crowdData
  });
});

// GET /api/mrt-crowd/all — returns ALL cached crowd data
router.get('/all', (_req, res) => {
  const allData = getAllCrowdData();
  res.json({
    lastUpdated: getLastFetchTime(),
    stations: allData
  });
});

// GET /api/station-mapping — returns the full mapping for the client
router.get('/station-mapping', (_req, res) => {
  res.json(stationCodeMapping);
});

module.exports = router;
