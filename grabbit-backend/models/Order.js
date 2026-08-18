const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const orderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cafeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cafe',
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true, // 60% paid upfront
    },
    remainingAmount: {
      type: Number,
      required: true, // 40% paid on pickup
    },
    status: {
      type: String,
      enum: ['placed', 'accepted', 'preparing', 'ready', 'completed', 'rejected'],
      default: 'placed',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'full'],
      default: 'pending',
    },
    qrCode: {
      type: String, // Base64 QR code for pickup verification
      default: '',
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `GRB-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }
  next();
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ cafeId: 1, paymentStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
