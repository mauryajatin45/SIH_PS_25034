const express = require('express');
const { getMatchingAnalytics, getCandidateAnalytics } = require('../controllers/analytics');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get matching analytics (Admin only)
router.get('/matching', auth, adminAuth, getMatchingAnalytics);

// Get candidate analytics (Admin only)
router.get('/candidates', auth, adminAuth, getCandidateAnalytics);

module.exports = router;