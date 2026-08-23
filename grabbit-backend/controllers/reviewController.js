const Order = require('../models/Order');
const Review = require('../models/Review');

// @desc    Create or update a student's rating for an item in a completed order
// @route   POST /api/reviews
// @access  Private (Student)
const saveReview = async (req, res) => {
  const { orderId, itemId, rating } = req.body;
  if (!orderId || !itemId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Order, item, and a rating from 1 to 5 are required.' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order || order.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Completed order not found.' });
    }
    if (order.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can rate items after the order is completed.' });
    }
    if (!order.items.some((item) => item.itemId.toString() === itemId)) {
      return res.status(400).json({ success: false, message: 'This item was not part of that order.' });
    }

    const review = await Review.findOneAndUpdate(
      { userId: req.user._id, orderId, itemId },
      { userId: req.user._id, cafeId: order.cafeId, orderId, itemId, rating },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    res.status(201).json({ success: true, message: 'Thanks for your rating!', review });
  } catch (error) {
    console.error(JSON.stringify({ event: 'review_save_failed', message: error.message }));
    res.status(500).json({ success: false, message: 'Unable to save your rating.' });
  }
};

module.exports = { saveReview };
