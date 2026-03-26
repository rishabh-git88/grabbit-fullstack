const express = require('express');
const router = express.Router();
const { createPayment, verifyPayment, getPaymentHistory } = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/create', protect, restrictTo('student'), createPayment);
router.post('/verify', protect, restrictTo('student'), verifyPayment);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
