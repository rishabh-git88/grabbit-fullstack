const MenuItem = require('../models/MenuItem');
const Cafe = require('../models/Cafe');

// @desc    Add menu item
// @route   POST /api/menu
// @access  Private (Vendor)
const addMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, isAvailable, preparationTime } = req.body;

    const cafe = await Cafe.findOne({ vendorId: req.user._id });
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

    if (item.cafeId.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Item updated', item: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (Vendor)
const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('cafeId');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (item.cafeId.vendorId.toString() !== req.user._id.toString()) {
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
    const cafe = await Cafe.findOne({ vendorId: req.user._id });
    if (!cafe) return res.status(404).json({ success: false, message: 'No cafe found' });

    const menu = await MenuItem.find({ cafeId: cafe._id }).sort('category');
    res.json({ success: true, count: menu.length, menu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addMenuItem, updateMenuItem, deleteMenuItem, getVendorMenu };
