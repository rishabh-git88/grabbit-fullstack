const mongoose = require('mongoose');

const vendorRegistrationApprovalSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, index: true },
  vendorEmail: { type: String, required: true, lowercase: true, trim: true },
  cafeName: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  usedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

module.exports = mongoose.model('VendorRegistrationApproval', vendorRegistrationApprovalSchema);
