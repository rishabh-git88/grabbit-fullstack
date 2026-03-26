const Cafe = require('../models/Cafe');
const MenuItem = require('../models/MenuItem');

// @desc    Get all cafes
// @route   GET /api/cafes
// @access  Public
const getCafes = async (req, res) => {
  try {
    const cafes = await Cafe.find().populate('vendorId', 'name email');
    res.json({ success: true, count: cafes.length, cafes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single cafe
// @route   GET /api/cafes/:id
// @access  Public
const getCafe = async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id).populate('vendorId', 'name email');
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found' });
    res.json({ success: true, cafe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get cafe menu
// @route   GET /api/cafes/:id/menu
// @access  Public
const getCafeMenu = async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found' });

    const menu = await MenuItem.find({ cafeId: req.params.id }).sort('category');
    res.json({ success: true, cafe, menu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update cafe status (vendor only)
// @route   PUT /api/cafes/:id/status
// @access  Private (Vendor)
const updateCafeStatus = async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ success: false, message: 'Cafe not found' });

    if (cafe.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this cafe' });
    }

    const { isOpen } = req.body;
    cafe.isOpen = isOpen;
    await cafe.save();

    res.json({ success: true, message: `Cafe is now ${isOpen ? 'open' : 'closed'}`, cafe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCafes, getCafe, getCafeMenu, updateCafeStatus };
