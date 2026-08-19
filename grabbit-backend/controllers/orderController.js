const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Cafe = require('../models/Cafe');
const QRCode = require('qrcode');
const { canManageCafe } = require('../utils/vendorAccess');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Student)
const placeOrder = async (req, res) => {
  try {
    const { cafeId, items, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found' });
    if (!cafe.isOpen) return res.status(400).json({ success: false, message: 'Cafe is currently closed' });

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item?.itemId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) {
        return res.status(400).json({ success: false, message: 'Each item must have a valid quantity' });
      }
      const menuItem = await MenuItem.findById(item.itemId);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Item ${item.itemId} not found` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: `${menuItem.name} is not available` });
      }
      if (menuItem.cafeId.toString() !== cafe._id.toString()) {
        return res.status(400).json({ success: false, message: 'All items must belong to the selected cafe' });
      }
      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;
      orderItems.push({
        itemId: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
      });
    }

    const paidAmount = Math.round(totalAmount * 0.6 * 100) / 100;
    const remainingAmount = Math.round((totalAmount - paidAmount) * 100) / 100;

    const order = await Order.create({
      userId: req.user._id,
      cafeId,
      items: orderItems,
      totalAmount,
      paidAmount,
      remainingAmount,
      notes: notes || '',
      status: 'placed',
      paymentStatus: 'pending',
    });

    // Generate QR code for pickup verification
    const qrData = JSON.stringify({
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: req.user._id,
      totalAmount,
      paidAmount,
      remainingAmount,
    });

    const qrCode = await QRCode.toDataURL(qrData);
    order.qrCode = qrCode;
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to place order' });
  }
};

// @desc    Get student's orders
// @route   GET /api/orders/user/:userId
// @access  Private (Student)
const getUserOrders = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const orders = await Order.find({ userId: req.params.userId })
      .populate('cafeId', 'name location imageUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch orders' });
  }
};

// @desc    Get cafe orders (vendor)
// @route   GET /api/orders/cafe/:cafeId
// @access  Private (Vendor)
const getCafeOrders = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const cafe = await Cafe.findById(req.params.cafeId);
    if (!canManageCafe(req.user, cafe)) return res.status(403).json({ success: false, message: 'Not authorized' });
    // Avoid $in because Mongoose sanitizeFilter is enabled globally. Fetch the
    // two permitted payment states with exact queries and combine them safely.
    const baseQuery = { cafeId: req.params.cafeId };
    if (status) baseQuery.status = status;
    const maxResults = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const [partiallyPaid, fullyPaid] = await Promise.all(['partial', 'full'].map((paymentStatus) => (
      Order.find({ ...baseQuery, paymentStatus }).populate('userId', 'name email')
    )));
    const orders = [...partiallyPaid, ...fullyPaid]
      .sort((first, second) => second.createdAt - first.createdAt)
      .slice(0, maxResults);

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error(JSON.stringify({ event: 'cafe_orders_failed', message: error.message }));
    res.status(500).json({ success: false, message: 'Unable to fetch cafe orders' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Vendor)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['accepted', 'preparing', 'ready', 'completed', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Payment must be completed before updating an order' });
    }

    // Verify vendor owns this cafe
    const cafe = await Cafe.findById(order.cafeId);
    if (!canManageCafe(req.user, cafe)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const transitions = {
      placed: ['accepted', 'rejected'],
      accepted: ['preparing', 'rejected'],
      preparing: ['ready'],
      ready: ['completed'],
      completed: [],
      rejected: [],
    };
    if (!transitions[order.status].includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot move an order from ${order.status} to ${status}` });
    }
    if (status === 'completed' && order.paymentStatus !== 'full') {
      return res.status(400).json({ success: false, message: 'Collect the remaining payment before completing this order' });
    }

    order.status = status;
    await order.save();

    // Emit to student via socket
    const io = req.app.get('io');
    io.to(`user_${order.userId}`).emit('order_status_update', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status,
      cafeName: cafe.name,
    });

    res.json({ success: true, message: `Order status updated to ${status}`, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update order status' });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('cafeId', 'name location imageUrl vendorId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const isOwner = order.userId._id.toString() === req.user._id.toString();
    const isVendor = canManageCafe(req.user, order.cafeId);
    if (!isOwner && !isVendor) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch order' });
  }
};

module.exports = { placeOrder, getUserOrders, getCafeOrders, updateOrderStatus, getOrder };
