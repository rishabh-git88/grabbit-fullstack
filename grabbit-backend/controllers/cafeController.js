const Cafe = require('../models/Cafe');
const MenuItem = require('../models/MenuItem');
const { canManageCafe } = require('../utils/vendorAccess');

// @desc    Get all cafes
// @route   GET /api/cafes
// @access  Public
const getCafes = async (req, res) => {
  try {
    const cafes = await Cafe.find().populate('vendorId', 'name');
    res.json({ success: true, count: cafes.length, cafes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch cafes' });
  }
};

// @desc    Get single cafe
// @route   GET /api/cafes/:id
// @access  Public
const getCafe = async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id).populate('vendorId', 'name');
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found' });
    res.json({ success: true, cafe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch cafe' });
  }
};

// @desc    Get cafe menu
// @route   GET /api/cafes/:id/menu
// @access  Public
const getCafeMenu = async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found' });

    const menu = await MenuItem.find({ cafeId: req.params.id, isAvailable: true }).sort('category');
    res.json({ success: true, cafe, menu });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch menu' });
  }
};

// @desc    Get every cafe the signed-in vendor can manage
// @route   GET /api/cafes/vendor
// @access  Private (Vendor)
const getManagedCafes = async (req, res) => {
  try {
    // Avoid $or/$in here because this project enables Mongoose sanitizeFilter
    // globally. A sanitized operator query can otherwise look like an empty
    // vendor dashboard even when managedCafeIds are present.
    const ownedCafes = await Cafe.find({ vendorId: req.user._id });
    const managedCafes = (await Promise.all(
      (req.user.managedCafeIds || []).map((cafeId) => Cafe.findById(cafeId))
    )).filter(Boolean);
    const cafes = [...new Map([...ownedCafes, ...managedCafes].map((cafe) => [cafe._id.toString(), cafe])).values()]
      .sort((first, second) => first.name.localeCompare(second.name));
    console.log(JSON.stringify({ event: 'managed_cafes_loaded', userId: req.user._id.toString(), cafeCount: cafes.length }));
    res.json({ success: true, count: cafes.length, cafes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch managed cafes' });
  }
};

// @desc    Update cafe status (vendor only)
// @route   PUT /api/cafes/:id/status
// @access  Private (Vendor)
const updateCafeStatus = async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found' });

    if (!canManageCafe(req.user, cafe)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this cafe' });
    }

    const { isOpen } = req.body;
    cafe.isOpen = isOpen;
    await cafe.save();

    res.json({ success: true, message: `Cafe is now ${isOpen ? 'open' : 'closed'}`, cafe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update cafe status' });
  }
};

module.exports = { getCafes, getCafe, getCafeMenu, getManagedCafes, updateCafeStatus };
