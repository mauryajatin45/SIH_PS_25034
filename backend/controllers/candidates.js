const Candidate = require('../models/Candidate');
const User = require('../models/User');

// Create or update candidate profile
const createOrUpdateCandidate = async (req, res) => {
  try {
    const candidateData = {
      ...req.body,
      user: req.user._id
    };

    // Check if candidate profile already exists
    let candidate = await Candidate.findOne({ user: req.user._id });

    if (candidate) {
      // Update existing candidate
      candidate = await Candidate.findByIdAndUpdate(
        candidate._id,
        candidateData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new candidate
      candidate = new Candidate(candidateData);
      await candidate.save();
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }
};

// Get candidate profile by ID
const getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ user: req.params.id })
      .populate('user', 'email');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Candidate not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

module.exports = {
  createOrUpdateCandidate,
  getCandidate,
  getMyCandidate: async (req, res) => {
    try {
      const candidate = await Candidate.findOne({ user: req.user._id }).populate('user', 'email');
      if (!candidate) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Candidate not found' } });
      }
      res.status(200).json({ success: true, data: candidate });
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  },
  updateMyCandidate: async (req, res) => {
    try {
      let candidate = await Candidate.findOne({ user: req.user._id });
      if (!candidate) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Candidate not found' } });
      }
      candidate = await Candidate.findByIdAndUpdate(candidate._id, req.body, { new: true, runValidators: true });
      res.status(200).json({ success: true, data: candidate });
    } catch (error) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });
    }
  }
};