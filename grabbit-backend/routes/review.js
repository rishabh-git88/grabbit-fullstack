const express = require('express');
const { saveReview } = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, restrictTo('student'), saveReview);

module.exports = router;
