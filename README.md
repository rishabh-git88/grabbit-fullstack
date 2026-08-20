
# 🐇 Grabbit — Centralized College Food Ordering System

A full-stack food ordering platform for college campuses. Students order food via mobile app; vendors manage orders and menus via a web dashboard.

---

## Current Production Layout

The repository contains a few earlier mobile and standalone web experiments. The actively deployed system is deliberately kept at its current paths because Render and Vercel use them as deployment roots.

| Path | Status | Purpose |
| --- | --- | --- |
| `grabbit-backend/` | Active | Express, MongoDB, Socket.IO, Firebase verification and Razorpay API. Render deploy root. |
| `grabbit-vendor-dashboard/` | Active | Unified React web portal. It contains both vendor routes and the student web experience under `src/student/`. Vercel deploy root. |
| `render.yaml` | Active | Render service definition for `grabbit-backend/`. |
| `grabbit-student-web/` | Legacy fallback | Earlier standalone student web app; retain only while its separate Vercel deployment is still needed. |
| `grabbit-student-app/` | Legacy mobile | Earlier JavaScript React Native student app. |
| `GrabbitApp/` | Experimental mobile | TypeScript React Native app. |
| `grabbit-fullstack/` | Historical copy | Nested earlier repository copy; do not add features here. |

See [Project map](docs/PROJECT_MAP.md) for where to place code and [deployment notes](docs/DEPLOYMENT.md) for the production roots.

---

## Legacy Overview

```
grabbit/
├── grabbit-backend/          # Node.js + Express + MongoDB API
├── grabbit-vendor-dashboard/ # React.js web app for vendors
└── grabbit-student-app/      # React Native mobile app for students
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x
- MongoDB (local or Atlas)
- npm or yarn
- For mobile: Android Studio / Xcode + React Native CLI

---

## 1️⃣ Backend Setup (`grabbit-backend`)

```bash
cd grabbit-backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env — set every required value listed in .env.example

# Seed demo data (optional but recommended)
node seed.js

# Start development server
npm run dev
```

The API will be running at **http://localhost:5000**

### Demo Accounts (after seeding)

| Role    | Email                   | Password    |
|---------|-------------------------|-------------|
| Vendor  | mayuri@grabbit.com      | password123 |
| Vendor  | bistro@grabbit.com      | password123 |
| Vendor  | abdakshin@grabbit.com   | password123 |
| Student | rahul@grabbit.com       | password123 |

---

## 2️⃣ Vendor Dashboard Setup (`grabbit-vendor-dashboard`)

```bash
cd grabbit-vendor-dashboard
npm install

# Copy and configure environment values, then start the app
cp .env.example .env
npm start
```

Open **http://localhost:3000** in your browser.

Set `REACT_APP_API_URL`, `REACT_APP_SOCKET_URL`, and the Firebase web variables from `.env.example`. No production URL is embedded in the dashboard.

### Vendor Dashboard Features
- ✅ Secure login (vendor-only)
- ✅ Toggle cafe open/closed
- ✅ Live orders with auto-refresh (8s) + Socket.io real-time push
- ✅ Order status workflow: Accept → Preparing → Ready → Complete
- ✅ Menu management (Add / Edit / Delete / Toggle availability)
- ✅ Filter orders by status

---

## 3️⃣ Student App Setup (`grabbit-student-app`)

### Android (Emulator or Device)

```bash
cd grabbit-student-app
npm install

# Start Metro bundler
npm start

