const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Cafe = require('../models/Cafe');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
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

// @desc    Get a cafe's item-sales analytics for today or the last seven days
// @route   GET /api/orders/cafe/:cafeId/analytics
// @access  Private (Vendor who manages the cafe)
const getCafeWeeklyAnalytics = async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.cafeId);
    if (!cafe || !canManageCafe(req.user, cafe)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const days = req.query.period === 'day' ? 1 : 7;
    const now = new Date();
    const currentStart = new Date(now);
    if (days === 1) currentStart.setHours(0, 0, 0, 0);
    else currentStart.setDate(currentStart.getDate() - days);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - days);
    const cafeId = new mongoose.Types.ObjectId(req.params.cafeId);
    const paidOrderMatch = {
      cafeId,
      paymentStatus: { $in: ['partial', 'full'] },
      status: { $ne: 'rejected' },
    };

    const [menu, currentItemStats, previousItemStats, summary, dailyStats] = await Promise.all([
      MenuItem.find({ cafeId }).select('name category price isAvailable').lean(),
      Order.aggregate([
        { $match: { ...paidOrderMatch, createdAt: { $gte: currentStart } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.itemId', quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } } },
      ]),
      Order.aggregate([
        { $match: { ...paidOrderMatch, createdAt: { $gte: previousStart, $lt: currentStart } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.itemId', quantity: { $sum: '$items.quantity' } } },
      ]),
      Order.aggregate([
        { $match: { ...paidOrderMatch, createdAt: { $gte: currentStart } } },
        { $group: { _id: null, orderCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { ...paidOrderMatch, createdAt: { $gte: currentStart } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const currentByItem = new Map(currentItemStats.map((item) => [item._id.toString(), item]));
    const previousByItem = new Map(previousItemStats.map((item) => [item._id.toString(), item.quantity]));
    const items = menu.map((item) => {
      const current = currentByItem.get(item._id.toString()) || { quantity: 0, revenue: 0 };
      const previousQuantity = previousByItem.get(item._id.toString()) || 0;
      return {
        _id: item._id,
        name: item.name,
        category: item.category,
        quantity: current.quantity,
        revenue: current.revenue,
        previousQuantity,
        quantityChange: current.quantity - previousQuantity,
        isAvailable: item.isAvailable,
      };
    });
    const bestSellers = items.filter((item) => item.quantity > 0)
      .sort((first, second) => second.quantity - first.quantity || second.revenue - first.revenue)
      .slice(0, 5);
    const needsAttention = items.filter((item) => item.isAvailable)
      .sort((first, second) => first.quantity - second.quantity || first.name.localeCompare(second.name))
      .slice(0, 5);
    const dayByKey = new Map(dailyStats.map((day) => [day._id, { orders: day.orders, revenue: day.revenue }]));
    const dailySales = Array.from({ length: days }, (_, index) => {
      const date = new Date(currentStart);
      date.setDate(currentStart.getDate() + index + 1);
      const key = date.toISOString().slice(0, 10);
      return { date: key, label: days === 1 ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' }), ...(dayByKey.get(key) || { orders: 0, revenue: 0 }) };
    });
    const totals = summary[0] || { orderCount: 0, revenue: 0 };

    res.json({
      success: true,
      period: { start: currentStart.toISOString(), end: now.toISOString(), days },
      totals: { orders: totals.orderCount, revenue: Math.round(totals.revenue * 100) / 100, itemsSold: items.reduce((sum, item) => sum + item.quantity, 0) },
      bestSellers,
      needsAttention,
      dailySales,
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'cafe_analytics_failed', message: error.message }));
    res.status(500).json({ success: false, message: 'Unable to load weekly analytics' });
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

module.exports = { placeOrder, getUserOrders, getCafeOrders, getCafeWeeklyAnalytics, updateOrderStatus, getOrder };
