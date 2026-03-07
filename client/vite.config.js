import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
    // Cache static data files in dev so repeated hot-reloads don't re-download them
    headers: {
      'Cache-Control': 'no-cache', // default: no cache
    },
    // Override for /data/ files via a custom middleware
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/data/')) {
          res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour in dev
        }
        next();
      });
    },
  }
});