# In a new terminal, run on Android
npm run android
```

### iOS (Mac only)

```bash
cd grabbit-student-app
npm install
cd ios && pod install && cd ..
npm run ios
```

### ⚠️ API URL Configuration

Copy `.env.example` to `.env` and configure it:

```env
EXPO_PUBLIC_API_URL=https://your-backend.example.com/api
EXPO_PUBLIC_SOCKET_URL=https://your-backend.example.com
```

Use a development backend URL in local `.env`, never in source code.

### Student App Features
- ✅ Login / Register
- ✅ Browse campus cafes (open/closed status)
- ✅ Browse menu by category
- ✅ Add to cart with quantity controls
- ✅ Place order with 60/40 payment split
- ✅ QR code generated for pickup verification
- ✅ Real-time order tracking via Socket.io
- ✅ Order history

---

## 🗂️ API Reference

### Auth
| Method | Endpoint              | Body                              | Access  |
|--------|-----------------------|-----------------------------------|---------|
| POST   | /api/auth/register    | name, email, password             | Public (student) |
| POST   | /api/auth/login       | email, password                   | Public  |
| GET    | /api/auth/me          | —                                 | Private |

### Cafes
| Method | Endpoint                  | Description         | Access  |
|--------|---------------------------|---------------------|---------|
| GET    | /api/cafes                | List all cafes      | Public  |
| GET    | /api/cafes/:id            | Get single cafe     | Public  |
| GET    | /api/cafes/:id/menu       | Get cafe menu       | Public  |
| PUT    | /api/cafes/:id/status     | Toggle open/closed  | Vendor  |

### Menu (Vendor Only)
| Method | Endpoint       | Description         |
|--------|----------------|---------------------|
| GET    | /api/menu/vendor | Get my menu       |
| POST   | /api/menu      | Add item            |
| PUT    | /api/menu/:id  | Update item         |
| DELETE | /api/menu/:id  | Delete item         |

### Orders
| Method | Endpoint                    | Description           | Access  |
|--------|-----------------------------|-----------------------|---------|
| POST   | /api/orders                 | Place order           | Student |
| GET    | /api/orders/:id             | Get single order      | Private |
| GET    | /api/orders/user/:userId    | Get student's orders  | Student |
| GET    | /api/orders/cafe/:cafeId    | Get cafe's orders     | Vendor  |
| PUT    | /api/orders/:id/status      | Update order status   | Vendor  |

### Payments
| Method | Endpoint               | Description                |
|--------|------------------------|----------------------------|
| POST   | /api/payment/create    | Create Razorpay order      |
| POST   | /api/payment/verify    | Verify Razorpay signature  |
| POST   | /api/payment/:orderId/collect-remaining | Record pickup payment (vendor) |
| POST   | /api/payment/webhook   | Razorpay payment event     |
| GET    | /api/payment/history   | Payment history            |

---

## 💳 Payment Integration

### Simulated Payments (Development Only)
Without Razorpay credentials, payments are simulated only outside production. Production refuses payment creation until live Razorpay credentials and a webhook secret are configured.

### Real Razorpay Integration
1. Configure live Razorpay credentials and `RAZORPAY_WEBHOOK_SECRET` in Render.
2. Add to `grabbit-backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=...
   RAZORPAY_WEBHOOK_SECRET=...
   ```
3. For the mobile app, integrate [`react-native-razorpay`](https://github.com/razorpay/react-native-razorpay):
   ```bash
   npm install react-native-razorpay
   ```
   Then in `CartScreen.js`, replace the Alert with:
   ```js
   import RazorpayCheckout from 'react-native-razorpay';

   RazorpayCheckout.open({
     key: payRes.data.razorpayKeyId,
     amount: payRes.data.amount,
     currency: 'INR',
     order_id: payRes.data.razorpayOrderId,
     name: 'Grabbit',
     description: `Order #${order.orderNumber}`,
   }).then(async (data) => {
     await paymentAPI.verify({ ...data, paymentId: payRes.data.paymentId });
     clearCart();
     navigation.navigate('OrderTracking', { orderId: order._id });
   });
   ```

---

## 🔌 Real-Time (Socket.io)

### Events emitted by server:
| Event                | Room          | Payload                          |
|----------------------|---------------|----------------------------------|
| `new_order`          | `cafe_<id>`   | Full order object                |
| `order_status_update`| `user_<id>`   | orderId, status, cafeName        |

### Client subscriptions:
- **Vendor:** sends its JWT during the Socket.IO handshake, then emits `join_cafe_room`.
- **Student:** sends its JWT during the Socket.IO handshake, then emits `join_user_room`.
- The server derives the room from the authenticated account; IDs sent by clients are ignored.

---

## 🗄️ Database Models

### User
```js
{ name, email, password (hashed), role: 'student'|'vendor', cafeId }
```

### Cafe
```js
{ name, description, location, isOpen, vendorId }
```

### MenuItem
```js
{ cafeId, name, description, price, category, isAvailable, preparationTime }
```

### Order
```js
{
  userId, cafeId, items: [{ itemId, name, quantity, price }],
  totalAmount, paidAmount (60%), remainingAmount (40%),
  status: 'placed'|'accepted'|'preparing'|'ready'|'completed'|'rejected',
  paymentStatus: 'pending'|'partial'|'full',
  orderNumber, qrCode, notes
}
```

### Payment
```js
{ orderId, userId, amount, method, status, transactionId, type: 'advance'|'remaining' }
```

---

## 🏗️ Architecture Overview

```
┌─────────────────┐      REST + Socket.io      ┌──────────────────────┐
│  Student App    │ ◄──────────────────────────► │                      │
│ (React Native)  │                              │   grabbit-backend    │
└─────────────────┘                              │  (Node + Express)    │
                                                 │                      │
