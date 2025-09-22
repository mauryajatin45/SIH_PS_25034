const Candidate = require('../models/Candidate');
const Internship = require('../models/Internship');
const Feedback = require('../models/Feedback');

// Get matching analytics
const getMatchingAnalytics = async (req, res) => {
  try {
    // This would typically come from a more sophisticated analytics system
    // For now, we'll provide some mock data and basic calculations
    
    const totalCandidates = await Candidate.countDocuments();
    const totalInternships = await Internship.countDocuments({ is_active: true });
    
    res.status(200).json({
      success: true,
      data: {
        total_matches: totalCandidates * 3, // Mock data
        average_match_score: 0.78, // Mock data
        top_performing_sectors: ['Technology', 'Marketing', 'Social Impact'], // Mock data
        improvement_suggestions: [
          'Add more remote opportunities',
          'Increase stipend range diversity'
        ]
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

// Get candidate analytics
const getCandidateAnalytics = async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    
    // Get candidate distribution by location
    const locationDistribution = await Candidate.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get popular skills
    const popularSkills = await Candidate.aggregate([
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_candidates: totalCandidates,
        active_candidates: totalCandidates, // Would need activity tracking for real data
        completion_rate: 0.85, // Mock data
        popular_skills: popularSkills.map(skill => ({
          skill: skill._id,
          count: skill.count
        })),
        geographic_distribution: locationDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
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

module.exports = {
  getMatchingAnalytics,
  getCandidateAnalytics
};