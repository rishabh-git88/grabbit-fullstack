const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Initialize Razorpay if keys exist
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_XXXXXXXXXXXXXXXX') {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (e) {
  console.log('Razorpay not configured, using simulated payments');
}

// @desc    Create payment order (Razorpay or simulated)
// @route   POST /api/payment/create
// @access  Private (Student)
const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const amountInPaise = Math.round(order.paidAmount * 100); // Razorpay uses paise

    if (razorpay) {
      // Real Razorpay payment
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: { orderId: orderId, userId: req.user._id.toString() },
      });

      const payment = await Payment.create({
        orderId,
        userId: req.user._id,
        amount: order.paidAmount,
        method: 'razorpay',
        status: 'pending',
        razorpayOrderId: razorpayOrder.id,
        type: 'advance',
      });

      return res.json({
        success: true,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: 'INR',
        paymentId: payment._id,
        orderNumber: order.orderNumber,
      });
    } else {
      // Simulated payment for development/demo
      const simulatedTransactionId = `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const payment = await Payment.create({
        orderId,
        userId: req.user._id,
        amount: order.paidAmount,
        method: 'simulated',
        status: 'success',
        transactionId: simulatedTransactionId,
        type: 'advance',
      });

      order.paymentStatus = 'partial';
      await order.save();

      return res.json({
        success: true,
        simulated: true,
        message: 'Simulated payment successful (Razorpay not configured)',
        transactionId: simulatedTransactionId,
        amount: order.paidAmount,
        paymentId: payment._id,
        orderNumber: order.orderNumber,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private (Student)
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.status = 'success';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.transactionId = razorpayPaymentId;
    await payment.save();

    const order = await Order.findById(payment.orderId);
    order.paymentStatus = 'partial';
    await order.save();

    res.json({ success: true, message: 'Payment verified successfully', payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment history
// @route   GET /api/payment/history
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('orderId', 'orderNumber totalAmount status')
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPayment, verifyPayment, getPaymentHistory };
