const test = require('node:test');
const assert = require('node:assert/strict');

const { getAllowedOrigins, isAllowedOrigin, validateEnvironment } = require('../config/env');

test('CORS only allows configured origins', () => {
  const oldVendor = process.env.VENDOR_DASHBOARD_URL;
  const oldStudent = process.env.STUDENT_APP_URL;
  process.env.VENDOR_DASHBOARD_URL = 'https://vendor.example.com';
  process.env.STUDENT_APP_URL = 'https://student.example.com, https://preview.example.com';

  assert.deepEqual(getAllowedOrigins(), [
    'https://vendor.example.com',
    'https://student.example.com',
    'https://preview.example.com',
    'https://grabbit-campus.vercel.app',
  ]);
  isAllowedOrigin('https://student.example.com', (error, allowed) => {
    assert.equal(error, null);
    assert.equal(allowed, true);
  });
  isAllowedOrigin('https://attacker.example.com', (error) => assert.match(error.message, /not allowed/));

  if (oldVendor === undefined) delete process.env.VENDOR_DASHBOARD_URL;
  else process.env.VENDOR_DASHBOARD_URL = oldVendor;
  if (oldStudent === undefined) delete process.env.STUDENT_APP_URL;
  else process.env.STUDENT_APP_URL = oldStudent;
});

const productionEnvironment = {
  NODE_ENV: 'production',
  MONGO_URI: 'mongodb://example.test/grabbit',
  JWT_SECRET: 'test-secret',
  VENDOR_DASHBOARD_URL: 'https://vendor.example.com',
  STUDENT_APP_URL: 'https://student.example.com',
  FIREBASE_PROJECT_ID: 'example-project',
  FIREBASE_CLIENT_EMAIL: 'firebase@example-project.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: 'test-private-key',
  RESEND_API_KEY: 're_test_key',
  PARENT_APPROVAL_EMAIL: 'parent@example.com',
  RAZORPAY_KEY_SECRET: 'test-secret',
  RAZORPAY_WEBHOOK_SECRET: 'webhook-secret',
};

const withEnvironment = (overrides, callback) => {
  const previous = {};
  Object.keys({ ...productionEnvironment, ...overrides }).forEach((name) => {
    previous[name] = process.env[name];
    const value = { ...productionEnvironment, ...overrides }[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  });

  try {
    callback();
  } finally {
    Object.entries(previous).forEach(([name, value]) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    });
  }
};

test('production accepts explicit Razorpay test mode with a test key', () => {
  withEnvironment({ RAZORPAY_MODE: 'test', RAZORPAY_KEY_ID: 'rzp_test_example' }, () => {
    assert.doesNotThrow(validateEnvironment);
  });
});

test('production rejects a test key when Razorpay mode is live', () => {
  withEnvironment({ RAZORPAY_MODE: 'live', RAZORPAY_KEY_ID: 'rzp_test_example' }, () => {
    assert.throws(validateEnvironment, /a live RAZORPAY_KEY_ID/);
  });
});
