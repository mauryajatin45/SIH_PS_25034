const express = require('express');
const { getRecommendations, getRecommendation } = require('../controllers/recommendations');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get personalized recommendations
router.post('/', auth, getRecommendations);

// Get specific recommendation details
router.get('/:id', auth, getRecommendation);

module.exports = router;