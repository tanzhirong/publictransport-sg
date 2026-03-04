require('dotenv').config();
const express = require('express');
const cors = require('cors');

const busArrivalRoutes = require('./routes/busArrival');
const mrtCrowdRoutes = require('./routes/mrtCrowd');
const trainAlertRoutes = require('./routes/trainAlerts');

// Importing caches triggers initial fetch + interval
require('./services/crowdCache');
require('./services/alertCache');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Routes
app.use('/api/bus-arrival', busArrivalRoutes);
app.use('/api/mrt-crowd', mrtCrowdRoutes);
app.use('/api/train-alerts', trainAlertRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
