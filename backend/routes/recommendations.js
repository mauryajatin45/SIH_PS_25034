const express = require('express');
const { getRecommendations, getRecommendation, getMLRecommendations } = require('../controllers/recommendations');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get personalized recommendations
router.post('/', auth, getRecommendations);

// Get ML-powered recommendations
router.post('/ml', auth, getMLRecommendations);

// Get specific recommendation details
router.get('/:id', auth, getRecommendation);

module.exports = router;