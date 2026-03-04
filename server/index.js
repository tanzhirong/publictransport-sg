require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const busArrivalRoutes = require('./routes/busArrival');
const mrtCrowdRoutes = require('./routes/mrtCrowd');
const trainAlertRoutes = require('./routes/trainAlerts');

// Importing caches triggers initial fetch + interval
require('./services/crowdCache');
require('./services/alertCache');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// In dev: allow Vite dev server. In prod: same-origin (no CORS needed)
if (!isProd) {
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
}

app.use(express.json());

// Routes
app.use('/api/bus-arrival', busArrivalRoutes);
app.use('/api/mrt-crowd', mrtCrowdRoutes);
app.use('/api/train-alerts', trainAlertRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve built React app in production
if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  // SPA fallback — always return index.html for non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
