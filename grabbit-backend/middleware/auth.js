const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isVendorUser } = require('../utils/vendorAccess');
const { grantConfiguredCafeAccess, parseVendorCafeAccess } = require('../utils/provisionManagedCafes');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // A vendor with no saved café access may be using a token issued before
    // provisioning. Upgrade that session once, but do not query and save all
    // cafés for every normal authenticated request.
    try {
      const configuredCafes = parseVendorCafeAccess()[req.user.email?.trim().toLowerCase()];
      if (configuredCafes?.length && !(req.user.managedCafeIds || []).length) {
        const result = await grantConfiguredCafeAccess(req.user.email);
        if (result) req.user = await User.findById(decoded.id).select('-password');
      }
    } catch (error) {
      console.error(JSON.stringify({ event: 'configured_vendor_access_failed', message: error.message }));
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    const permitted = roles.some((role) => {
      if (role === 'vendor') return isVendorUser(req.user);
      return req.user.role === role;
    });
    if (!permitted) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${roles.join(', ')} can perform this action.`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
