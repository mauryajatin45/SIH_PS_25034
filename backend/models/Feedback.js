const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: false
  },
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship'
  },
  rating: {
    type: String,
    enum: ['up', 'down'],
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  voice_url: {
    type: String,
    trim: true
  },
  metadata: {
    user_agent: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    session_id: String
  }
}, {
  timestamps: true
});

// Index for analytics queries
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ createdAt: 1 });
feedbackSchema.index({ candidate: 1, internship: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);