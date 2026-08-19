const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { canManageCafe } = require('../utils/vendorAccess');

const notifyVendor = async (io, orderId) => {
  if (!io) return;

  const order = await Order.findById(orderId)
    .populate('userId', 'name email')
    .populate('cafeId', 'name');
  if (!order) return;

  io.to(`cafe_${order.cafeId._id}`).emit('new_order', { order });
};

const markAdvancePaid = async (payment, razorpayPaymentId = '') => {
  if (payment.status === 'success') return Order.findById(payment.orderId);
  payment.status = 'success';
  if (razorpayPaymentId) {
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.transactionId = razorpayPaymentId;
  }
  await payment.save();

  const order = await Order.findById(payment.orderId);
  if (!order) throw new Error('Order not found');
  order.paymentStatus = 'partial';
  await order.save();
  return order;
};

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
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Payment has already been completed for this order' });
    }

    const amountInPaise = Math.round(order.paidAmount * 100); // Razorpay uses paise

    if (razorpay) {
      const existingPayment = await Payment.findOne({ orderId, userId: req.user._id, type: 'advance', status: 'pending' });
      if (existingPayment?.razorpayOrderId) {
        return res.json({
          success: true,
          razorpayOrderId: existingPayment.razorpayOrderId,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          amount: amountInPaise,
          currency: 'INR',
          paymentId: existingPayment._id,
          orderNumber: order.orderNumber,
        });
      }

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
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, message: 'Payments are not configured' });
      }

      // Simulated payment is available only in local development.
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

      await markAdvancePaid(payment);
      await notifyVendor(req.app.get('io'), order._id);

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
    console.error(JSON.stringify({ event: 'payment_create_failed', message: error.message }));
    res.status(500).json({ success: false, message: 'Unable to create payment' });
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
    if (payment.userId.toString() !== req.user._id.toString() || payment.razorpayOrderId !== razorpayOrderId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (payment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Payment has already been verified' });
    }

    payment.razorpaySignature = razorpaySignature;
    await payment.save();
    const order = await markAdvancePaid(payment, razorpayPaymentId);
    await notifyVendor(req.app.get('io'), order._id);

    res.json({ success: true, message: 'Payment verified successfully', payment });
  } catch (error) {
    console.error(JSON.stringify({ event: 'payment_verify_failed', message: error.message }));
    res.status(500).json({ success: false, message: 'Unable to verify payment' });
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
    res.status(500).json({ success: false, message: 'Unable to fetch payment history' });
  }
};

// @desc    Mark the collection-at-pickup payment as received
// @route   POST /api/payment/:orderId/collect-remaining
// @access  Private (Vendor)
const collectRemainingPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('cafeId', 'vendorId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!canManageCafe(req.user, order.cafeId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (order.status !== 'ready' || order.paymentStatus !== 'partial') {
      return res.status(400).json({ success: false, message: 'This order is not ready for remaining-payment collection' });
    }

    const existing = await Payment.findOne({ orderId: order._id, type: 'remaining', status: 'success' });
    if (!existing) {
      await Payment.create({
        orderId: order._id,
        userId: order.userId,
        amount: order.remainingAmount,
        method: 'cash',
        status: 'success',
        transactionId: `CASH_${order._id}`,
        type: 'remaining',
      });
    }
    order.paymentStatus = 'full';
    await order.save();
    return res.json({ success: true, message: 'Remaining payment recorded', order });
  } catch (error) {
    console.error(JSON.stringify({ event: 'remaining_payment_failed', message: error.message }));
    return res.status(500).json({ success: false, message: 'Unable to collect remaining payment' });
  }
};

// Razorpay sends the source-of-truth capture event. The raw request body is supplied by server.js.
const paymentWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(req.body).digest('hex');
    if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body.toString('utf8'));
    const paymentEntity = event.payload?.payment?.entity;
    if (!paymentEntity?.order_id) return res.status(200).json({ success: true });

    const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id, type: 'advance' });
    if (!payment) return res.status(200).json({ success: true });

    if (event.event === 'payment.captured') {
      const order = await markAdvancePaid(payment, paymentEntity.id);
      await notifyVendor(req.app.get('io'), order._id);
    } else if (event.event === 'payment.failed' && payment.status === 'pending') {
      payment.status = 'failed';
      await payment.save();
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(JSON.stringify({ event: 'razorpay_webhook_failed', message: error.message }));
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

module.exports = { createPayment, verifyPayment, getPaymentHistory, collectRemainingPayment, paymentWebhook };
