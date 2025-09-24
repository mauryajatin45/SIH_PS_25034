const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  start: {
    type: Date,
    required: true
  },
  hours_per_week: {
    type: Number,
    required: true,
    min: 1,
    max: 40
  }
});

const candidateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  education_level: {
    type: String,
    enum: ['Undergraduate', 'Graduate', 'Diploma', 'Other'],
    required: true
  },
  field: {
    type: String,
    required: true
  },
  grad_year: {
    type: Number,
    required: true,
    min: 2023,
    max: 2030
  },
  skills: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],
  locations: [{
    type: String,
    trim: true
  }],
  remote_ok: {
    type: Boolean,
    default: false
  },
  stipend_min: {
    type: Number,
    required: true,
    min: 0
  },
  availability: {
    type: availabilitySchema,
    required: true
  },
  accessibility_needs: {
    type: String,
    default: 'None'
  },
  // New fields for ML model compatibility
  max_distance_km: {
    type: Number,
    default: 50,
    min: 1,
    max: 500
  },
  preferred_job_roles: [{
    type: String,
    trim: true
  }],
  preferred_sectors: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better query performance
candidateSchema.index({ user: 1 });
candidateSchema.index({ skills: 1 });
candidateSchema.index({ locations: 1 });
candidateSchema.index({ remote_ok: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);