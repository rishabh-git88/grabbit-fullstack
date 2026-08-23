const express = require('express');
const router = express.Router();
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Cafe = require('../models/Cafe');
const VendorRegistrationApproval = require('../models/VendorRegistrationApproval');
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

const codeHash = (code) => crypto.createHash('sha256').update(code).digest('hex');
const approvalCodeMatches = (code, expectedHash) => {
  const receivedHash = Buffer.from(codeHash(code), 'hex');
  const storedHash = Buffer.from(expectedHash, 'hex');
  return receivedHash.length === storedHash.length && crypto.timingSafeEqual(receivedHash, storedHash);
};

const sendVendorApprovalCode = async (code, cafeName) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Grabbit <onboarding@resend.dev>',
      to: [process.env.PARENT_APPROVAL_EMAIL],
      subject: 'Grabbit vendor registration approval code',
      text: `A vendor requested to register ${cafeName}. Approval code: ${code}. This code expires in 10 minutes. Do not share it unless you approve this cafe registration.`,
    }),
  });

  if (!response.ok) {
    console.error(JSON.stringify({ event: 'vendor_approval_email_failed', status: response.status }));
    throw new Error('Unable to send the approval code');
  }
};

const vendorRegistrationRequestLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many approval-code requests. Please wait before trying again.' },
});

const vendorRegistrationConfirmLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many approval-code attempts. Please request a new code.' },
});

const readVendorRegistrationDetails = (body) => {
  const { cafeName, description = '', location = '' } = body;
  const normalizedCafeName = typeof cafeName === 'string' ? cafeName.trim() : '';
  if (!normalizedCafeName || normalizedCafeName.length > 80) {
    return { error: 'Enter a cafe name between 1 and 80 characters.' };
  }
  if (typeof description !== 'string' || description.length > 500 || typeof location !== 'string' || location.length > 160) {
    return { error: 'Cafe details are too long.' };
  }
  return { cafeName: normalizedCafeName, description: description.trim(), location: location.trim() };
};

const canRegisterVendor = (user) => !user || !(user.role === 'vendor' || user.cafeId || user.managedCafeIds?.length);

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

// @desc    Request a parent-approved code for a Google-authenticated vendor
// @route   POST /api/auth/vendor-register
// @access  Public (Firebase token required)
router.post('/vendor-register', vendorRegistrationRequestLimit, async (req, res) => {
  const details = readVendorRegistrationDetails(req.body);
  if (details.error) return res.status(400).json({ success: false, message: details.error });

  const decoded = await verifyFirebaseToken(req.body.firebaseToken, res);
  if (!decoded) return;

  try {
    const email = decoded.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'A Google account with an email address is required.' });
    }

    const user = await findUserByFirebaseIdentity({ uid: decoded.uid, email, phone: decoded.phone_number });
    if (user?.firebaseUid && user.firebaseUid !== decoded.uid) {
      return res.status(403).json({ success: false, message: 'This account is linked to another sign-in method.' });
    }
    if (!canRegisterVendor(user)) {
      return res.status(409).json({ success: false, message: 'This Google account is already registered as a vendor.' });
    }

    const existingCafe = await Cafe.findOne({ name: details.cafeName });
    if (existingCafe) {
      return res.status(409).json({ success: false, message: 'A cafe with this name is already registered. Use a distinct cafe name.' });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    await VendorRegistrationApproval.deleteMany({ firebaseUid: decoded.uid });
    const approval = await VendorRegistrationApproval.create({
      firebaseUid: decoded.uid,
      vendorEmail: email,
      ...details,
      codeHash: codeHash(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    try {
      await sendVendorApprovalCode(code, details.cafeName);
    } catch (error) {
      await approval.deleteOne();
      return res.status(502).json({ success: false, message: 'We could not send the parent approval code. Please try again.' });
    }

    res.status(202).json({
      success: true,
      message: 'An approval code was sent to the parent email.',
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'vendor_registration_request_failed', code: err.code, message: err.message }));
    res.status(500).json({ success: false, message: 'We could not request approval. Please try again.' });
  }
});

// @desc    Confirm a parent-approved vendor registration and create the cafe
// @route   POST /api/auth/vendor-register/confirm
// @access  Public (Firebase token and parent approval code required)
router.post('/vendor-register/confirm', vendorRegistrationConfirmLimit, async (req, res) => {
  const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ success: false, message: 'Enter the six-digit approval code.' });
  }

  const decoded = await verifyFirebaseToken(req.body.firebaseToken, res);
  if (!decoded) return;

  try {
    const approval = await VendorRegistrationApproval.findOne({ firebaseUid: decoded.uid, usedAt: null }).sort('-createdAt');
    if (!approval || approval.expiresAt <= new Date()) {
      return res.status(400).json({ success: false, message: 'This approval code has expired. Request a new one.' });
    }
    if (approval.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many incorrect codes. Request a new approval code.' });
    }
    if (!approvalCodeMatches(code, approval.codeHash)) {
      approval.attempts += 1;
      await approval.save();
      return res.status(400).json({ success: false, message: 'That approval code is incorrect.' });
    }

    const email = decoded.email?.trim().toLowerCase();
    if (!email || email !== approval.vendorEmail) {
      return res.status(403).json({ success: false, message: 'The approval code belongs to a different Google account.' });
    }
    let user = await findUserByFirebaseIdentity({ uid: decoded.uid, email, phone: decoded.phone_number });
    if (user?.firebaseUid && user.firebaseUid !== decoded.uid) {
      return res.status(403).json({ success: false, message: 'This account is linked to another sign-in method.' });
    }
    if (!canRegisterVendor(user)) {
      return res.status(409).json({ success: false, message: 'This Google account is already registered as a vendor.' });
    }
    if (await Cafe.findOne({ name: approval.cafeName })) {
      return res.status(409).json({ success: false, message: 'A cafe with this name is already registered. Request a new approval code with a different name.' });
    }

    if (!user) {
      user = await User.create(buildFirebaseStudent(decoded));
    } else if (!user.firebaseUid) {
      user.firebaseUid = decoded.uid;
      if (!user.phone && decoded.phone_number) user.phone = decoded.phone_number;
      await user.save();
    }

    const cafe = await Cafe.create({
      name: approval.cafeName,
      description: approval.description,
      location: approval.location,
      vendorId: user._id,
    });
    user.role = 'vendor';
    user.cafeId = cafe._id;
    await user.save();
    approval.usedAt = new Date();
    await approval.save();

    res.status(201).json({
      success: true,
      message: 'Vendor account and cafe registered successfully.',
      cafe,
      ...createSession(user),
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'vendor_registration_confirm_failed', code: err.code, message: err.message }));
    res.status(500).json({ success: false, message: 'We could not complete registration. Please try again.' });
  }
});

module.exports = router;
