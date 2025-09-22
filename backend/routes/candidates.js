const express = require('express');
const { createOrUpdateCandidate, getCandidate } = require('../controllers/candidates');
const { auth } = require('../middleware/auth');
const { validateCandidate } = require('../middleware/validation');
const router = express.Router();

// Create or update candidate profile
router.post('/', auth, validateCandidate, createOrUpdateCandidate);

// Get candidate profile by ID
router.get('/:id', auth, getCandidate);

module.exports = router;