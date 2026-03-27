# Grabbit — Centralized College Food Ordering System

## Project Overview
Grabbit is a full-stack food ordering platform for college campuses. Three services run here:
- **Student App** (React Native / Expo web) — students browse cafes, order food, track orders live
- **Vendor Dashboard** (React) — cafe vendors manage orders and menus
- **Backend API** (Node.js/Express) — REST API + Socket.io real-time server

## Architecture

| Component | Tech | Port | Access |
|-----------|------|------|--------|
| Student App (Expo web) | React Native, Expo SDK 55 | 5000 | Main webview |
| Vendor Dashboard | React (CRA), Tailwind CSS | 3000 | Console / external URL |
| Backend API | Node.js, Express, Socket.io | 3001 | Console / external URL |
| Database | MongoDB Atlas (external) | — | Via MONGODB_CONNECTION |

## Workflows

1. **Student App** — `npx expo start --web --port 5000` — main preview
2. **Backend API** — `node server.js` — API server
3. **Vendor Dashboard** — `npm start` on port 3000 — vendor management

## Environment Variables

Set in `.replit` userenv:
- `MONGODB_CONNECTION` — MongoDB Atlas connection string
- `PORT` — Backend port (3001)
- `JWT_SECRET` — JWT signing secret
- `JWT_EXPIRE` — Token expiry (7d)
- `REACT_APP_API_URL` — `/api` (proxied in vendor dashboard)

Set in `grabbit-student-app/.env`:
- `EXPO_PUBLIC_API_URL` — Full URL to backend API (e.g. `https://<domain>:3001/api`)
- `EXPO_PUBLIC_SOCKET_URL` — Full URL to backend for Socket.io (e.g. `https://<domain>:3001`)

## Key Files

### Student App
- `grabbit-student-app/src/api/index.js` — Axios API client (uses EXPO_PUBLIC_API_URL)
- `grabbit-student-app/src/hooks/useOrderSocket.js` — Socket.io real-time hook
- `grabbit-student-app/src/navigation/AppNavigator.js` — Navigation structure
- `grabbit-student-app/src/screens/` — Login, Home, Menu, Cart, OrderTracking, Orders
- `grabbit-student-app/src/context/` — AuthContext, CartContext

### Backend
- `grabbit-backend/server.js` — Entry point (listens on 0.0.0.0:3001)
- `grabbit-backend/routes/` — auth, cafes, menu, orders, payment
- `grabbit-backend/models/` — User, Cafe, MenuItem, Order, Payment
- `grabbit-backend/seed.js` — Database seed script

### Vendor Dashboard
- `grabbit-vendor-dashboard/src/App.js` — Root
- `grabbit-vendor-dashboard/src/api/index.js` — Axios client (uses /api proxy)
- `grabbit-vendor-dashboard/.env` — REACT_APP_API_URL=/api

## Demo Credentials
- **Student**: `rahul@grabbit.com` / `password123`
- **Vendor**: `mayuri@grabbit.com` / `password123`
(Requires seeded database — run `node seed.js` in grabbit-backend/)

## Replit Notes
- Backend binds to `0.0.0.0` (not localhost) for Replit proxy compatibility
- CORS is `*` on backend to allow cross-origin requests from Expo web
- Student app `.env` must use the full public Replit domain URL for the backend
- Vendor dashboard proxies `/api` to localhost:3001 via react-scripts proxy setting
