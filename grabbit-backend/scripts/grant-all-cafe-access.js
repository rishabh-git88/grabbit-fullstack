require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Cafe = require('../models/Cafe');

const email = process.env.VENDOR_EMAIL?.trim().toLowerCase();
if (!email) throw new Error('Set VENDOR_EMAIL to the account that should manage all cafes.');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) throw new Error('No user exists for VENDOR_EMAIL. Sign in once first, then run this command again.');
  const cafes = await Cafe.find().select('_id name');
  user.managedCafeIds = cafes.map((cafe) => cafe._id);
  await user.save();
  console.log(JSON.stringify({ event: 'all_cafe_access_granted', userId: user._id.toString(), cafeCount: cafes.length }));
  await mongoose.disconnect();
})().catch(async (error) => {
  console.error(JSON.stringify({ event: 'all_cafe_access_failed', message: error.message }));
  await mongoose.disconnect();
  process.exit(1);
});
