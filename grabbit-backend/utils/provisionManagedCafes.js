const User = require('../models/User');
const Cafe = require('../models/Cafe');

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

module.exports = { grantAllCafeAccess };
