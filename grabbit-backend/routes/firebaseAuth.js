const express = require('express');
const router = express.Router();
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { buildFirebaseStudent } = require('../utils/firebaseUser');
const { grantAllCafeAccess, grantConfiguredCafeAccess } = require('../utils/provisionManagedCafes');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// This project enables Mongoose's `sanitizeFilter` globally. Query operators
// such as `$or` are therefore treated as values rather than MongoDB operators.
// Look up each trusted Firebase identity explicitly so first-time Google users
// can always be provisioned as students.
const findUserByFirebaseIdentity = async ({ uid, email, phone }) => {
  let user = await User.findOne({ firebaseUid: uid });
  if (!user && email) user = await User.findOne({ email });
  if (!user && phone) user = await User.findOne({ phone });
  return user;
};

router.post('/firebase-login', async (req, res) => {
  try {
    const { firebaseToken } = req.body;
    if (!firebaseToken) {
      return res.status(400).json({ success: false, message: 'Firebase token required' });
    }

    const decoded = await getAuth().verifyIdToken(firebaseToken);
    const email = decoded.email?.trim().toLowerCase();
    const phone = decoded.phone_number;

    let user = await findUserByFirebaseIdentity({ uid: decoded.uid, email, phone });

    if (!user) {
      try {
        user = await User.create(buildFirebaseStudent(decoded));
        console.log(JSON.stringify({ event: 'firebase_student_created', userId: user._id }));
      } catch (error) {
        // A concurrent first login can race on one of the unique identity fields.
        if (error?.code !== 11000) throw error;
        user = await findUserByFirebaseIdentity({ uid: decoded.uid, email, phone });
        if (!user) throw error;
      }
    }

    if (user.firebaseUid && user.firebaseUid !== decoded.uid) {
      return res.status(403).json({ success: false, message: 'This account is linked to another sign-in method' });
    }

    if (!user.firebaseUid) {
      user.firebaseUid = decoded.uid;
      if (!user.phone && phone) user.phone = phone;
      await user.save();
    }

    // A trusted account configured by the Render environment receives its
    // assigned multi-cafe access at sign-in too. This is idempotent and avoids
    // depending on a paid Render Shell or a particular service restart.
    let configuredAccess = null;
    try {
      configuredAccess = await grantConfiguredCafeAccess(email);
    } catch (error) {
      console.error(JSON.stringify({ event: 'configured_vendor_access_failed', message: error.message }));
    }
    const legacyConfiguredVendorEmail = process.env.MULTI_CAFE_VENDOR_EMAIL?.trim().toLowerCase();
    if (configuredAccess || (legacyConfiguredVendorEmail && email?.trim().toLowerCase() === legacyConfiguredVendorEmail)) {
      if (!configuredAccess) await grantAllCafeAccess(email);
      user = await User.findById(user._id);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cafeId: user.cafeId,
        managedCafeIds: user.managedCafeIds || [],
      }
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'firebase_login_failed', message: err.message }));
    res.status(401).json({ success: false, message: 'Invalid Firebase token' });
  }
});

module.exports = router;
