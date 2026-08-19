const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const { isAllowedOrigin, validateEnvironment } = require('./config/env');

validateEnvironment();

const authRoutes = require('./routes/auth');
const cafeRoutes = require('./routes/cafe');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const firebaseAuthRoutes = require('./routes/firebaseAuth');
const { paymentWebhook } = require('./controllers/paymentController');
const { isVendorUser, canManageCafe } = require('./utils/vendorAccess');
const { grantAllCafeAccess, provisionConfiguredVendors } = require('./utils/provisionManagedCafes');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);

const corsOptions = {
  origin: isAllowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(server, {
  cors: corsOptions,
});

// Make io accessible in routes
app.set('io', io);

app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: 'draft-7', legacyHeaders: false }));
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), paymentWebhook);
app.use(express.json({ limit: '100kb' }));
mongoose.set('sanitizeFilter', true);

// MongoDB Connection
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cafes', cafeRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/auth', firebaseAuthRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'OK' : 'DEGRADED' });
});

io.use(async (socket, next) => {
  try {
    const authHeader = socket.handshake.headers.authorization;
    const token = socket.handshake.auth?.token || authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) return next(new Error('Authentication required'));

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('Authentication required'));
    socket.data.user = user;
    return next();
  } catch {
    return next(new Error('Authentication required'));
  }
});

io.on('connection', (socket) => {
  console.log(JSON.stringify({ event: 'socket_connected', userId: socket.data.user._id.toString() }));

  socket.on('join_user_room', () => {
    socket.join(`user_${socket.data.user._id}`);
  });

  socket.on('join_cafe_room', async (cafeId) => {
    if (!isVendorUser(socket.data.user) || !cafeId) return;
    const Cafe = require('./models/Cafe');
    const cafe = await Cafe.findById(cafeId);
    if (canManageCafe(socket.data.user, cafe)) socket.join(`cafe_${cafe._id}`);
  });

  socket.on('disconnect', () => {
    console.log(JSON.stringify({ event: 'socket_disconnected', userId: socket.data.user?._id?.toString() }));
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(JSON.stringify({ event: 'request_error', message: err.message, path: req.path }));
  const status = err.statusCode || (err.type === 'entity.parse.failed' ? 400 : 500);
  const message = status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  res.status(status).json({ success: false, message });
});

const startServer = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  // Earlier versions persisted null in unique sparse identity fields. Remove
  // those placeholders so each new Google account can be created independently.
  await Promise.all([
    User.updateMany({ phone: null }, { $unset: { phone: 1 } }),
    User.updateMany({ firebaseUid: null }, { $unset: { firebaseUid: 1 } }),
  ]);
  try {
    const results = await provisionConfiguredVendors();
    results.forEach(({ email, result }) => console.log(JSON.stringify({ event: 'configured_vendor_access_granted', email, ...result })));
  } catch (error) {
    console.error(JSON.stringify({ event: 'configured_vendor_access_failed', message: error.message }));
  }
  if (process.env.MULTI_CAFE_VENDOR_EMAIL) {
    try {
      const result = await grantAllCafeAccess(process.env.MULTI_CAFE_VENDOR_EMAIL);
      console.log(JSON.stringify({ event: 'legacy_vendor_access_granted', ...result }));
    } catch (error) {
      console.error(JSON.stringify({ event: 'legacy_vendor_access_failed', message: error.message }));
    }
  }
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(JSON.stringify({ event: 'server_started', port: PORT })));
};

const shutdown = (signal) => async () => {
  console.log(JSON.stringify({ event: 'shutdown_started', signal }));
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error(JSON.stringify({ event: 'startup_failed', message: error.message }));
    process.exit(1);
  });
  process.once('SIGTERM', shutdown('SIGTERM'));
  process.once('SIGINT', shutdown('SIGINT'));
}

module.exports = { app, server, startServer };
