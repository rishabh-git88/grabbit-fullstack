const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cafeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

// A student may revise their rating, but can rate a menu item only once per order.
reviewSchema.index({ userId: 1, orderId: 1, itemId: 1 }, { unique: true });
reviewSchema.index({ cafeId: 1, itemId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
