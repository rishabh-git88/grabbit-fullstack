const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Cafe = require('../models/Cafe');
const QRCode = require('qrcode');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Student)
const placeOrder = async (req, res) => {
  try {
    const { cafeId, items, notes } = req.body;

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found' });
    if (!cafe.isOpen) return res.status(400).json({ success: false, message: 'Cafe is currently closed' });

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.itemId);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Item ${item.itemId} not found` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: `${menuItem.name} is not available` });
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

    // Emit to cafe vendor via socket
    const io = req.app.get('io');
    io.to(`cafe_${cafeId}`).emit('new_order', {
      order: await Order.findById(order._id).populate('userId', 'name email').populate('cafeId', 'name'),
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's orders
// @route   GET /api/orders/user/:userId
// @access  Private (Student)
const getUserOrders = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'vendor') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const orders = await Order.find({ userId: req.params.userId })
      .populate('cafeId', 'name location imageUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get cafe orders (vendor)
// @route   GET /api/orders/cafe/:cafeId
// @access  Private (Vendor)
const getCafeOrders = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = { cafeId: req.params.cafeId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    // Verify vendor owns this cafe
    const cafe = await Cafe.findById(order.cafeId);
    if (!cafe || cafe.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    order.status = status;
    if (status === 'completed') order.paymentStatus = 'full';
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('cafeId', 'name location imageUrl');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { placeOrder, getUserOrders, getCafeOrders, updateOrderStatus, getOrder };
