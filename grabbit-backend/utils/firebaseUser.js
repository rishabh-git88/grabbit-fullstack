const crypto = require('crypto');

const buildFirebaseStudent = (decoded) => {
  if (!decoded?.uid) throw new Error('Firebase user ID is required');

  const email = decoded.email?.trim().toLowerCase()
    || `firebase-${decoded.uid}@grabbit.local`;
  const name = decoded.name?.trim()
    || decoded.phone_number
    || email.split('@')[0];

  return {
    name,
    email,
    password: crypto.randomBytes(32).toString('base64url'),
    role: 'student',
    firebaseUid: decoded.uid,
    // Leave this field absent when Google does not provide a phone number.
    // `phone` has a unique sparse index, and storing `null` can make unrelated
    // Google accounts collide on that optional identity field.
    ...(decoded.phone_number ? { phone: decoded.phone_number } : {}),
  };
};

module.exports = { buildFirebaseStudent };
