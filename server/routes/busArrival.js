const express = require('express');
const router = express.Router();

const LTA_BUS_ARRIVAL_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

router.get('/:busStopCode', async (req, res) => {
  const { busStopCode } = req.params;

  if (!/^\d{5}$/.test(busStopCode)) {
    return res.status(400).json({ error: 'Invalid bus stop code. Must be 5 digits.' });
  }

  try {
    const response = await fetch(
      `${LTA_BUS_ARRIVAL_URL}?BusStopCode=${busStopCode}`,
      {
        headers: {
          AccountKey: process.env.LTA_API_KEY,
          accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: `LTA API returned ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(`[BusArrival] Error fetching ${busStopCode}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch bus arrival data' });
  }
});

module.exports = router;
