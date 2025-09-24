const express = require('express');
const { createOrUpdateCandidate, getCandidate, getMyCandidate, updateMyCandidate } = require('../controllers/candidates');
const { auth } = require('../middleware/auth');
const { validateCandidate } = require('../middleware/validation');
const router = express.Router();

// Create or update candidate profile
router.post('/', auth, validateCandidate, createOrUpdateCandidate);

// Get current user's candidate profile
router.get('/me', auth, getMyCandidate);

// Update current user's candidate profile
router.put('/me', auth, validateCandidate, updateMyCandidate);

// Get candidate profile by ID
router.get('/:id', auth, getCandidate);

module.exports = router;