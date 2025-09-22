const express = require('express');
const { submitFeedback, getMyFeedback, getFeedbackAnalytics } = require('../controllers/feedback');
const { auth, adminAuth } = require('../middleware/auth');
const { validateFeedback } = require('../middleware/validation');

const router = express.Router();

// Submit feedback (auth optional). If token present, req.userId will be set; otherwise anonymous.
router.post('/', validateFeedback, submitFeedback);

// (Optional) Current user's feedback list
router.get('/me', auth, getMyFeedback);

// (Optional) Admin analytics
router.get('/analytics', auth, adminAuth, getFeedbackAnalytics);

module.exports = router;