┌─────────────────┐      REST + Socket.io        │   MongoDB (Mongoose) │
│ Vendor Dashboard│ ◄──────────────────────────► │                      │
│   (React.js)    │                              └──────────────────────┘
└─────────────────┘
```

---

## 🧩 Order Flow

```
Student selects cafe & items
        ↓
Backend calculates: advance = total × 0.6, remaining = total × 0.4
        ↓
Student pays 60% online (Razorpay or simulated)
        ↓
Order created with status "placed" + QR code generated
        ↓
Vendor receives notification (Socket.io + auto-poll)
        ↓
Vendor: placed → accepted → preparing → ready → completed
        ↓
Student receives real-time status updates on tracking screen
        ↓
Student collects order and pays remaining 40% offline
```

---

## 📦 Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Node.js, Express.js, MongoDB, Mongoose |
| Realtime | Socket.io                         |
| Auth     | JWT (jsonwebtoken), bcryptjs      |
| Payment  | Razorpay (+ simulated fallback)   |
| QR Code  | qrcode npm package                |
| Web App  | React.js, React Router, Tailwind CSS |
| Mobile   | React Native, React Navigation    |

---

## 🛠️ Folder Structure

```
grabbit-backend/
├── server.js              # Entry point, Socket.io setup
├── seed.js                # Demo data seeder
├── models/
│   ├── User.js
│   ├── Cafe.js
│   ├── MenuItem.js
│   ├── Order.js
│   └── Payment.js
├── controllers/
│   ├── authController.js
│   ├── cafeController.js
│   ├── menuController.js
│   ├── orderController.js
│   └── paymentController.js
├── routes/
│   ├── auth.js
│   ├── cafe.js
│   ├── menu.js
│   ├── order.js
│   └── payment.js
└── middleware/
    └── auth.js            # JWT protect + restrictTo

grabbit-vendor-dashboard/
└── src/
    ├── api/index.js       # Axios instance + API calls
    ├── context/AuthContext.js
    ├── hooks/useSocket.js
    ├── components/
    │   ├── Sidebar.js
    │   └── OrderCard.js
    └── pages/
        ├── Login.js
        ├── Orders.js
        ├── Menu.js
        └── Settings.js

grabbit-student-app/
└── src/
    ├── api/index.js
    ├── context/
    │   ├── AuthContext.js
    │   └── CartContext.js
    ├── hooks/useOrderSocket.js
    ├── navigation/AppNavigator.js
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── HomeScreen.js
    │   ├── MenuScreen.js
    │   ├── CartScreen.js
    │   ├── OrderTrackingScreen.js
    │   └── OrdersScreen.js
    └── utils/theme.js
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit and push
4. Open a Pull Request

---

## 📄 License

MIT — built for campus use and open learning.
=======
