const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true
  },
  stipend: {
    type: Number,
    required: true,
    min: 0
  },
  duration_weeks: {
    type: Number,
    required: true,
    min: 1
  },
  start_window: {
    type: String,
    required: true
  },
  sector: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  responsibilities: [{
    type: String,
    trim: true
  }],
  required_skills: [{
    type: String,
    trim: true
  }],
  language_supported: [{
    type: String,
    trim: true
  }],
  apply_url: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
internshipSchema.index({ sector: 1 });
internshipSchema.index({ location: 1 });
internshipSchema.index({ stipend: 1 });
internshipSchema.index({ duration_weeks: 1 });
internshipSchema.index({ is_active: 1 });
internshipSchema.index({ required_skills: 1 });

module.exports = mongoose.model('Internship', internshipSchema);