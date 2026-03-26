const express = require('express');
const router = express.Router();
const { addMenuItem, updateMenuItem, deleteMenuItem, getVendorMenu } = require('../controllers/menuController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/vendor', protect, restrictTo('vendor'), getVendorMenu);
router.post('/', protect, restrictTo('vendor'), addMenuItem);
router.put('/:id', protect, restrictTo('vendor'), updateMenuItem);
router.delete('/:id', protect, restrictTo('vendor'), deleteMenuItem);

module.exports = router;
