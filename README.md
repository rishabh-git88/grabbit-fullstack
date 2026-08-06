
# 🐇 Grabbit — Centralized College Food Ordering System

A full-stack food ordering platform for college campuses. Students order food via mobile app; vendors manage orders and menus via a web dashboard.

---

## 📁 Project Structure

```
grabbit/
├── grabbit-backend/          # Node.js + Express + MongoDB API
├── grabbit-vendor-dashboard/ # React.js web app for vendors
└── grabbit-student-app/      # React Native mobile app for students
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
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
# Edit .env — set MONGO_URI and JWT_SECRET at minimum

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

# Start the app
npm start
```

Open **http://localhost:3000** in your browser.

> **Note:** The dashboard uses CRA's proxy to forward `/api` calls to `http://localhost:5000`. No `.env` needed for local dev.

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

Edit `src/api/index.js`:

```js
// Android Emulator
const API_BASE = 'http://10.0.2.2:5000/api';

// iOS Simulator
// const API_BASE = 'http://localhost:5000/api';

// Physical Device (replace with your machine's LAN IP)
// const API_BASE = 'http://192.168.x.x:5000/api';
```

Do the same in `src/hooks/useOrderSocket.js` for Socket.io.

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
| POST   | /api/auth/register    | name, email, password, role       | Public  |
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
| GET    | /api/payment/history   | Payment history            |

---

## 💳 Payment Integration

### Simulated Payments (Default)
Without Razorpay credentials, payments are simulated automatically — perfect for development.

### Real Razorpay Integration
1. Sign up at [razorpay.com](https://razorpay.com) and get test keys
2. Add to `grabbit-backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
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
- **Vendor:** emits `join_cafe_room` with cafeId on connect
- **Student:** emits `join_user_room` with userId on connect

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

