require('dotenv').config();
const mongoose = require('mongoose');
const { grantAllCafeAccess } = require('../utils/provisionManagedCafes');

const email = process.env.VENDOR_EMAIL?.trim().toLowerCase();
if (!email) throw new Error('Set VENDOR_EMAIL to the account that should manage all cafes.');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await grantAllCafeAccess(email);
  console.log(JSON.stringify({ event: 'all_cafe_access_granted', ...result }));
  await mongoose.disconnect();
})().catch(async (error) => {
  console.error(JSON.stringify({ event: 'all_cafe_access_failed', message: error.message }));
  await mongoose.disconnect();
  process.exit(1);
});
