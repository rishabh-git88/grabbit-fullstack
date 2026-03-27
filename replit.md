# Grabbit — Centralized College Food Ordering System

## Project Overview
Grabbit is a full-stack food ordering platform for college campuses. It has two web components set up here:
- **Vendor Dashboard** (React) — lets cafe vendors manage orders and menus
- **Backend API** (Node.js/Express) — REST API + Socket.io real-time server

The student-facing mobile app (`grabbit-student-app/` and `GrabbitApp/`) is a React Native / Expo app and is not run in this environment.

## Architecture

| Component | Tech | Port |
|-----------|------|------|
| Vendor Dashboard (frontend) | React (Create React App), Tailwind CSS | 5000 |
| Backend API | Node.js, Express, Socket.io | 3001 |
| Database | MongoDB (external, via MONGODB_CONNECTION) | — |

## Environment Variables / Secrets

- `MONGODB_CONNECTION` — **(Required)** MongoDB connection string (set in `.replit` userenv)
- `PORT` — Backend port (default: 3001)
- `JWT_SECRET` — Secret for JWT signing
- `JWT_EXPIRE` — Token expiry (default: 7d)
- `REACT_APP_API_URL` — Frontend API base URL (set to `/api` for dev proxy)

## Running the App

The app has two workflows:
1. **Vendor Dashboard** — Starts the vendor dashboard on port 5000 (web preview)
2. **Backend API** — Starts the API server on port 3001

The frontend proxies `/api` requests to `localhost:3001` during development (via `"proxy"` in package.json).

## Key Files

- `grabbit-backend/server.js` — Backend entry point (listens on 0.0.0.0 for Replit compatibility)
- `grabbit-backend/routes/` — API routes (auth, cafes, menu, orders, payment)
- `grabbit-backend/models/` — Mongoose schemas
- `grabbit-backend/seed.js` — Database seed script
- `grabbit-vendor-dashboard/src/App.js` — Frontend root
- `grabbit-vendor-dashboard/src/api/index.js` — Axios API client (uses `/api` relative path)
- `grabbit-vendor-dashboard/src/pages/` — Dashboard pages (Orders, Menu, Settings)
- `grabbit-vendor-dashboard/.env` — Frontend env (REACT_APP_API_URL=/api)

## Replit Migration Notes

- Backend server binds to `0.0.0.0` (not `localhost`) so it is accessible through Replit's proxy
- Vendor Dashboard runs on port 5000 (required for Replit webview)
- Frontend `.env` uses `/api` relative path — proxied to backend via `react-scripts` proxy
- CORS is set to `*` (open) to support the Replit proxy environment
- Demo credentials shown on login page: `mayuri@grabbit.com` / `password123` (requires seeded DB)
