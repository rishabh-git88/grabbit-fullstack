const express = require('express');
const router = express.Router();
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Cafe = require('../models/Cafe');
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

const createSession = (user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      cafeId: user.cafeId,
      managedCafeIds: user.managedCafeIds || [],
    },
  };
};

const verifyFirebaseToken = async (firebaseToken, res) => {
  if (!firebaseToken) {
    res.status(400).json({ success: false, message: 'Firebase token required' });
    return null;
  }

  try {
    return await getAuth().verifyIdToken(firebaseToken);
  } catch (err) {
    console.error(JSON.stringify({ event: 'firebase_token_verification_failed', code: err.code, message: err.message }));
    res.status(401).json({ success: false, message: 'Google sign-in could not be verified. Please try again.' });
    return null;
  }
};

router.post('/firebase-login', async (req, res) => {
  const decoded = await verifyFirebaseToken(req.body.firebaseToken, res);
  if (!decoded) return;

  try {
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

    res.json({
      success: true,
      message: 'Login successful',
      ...createSession(user),
    });
  } catch (err) {
    // Provisioning failures are not token failures. Keep the detailed cause in
    // Render logs while giving the person signing in an actionable retry.
    console.error(JSON.stringify({ event: 'firebase_account_provisioning_failed', code: err.code, message: err.message }));
    res.status(500).json({ success: false, message: 'We could not set up your account. Please try again.' });
  }
});

// @desc    Register a Google-authenticated vendor and their first cafe
// @route   POST /api/auth/vendor-register
// @access  Public (Firebase token required)
router.post('/vendor-register', async (req, res) => {
  const { cafeName, description = '', location = '' } = req.body;
  const normalizedCafeName = typeof cafeName === 'string' ? cafeName.trim() : '';

  if (!normalizedCafeName || normalizedCafeName.length > 80) {
    return res.status(400).json({ success: false, message: 'Enter a cafe name between 1 and 80 characters.' });
  }
  if (typeof description !== 'string' || description.length > 500 || typeof location !== 'string' || location.length > 160) {
    return res.status(400).json({ success: false, message: 'Cafe details are too long.' });
  }

  const decoded = await verifyFirebaseToken(req.body.firebaseToken, res);
  if (!decoded) return;

  try {
    const email = decoded.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'A Google account with an email address is required.' });
    }

    let user = await findUserByFirebaseIdentity({ uid: decoded.uid, email, phone: decoded.phone_number });
    if (user?.firebaseUid && user.firebaseUid !== decoded.uid) {
      return res.status(403).json({ success: false, message: 'This account is linked to another sign-in method.' });
    }
    if (user?.role === 'vendor' || user?.cafeId || user?.managedCafeIds?.length) {
      return res.status(409).json({ success: false, message: 'This Google account is already registered as a vendor.' });
    }

    if (!user) {
      user = await User.create(buildFirebaseStudent(decoded));
    } else if (!user.firebaseUid) {
      user.firebaseUid = decoded.uid;
      if (!user.phone && decoded.phone_number) user.phone = decoded.phone_number;
      await user.save();
    }

    const existingCafe = await Cafe.findOne({ name: normalizedCafeName });
    if (existingCafe) {
      return res.status(409).json({ success: false, message: 'A cafe with this name is already registered. Use a distinct cafe name.' });
    }

    const cafe = await Cafe.create({
      name: normalizedCafeName,
      description: description.trim(),
      location: location.trim(),
      vendorId: user._id,
    });
    user.role = 'vendor';
    user.cafeId = cafe._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Vendor account and cafe registered successfully.',
      cafe,
      ...createSession(user),
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'vendor_registration_failed', code: err.code, message: err.message }));
    res.status(500).json({ success: false, message: 'We could not register your cafe. Please try again.' });
  }
});

module.exports = router;
