const mongoose = require('mongoose');

// Use the ML database connection
let mlConnection;
if (global.mlConnection) {
  mlConnection = global.mlConnection;
} else {
  // Fallback to main connection if ML connection not available
  mlConnection = mongoose;
  console.warn('ML connection not available, using main connection as fallback');
}

const mlInternshipSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  qualification: {
    type: String,
    required: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],
  work_mode: {
    type: String,
    required: true
  },
  preference: {
    work_mode: {
      type: String,
      required: true
    }
  },
  expected_salary: {
    type: Number,
    required: true,
    min: 0
  },
  job_role: {
    type: String,
    required: true,
    trim: true
  },
  sector: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    city: {
      type: String,
      required: true
    },
    lat: {
      type: Number,
      required: true
    },
    lon: {
      type: Number,
      required: true
    }
  },
  duration: {
    months: {
      type: Number,
      required: true,
      min: 1
    }
  },
  duration_months: {
    type: Number,
    required: true,
    min: 1
  },
  additional_support: [{
    type: String,
    trim: true
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  posted_at: {
    type: Date,
    default: Date.now
  },
  location_point_city: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  location_point_exact: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  geo: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
mlInternshipSchema.index({ 'location_point_city': '2dsphere' });
mlInternshipSchema.index({ 'location_point_exact': '2dsphere' });
mlInternshipSchema.index({ sector: 1 });
mlInternshipSchema.index({ job_role: 1 });
mlInternshipSchema.index({ expected_salary: 1 });
mlInternshipSchema.index({ created_at: -1 });

// Use the ML connection to create the model with correct collection name
module.exports = mlConnection.model('InternshipData', mlInternshipSchema, 'internship_data');
