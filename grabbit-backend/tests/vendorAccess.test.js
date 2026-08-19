const test = require('node:test');
const assert = require('node:assert/strict');
const { isVendorUser, canManageCafe } = require('../utils/vendorAccess');

test('a user with an explicit managed cafe is treated as a vendor for that cafe', () => {
  const user = { _id: 'user-1', role: 'student', managedCafeIds: ['cafe-1'] };
  const cafe = { _id: 'cafe-1', vendorId: 'another-vendor' };

  assert.equal(isVendorUser(user), true);
  assert.equal(canManageCafe(user, cafe), true);
});

test('explicit cafe access does not grant access to a different cafe', () => {
  const user = { _id: 'user-1', role: 'student', managedCafeIds: ['cafe-1'] };
  const cafe = { _id: 'cafe-2', vendorId: 'another-vendor' };

  assert.equal(canManageCafe(user, cafe), false);
});
