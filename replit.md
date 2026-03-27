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
| Database | MongoDB (external, via MONGO_URI) | — |

## Environment Variables / Secrets

- `MONGO_URI` — **(Required)** MongoDB connection string (e.g. MongoDB Atlas URI)
- `PORT` — Backend port (default: 3001)
- `REACT_APP_API_URL` — Frontend API base URL (set to `/api` for dev proxy)

## Running the App

The app has two workflows:
1. **Start application** — Starts the vendor dashboard on port 5000
2. **Backend API** — Starts the API server on port 3001

The frontend proxies `/api` requests to `localhost:3001` during development.

**The backend requires a valid `MONGO_URI` secret to start.** Without it, the server exits immediately. Add your MongoDB Atlas connection string as a secret named `MONGO_URI`.

## Key Files

- `grabbit-backend/server.js` — Backend entry point
- `grabbit-backend/routes/` — API routes (auth, cafes, menu, orders, payment)
- `grabbit-backend/models/` — Mongoose schemas
- `grabbit-backend/seed.js` — Database seed script
- `grabbit-vendor-dashboard/src/App.js` — Frontend root
- `grabbit-vendor-dashboard/src/api/index.js` — Axios API client
- `grabbit-vendor-dashboard/src/pages/` — Dashboard pages (Orders, Menu, Settings)

## Notes

- CORS is set to `*` (open) to support the Replit proxy environment
- Demo credentials shown on login page: `mayuri@grabbit.com` / `password123` (requires seeded DB)
