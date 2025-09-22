const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Candidate = require('../models/Candidate');

// POST /api/feedback
// body: { rating: 'up'|'down', text?: string, internship?: string }
const submitFeedback = async (req, res) => {
  try {
    const { rating, text, internship } = req.body || {};

    // Find candidate tied to logged-in user (req.userId set by auth middleware)
    const candidateDoc = await Candidate.findOne({ user: req.userId }).select('_id');
    if (!candidateDoc) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Candidate profile not found' }
      });
    }

    const payload = {
      candidate: candidateDoc._id,
      rating,                                           // 'up' | 'down'
      text: (text || '').trim() || undefined,
      metadata: {
        user_agent: req.get('User-Agent'),
        timestamp: new Date(),
        session_id: req.get('x-session-id') || undefined
      }
    };

    if (internship && mongoose.isValidObjectId(internship)) {
      payload.internship = internship;
    }

    const feedback = await Feedback.create(payload);

    return res.status(201).json({
      success: true,
      data: {
        feedback_id: feedback._id,
        message: 'Thank you for your feedback!'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
};

// (Optional) GET /api/feedback/me — list my feedback
const getMyFeedback = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ user: req.userId }).select('_id');
    if (!candidate) return res.json({ success: true, items: [] });

    const items = await Feedback.find({ candidate: candidate._id })
      .populate('internship', 'title company')
      .sort({ createdAt: -1 });

    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
};

// (Optional) admin analytics (keep or omit)
const getFeedbackAnalytics = async (_req, res) => {
  const total = await Feedback.countDocuments();
  const up = await Feedback.countDocuments({ rating: 'up' });
  const down = await Feedback.countDocuments({ rating: 'down' });
  res.json({ success: true, data: { total, up, down } });
};

module.exports = { submitFeedback, getMyFeedback, getFeedbackAnalytics };
