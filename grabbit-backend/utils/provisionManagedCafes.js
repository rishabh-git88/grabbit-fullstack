const User = require('../models/User');
const Cafe = require('../models/Cafe');

const parseVendorCafeAccess = (value = process.env.VENDOR_CAFE_ACCESS) => {
  if (!value) return {};
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('VENDOR_CAFE_ACCESS must be valid JSON');
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('VENDOR_CAFE_ACCESS must be an object keyed by email');
  }
  return Object.fromEntries(Object.entries(parsed).map(([email, cafeNames]) => {
    if (!Array.isArray(cafeNames) || cafeNames.some((name) => typeof name !== 'string' || !name.trim())) {
      throw new Error(`VENDOR_CAFE_ACCESS for ${email} must be an array of cafe names`);
    }
    return [email.trim().toLowerCase(), cafeNames.map((name) => name.trim())];
  }));
};

const grantAllCafeAccess = async (email) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('A vendor email is required');

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new Error('No user exists for the configured vendor email');

  const cafes = await Cafe.find().select('_id');
  if (!cafes.length) throw new Error('No cafes exist to grant');

  user.managedCafeIds = cafes.map((cafe) => cafe._id);
  await user.save();
  return { userId: user._id.toString(), cafeCount: cafes.length };
};

const grantConfiguredCafeAccess = async (email) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const cafeNames = parseVendorCafeAccess()[normalizedEmail];
  if (!cafeNames) return null;

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new Error('No user exists for the configured vendor email');

  const cafes = await Cafe.find({ name: { $in: cafeNames } }).select('_id name');
  const foundNames = new Set(cafes.map((cafe) => cafe.name));
  const missing = cafeNames.filter((name) => !foundNames.has(name));
  if (missing.length) throw new Error(`Configured cafes were not found: ${missing.join(', ')}`);

  user.managedCafeIds = cafes.map((cafe) => cafe._id);
  await user.save();
  return { userId: user._id.toString(), cafeCount: cafes.length };
};

const provisionConfiguredVendors = async () => {
  const access = parseVendorCafeAccess();
  const results = [];
  for (const email of Object.keys(access)) {
    results.push({ email, result: await grantConfiguredCafeAccess(email) });
  }
  return results;
};

module.exports = { grantAllCafeAccess, grantConfiguredCafeAccess, parseVendorCafeAccess, provisionConfiguredVendors };
