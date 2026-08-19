const MenuItem = require('../models/MenuItem');
const Cafe = require('../models/Cafe');
const { canManageCafe } = require('../utils/vendorAccess');

const getManagedCafe = async (user, cafeId) => {
  if (!cafeId) return null;
  const cafe = await Cafe.findById(cafeId);
  return canManageCafe(user, cafe) ? cafe : null;
};

// @desc    Add menu item
// @route   POST /api/menu
// @access  Private (Vendor)
const addMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, isAvailable, preparationTime, cafeId } = req.body;

    const cafe = await getManagedCafe(req.user, cafeId);
    if (!cafe) {
      return res.status(404).json({ success: false, message: 'No cafe found for this vendor' });
    }

    const item = await MenuItem.create({
      cafeId: cafe._id,
      name,
      description,
      price,
      category,
      imageUrl,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      preparationTime: preparationTime || 10,
    });

    res.status(201).json({ success: true, message: 'Menu item added', item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private (Vendor)
const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('cafeId');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (!canManageCafe(req.user, item.cafeId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowedFields = ['name', 'description', 'price', 'category', 'imageUrl', 'isAvailable', 'preparationTime'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([field]) => allowedFields.includes(field))
    );
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Item updated', item: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update menu item' });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (Vendor)
const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('cafeId');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (!canManageCafe(req.user, item.cafeId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await item.deleteOne();
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor's own menu
// @route   GET /api/menu/vendor
// @access  Private (Vendor)
const getVendorMenu = async (req, res) => {
  try {
    const cafe = await getManagedCafe(req.user, req.query.cafeId);
    if (!cafe) return res.status(404).json({ success: false, message: 'No cafe found' });

    const menu = await MenuItem.find({ cafeId: cafe._id }).sort('category');
    res.json({ success: true, count: menu.length, menu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addMenuItem, updateMenuItem, deleteMenuItem, getVendorMenu };
