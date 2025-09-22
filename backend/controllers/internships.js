const Internship = require('../models/Internship');

// Get all internships with filtering
const getInternships = async (req, res) => {
  try {
    const {
      sector,
      location,
      remote,
      min_stipend,
      max_duration,
      limit = 50,
      offset = 0
    } = req.query;

    // Build filter object
    const filter = { is_active: true };
    
    if (sector) filter.sector = new RegExp(sector, 'i');
    if (location) filter.location = new RegExp(location, 'i');
    if (remote !== undefined) {
      filter.location = remote ? 'Remote' : { $ne: 'Remote' };
    }
    if (min_stipend) filter.stipend = { $gte: parseInt(min_stipend) };
    if (max_duration) filter.duration_weeks = { $lte: parseInt(max_duration) };

    const internships = await Internship.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await Internship.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        internships,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
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

// Get specific internship
const getInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship || !internship.is_active) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Internship not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: internship
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

// Get similar internships
const getSimilarInternships = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    
    if (!internship) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Internship not found'
        }
      });
    }

    const similarInternships = await Internship.find({
      _id: { $ne: internship._id },
      sector: internship.sector,
      is_active: true
    }).limit(10);

    res.status(200).json({
      success: true,
      data: {
        internships: similarInternships
      }
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

// Create new internship (Admin only)
const createInternship = async (req, res) => {
  try {
    const internshipData = {
      ...req.body,
      created_by: req.user._id
    };

    const internship = new Internship(internshipData);
    await internship.save();

    res.status(201).json({
      success: true,
      data: internship
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

// Update internship (Admin only)
const updateInternship = async (req, res) => {
  try {
    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!internship) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Internship not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: internship
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

// Delete internship (Admin only)
const deleteInternship = async (req, res) => {
  try {
    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );

    if (!internship) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Internship not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Internship deleted successfully'
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
  getInternships,
  getInternship,
  getSimilarInternships,
  createInternship,
  updateInternship,
  deleteInternship
};