const express = require('express');
const router = express.Router();
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { buildFirebaseStudent } = require('../utils/firebaseUser');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

router.post('/firebase-login', async (req, res) => {
  try {
    const { firebaseToken } = req.body;
    if (!firebaseToken) {
      return res.status(400).json({ success: false, message: 'Firebase token required' });
    }

    const decoded = await getAuth().verifyIdToken(firebaseToken);
    const email = decoded.email;
    const phone = decoded.phone_number;

    const userQuery = {
      $or: [
        { firebaseUid: decoded.uid },
        { email: email },
        { phone: phone }
      ].filter((condition) => Object.values(condition)[0])
    };
    let user = await User.findOne(userQuery);

    if (!user) {
      try {
        user = await User.create(buildFirebaseStudent(decoded));
      } catch (error) {
        // A concurrent first login can race on one of the unique identity fields.
        if (error?.code !== 11000) throw error;
        user = await User.findOne(userQuery);
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
