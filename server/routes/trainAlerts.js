const express = require('express');
const router = express.Router();
const { getAlerts, getSampleDelay } = require('../services/alertCache');

// GET /api/train-alerts — returns current train service alert status
router.get('/', (_req, res) => {
  const alerts = getAlerts();
  res.json(alerts);
});

// GET /api/train-alerts/sample — returns sample delay data for UAT testing
router.get('/sample', (_req, res) => {
  const sample = getSampleDelay();
  res.json(sample);
});

module.exports = router;
