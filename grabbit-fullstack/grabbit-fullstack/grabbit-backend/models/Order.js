const mongoose = require('mongoose');

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

// Auto-generate order number before save
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `GRB${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
