const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVendorCafeAccess } = require('../utils/provisionManagedCafes');

test('vendor cafe access normalizes email addresses and cafe names', () => {
  const access = parseVendorCafeAccess('{" Vendor@Example.com ":[" Mayuri ","Bistro"]}');
  assert.deepEqual(access, { 'vendor@example.com': ['Mayuri', 'Bistro'] });
});

test('vendor cafe access rejects malformed configuration', () => {
  assert.throws(() => parseVendorCafeAccess('{not-json}'), /valid JSON/);
  assert.throws(() => parseVendorCafeAccess('{"vendor@example.com":"Mayuri"}'), /array/);
});
