const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getUserOrders,
  getCafeOrders,
  updateOrderStatus,
  getOrder,
} = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('student'), placeOrder);
router.get('/:id', protect, getOrder);
router.get('/user/:userId', protect, getUserOrders);
router.get('/cafe/:cafeId', protect, restrictTo('vendor'), getCafeOrders);
router.put('/:id/status', protect, restrictTo('vendor'), updateOrderStatus);

module.exports = router;
