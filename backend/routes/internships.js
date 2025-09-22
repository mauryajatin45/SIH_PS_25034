const express = require('express');
const {
  getInternships,
  getInternship,
  getSimilarInternships,
  createInternship,
  updateInternship,
  deleteInternship
} = require('../controllers/internships');
const { auth, adminAuth } = require('../middleware/auth');
const { validateInternship } = require('../middleware/validation');
const router = express.Router();

// Get all internships with filtering
router.get('/', getInternships);

// Get specific internship
router.get('/:id', getInternship);

// Get similar internships
router.get('/:id/similar', getSimilarInternships);

// Create new internship (Admin only)
router.post('/', auth, adminAuth, validateInternship, createInternship);

// Update internship (Admin only)
router.put('/:id', auth, adminAuth, validateInternship, updateInternship);

// Delete internship (Admin only)
router.delete('/:id', auth, adminAuth, deleteInternship);

module.exports = router;