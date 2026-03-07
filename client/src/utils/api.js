// API base URL utility
//
// In dev:  VITE_API_BASE_URL is unset → empty string → Vite proxy forwards
//          /api/* to localhost:3001 transparently (no change to existing dev flow)
//
// In prod (Vercel): VITE_API_BASE_URL=https://publictransport-sg-api.fly.dev
//          All /api/* fetches become cross-origin requests to Fly.io backend
//
// On Render (monolith): VITE_API_BASE_URL is unset → same-origin → no change

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const apiUrl = (path) => `${API_BASE}${path}`;
