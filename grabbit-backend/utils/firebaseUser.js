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
    phone: decoded.phone_number || null,
  };
};

module.exports = { buildFirebaseStudent };
