const express = require('express');
const router = express.Router();
const { getCafes, getCafe, getCafeMenu, updateCafeStatus } = require('../controllers/cafeController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', getCafes);
router.get('/:id', getCafe);
router.get('/:id/menu', getCafeMenu);
router.put('/:id/status', protect, restrictTo('vendor'), updateCafeStatus);

module.exports = router;
