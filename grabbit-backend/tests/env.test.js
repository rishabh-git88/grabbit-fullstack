const test = require('node:test');
const assert = require('node:assert/strict');

const { getAllowedOrigins, isAllowedOrigin } = require('../config/env');

test('CORS only allows configured origins', () => {
  const oldVendor = process.env.VENDOR_DASHBOARD_URL;
  const oldStudent = process.env.STUDENT_APP_URL;
  process.env.VENDOR_DASHBOARD_URL = 'https://vendor.example.com';
  process.env.STUDENT_APP_URL = 'https://student.example.com, https://preview.example.com';

  assert.deepEqual(getAllowedOrigins(), [
    'https://vendor.example.com',
    'https://student.example.com',
    'https://preview.example.com',
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
