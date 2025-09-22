const Candidate = require('../models/Candidate');
const Internship = require('../models/Internship');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');

// Get personalized recommendations
const getRecommendations = async (req, res) => {
  try {
    const { candidate_id, filters } = req.body;
    
    // Get candidate profile
    const candidate = await Candidate.findOne({ user: candidate_id });
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Candidate not found'
        }
      });
    }

    // Build filter based on candidate preferences and optional filters
    const baseFilter = {
      is_active: true,
      stipend: { $gte: candidate.stipend_min }
    };

    if (!candidate.remote_ok) {
      baseFilter.location = candidate.location;
    }

    // Apply additional filters if provided
    if (filters) {
      if (filters.sector) baseFilter.sector = new RegExp(filters.sector, 'i');
      if (filters.location) baseFilter.location = new RegExp(filters.location, 'i');
      if (filters.remote !== undefined) {
        baseFilter.location = filters.remote ? 'Remote' : { $ne: 'Remote' };
      }
      if (filters.min_stipend) baseFilter.stipend.$gte = parseInt(filters.min_stipend);
      if (filters.max_duration) baseFilter.duration_weeks = { $lte: parseInt(filters.max_duration) };
    }

    // Get internships
    const internships = await Internship.find(baseFilter);

    // Calculate match scores and prepare recommendations
    const recommendations = internships.map(internship => {
      const matchData = calculateMatchScore(candidate, internship);
      return {
        ...internship.toObject(),
        skills_matched: matchData.skillsMatched,
        match_score: matchData.score,
        explanations: matchData.explanations
      };
    });

    // Sort by match score (highest first)
    recommendations.sort((a, b) => b.match_score - a.match_score);

    res.status(200).json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, 20), // Return top 20
        total_count: recommendations.length,
        filters_applied: filters || {}
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

// Get specific recommendation details
const getRecommendation = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    
    if (!internship || !internship.is_active) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recommendation not found'
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

module.exports = {
  getRecommendations,
  getRecommendation
};