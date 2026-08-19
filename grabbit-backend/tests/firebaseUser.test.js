const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFirebaseStudent } = require('../utils/firebaseUser');

test('buildFirebaseStudent creates a student profile from Google identity data', () => {
  const user = buildFirebaseStudent({
    uid: 'google-user-id',
    name: 'Student Name',
    email: 'Student@College.edu',
  });

  assert.equal(user.name, 'Student Name');
  assert.equal(user.email, 'student@college.edu');
  assert.equal(user.role, 'student');
  assert.equal(user.firebaseUid, 'google-user-id');
  assert.equal(user.phone, undefined);
  assert.ok(user.password.length > 20);
});

test('buildFirebaseStudent supports phone-only Firebase identities', () => {
  const user = buildFirebaseStudent({ uid: 'phone-user-id', phone_number: '+919876543210' });

  assert.equal(user.name, '+919876543210');
  assert.equal(user.email, 'firebase-phone-user-id@grabbit.local');
  assert.equal(user.phone, '+919876543210');
});
