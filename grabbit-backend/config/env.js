const splitOrigins = (value = '') => value.split(',').map((origin) => origin.trim()).filter(Boolean);
const getRazorpayMode = () => (process.env.RAZORPAY_MODE || 'live').toLowerCase();

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
  const razorpayMode = getRazorpayMode();
  if (process.env.NODE_ENV === 'production') {
    ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'].forEach((name) => {
      if (!process.env[name]) missing.push(name);
    });

    if (!['live', 'test'].includes(razorpayMode)) {
      missing.push('RAZORPAY_MODE (live or test)');
    } else if (process.env.RAZORPAY_KEY_ID) {
      const expectedPrefix = razorpayMode === 'test' ? 'rzp_test_' : 'rzp_live_';
      if (!process.env.RAZORPAY_KEY_ID.startsWith(expectedPrefix)) {
        missing.push(`a ${razorpayMode} RAZORPAY_KEY_ID`);
      }
    }
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const isAllowedOrigin = (origin, callback) => {
  if (!origin || getAllowedOrigins().includes(origin)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS'));
};

module.exports = { getAllowedOrigins, getRazorpayMode, isAllowedOrigin, validateEnvironment };
