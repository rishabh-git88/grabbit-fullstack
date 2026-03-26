const mongoose = require('mongoose');

const cafeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cafe name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    openTime: {
      type: String,
      default: '08:00',
    },
    closeTime: {
      type: String,
      default: '22:00',
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cafe', cafeSchema);
