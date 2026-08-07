const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
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

    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const email = decoded.email;
    const phone = decoded.phone_number;

    // Find vendor by email, googleEmail or phone
    const user = await User.findOne({
      $or: [
        { email: email },
        { googleEmail: email },
        { phone: phone }
      ],
      role: 'vendor'
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'No vendor account found. Contact admin to register.'
      });
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
        cafeId: user.cafeId
      }
    });
  } catch (err) {
    console.error('Firebase login error:', err);
    res.status(401).json({ success: false, message: 'Invalid Firebase token' });
  }
});

module.exports = router;
