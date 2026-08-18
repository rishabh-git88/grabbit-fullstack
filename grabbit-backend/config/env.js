const splitOrigins = (value = '') => value.split(',').map((origin) => origin.trim()).filter(Boolean);

const required = [
  'MONGO_URI',
  'JWT_SECRET',
  'VENDOR_DASHBOARD_URL',
  'STUDENT_APP_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const getAllowedOrigins = () => [
  ...splitOrigins(process.env.VENDOR_DASHBOARD_URL),
  ...splitOrigins(process.env.STUDENT_APP_URL),
  ...splitOrigins(process.env.ADDITIONAL_ALLOWED_ORIGINS),
];

const validateEnvironment = () => {
  const missing = required.filter((name) => !process.env[name]);
  if (process.env.NODE_ENV === 'production') {
    ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'].forEach((name) => {
      if (!process.env[name]) missing.push(name);
    });
  }

  if (process.env.NODE_ENV === 'production' && process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
    missing.push('a live RAZORPAY_KEY_ID');
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const isAllowedOrigin = (origin, callback) => {
  if (!origin || getAllowedOrigins().includes(origin)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS'));
};

module.exports = { getAllowedOrigins, isAllowedOrigin, validateEnvironment };
