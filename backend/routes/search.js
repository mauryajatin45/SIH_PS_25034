const express = require('express');
const { searchInternships } = require('../controllers/search');
const router = express.Router();

// Search internships
router.get('/internships', searchInternships);

module.exports = router;