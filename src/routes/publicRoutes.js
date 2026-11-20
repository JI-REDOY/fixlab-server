const express = require('express');
const router = express.Router();
const { getTopTechnicians, getPublicReviews } = require('../controllers/publicController');

// Public routes (কোনো টোকেন বা লগইন লাগবে না)
router.get('/technicians', getTopTechnicians);
router.get('/reviews', getPublicReviews);

module.exports = router;