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

// CORS: always allow origins listed in ALLOWED_ORIGINS (comma-separated env var).
// In dev, additionally allow the Vite dev server origins automatically.
// On Render (monolith), ALLOWED_ORIGINS is unset and isProd=true → no CORS needed (same-origin).
// On Fly.io (split), set ALLOWED_ORIGINS=https://your-app.vercel.app to allow the Vercel frontend.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
if (!isProd) allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
if (allowedOrigins.length) {
  app.use(cors({ origin: allowedOrigins }));
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

// Serve built React app in production (monolith mode).
// Set SERVE_STATIC=false on Fly.io (split mode) since Vercel handles the frontend.
if (isProd && process.env.SERVE_STATIC !== 'false') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist, {
    setHeaders: (res, filePath) => {
      // Data files: cache 1 day (content rarely changes)
      if (filePath.includes(`${path.sep}data${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
      // Vite-hashed JS/CSS bundles: cache 1 year (hash changes on every build)
      else if (/\.(js|css|woff2?)$/.test(filePath) && /\.[a-f0-9]{8,}\./.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // index.html: always revalidate so users pick up new deploys
      else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
  // SPA fallback — always return index.html for non-API routes
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
