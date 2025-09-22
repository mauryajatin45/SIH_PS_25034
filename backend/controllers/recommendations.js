const Candidate = require('../models/Candidate');
const Internship = require('../models/Internship');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');
const axios = require('axios');

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

// Get ML-powered recommendations
const getMLRecommendations = async (req, res) => {
  try {
    const { candidate_id } = req.body;

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

    // Transform candidate data to ML server format
    const mlProfile = transformCandidateToMLProfile(candidate);

    // Get ML server URL from environment
    const mlServerUrl = process.env.ML_SERVER_URL || 'http://3.6.90.107';

    // Log the data being sent to ML server
    console.log('=== ML SERVER REQUEST ===');
    console.log('ML Server URL:', mlServerUrl);
    console.log('Candidate ID:', candidate_id);
    console.log('Transformed Profile Data:', JSON.stringify(mlProfile, null, 2));
    console.log('========================');

    try {
      // Call ML server
      const response = await axios.post(`${mlServerUrl}/recommend`, mlProfile, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Log the response from ML server
      console.log('=== ML SERVER RESPONSE ===');
      console.log('Response Status:', response.status);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      console.log('==========================');

      // Transform ML response to frontend format
      const transformedRecommendations = transformMLResponseToFrontend(response.data);

      res.status(200).json({
        success: true,
        data: {
          recommendations: transformedRecommendations,
          total_count: response.data.total_found || transformedRecommendations.length,
          source: 'ml_server',
          processing_time_ms: response.data.processing_time_ms
        }
      });

    } catch (mlError) {
      console.error('=== ML SERVER ERROR ===');
      console.error('Error Message:', mlError.message);
      console.error('Error Code:', mlError.code);
      console.error('Error Response:', mlError.response?.data);
      console.error('Error Status:', mlError.response?.status);
      console.error('=======================');

      // Fallback to regular recommendations if ML server fails
      console.log('Falling back to regular recommendations...');
      const fallbackRecommendations = await getFallbackRecommendations(candidate);

      res.status(200).json({
        success: true,
        data: {
          recommendations: fallbackRecommendations,
          total_count: fallbackRecommendations.length,
          source: 'fallback',
          message: 'ML server unavailable, using fallback recommendations'
        }
      });
    }

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

// Transform candidate profile to ML server format
const transformCandidateToMLProfile = (candidate) => {
  // Comprehensive city to coordinates mapping
  const cityCoordinates = {
    'Mumbai': { lat: 19.0760, lon: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
    'Delhi': { lat: 28.7041, lon: 77.1025, city: 'Delhi', state: 'Delhi' },
    'Bangalore': { lat: 12.9716, lon: 77.5946, city: 'Bangalore', state: 'Karnataka' },
    'Bengaluru': { lat: 12.9716, lon: 77.5946, city: 'Bengaluru', state: 'Karnataka' },
    'Pune': { lat: 18.5204, lon: 73.8567, city: 'Pune', state: 'Maharashtra' },
    'Hyderabad': { lat: 17.3850, lon: 78.4867, city: 'Hyderabad', state: 'Telangana' },
    'Chennai': { lat: 13.0827, lon: 80.2707, city: 'Chennai', state: 'Tamil Nadu' },
    'Kolkata': { lat: 22.5726, lon: 88.3639, city: 'Kolkata', state: 'West Bengal' },
    'Ahmedabad': { lat: 23.0225, lon: 72.5714, city: 'Ahmedabad', state: 'Gujarat' },
    'Jaipur': { lat: 26.9124, lon: 75.7873, city: 'Jaipur', state: 'Rajasthan' },
    'Surat': { lat: 21.1702, lon: 72.8311, city: 'Surat', state: 'Gujarat' },
    'Lucknow': { lat: 26.8467, lon: 80.9462, city: 'Lucknow', state: 'Uttar Pradesh' },
    'Kanpur': { lat: 26.4499, lon: 80.3319, city: 'Kanpur', state: 'Uttar Pradesh' },
    'Nagpur': { lat: 21.1458, lon: 79.0882, city: 'Nagpur', state: 'Maharashtra' },
    'Indore': { lat: 22.7196, lon: 75.8577, city: 'Indore', state: 'Madhya Pradesh' },
    'Thane': { lat: 19.2183, lon: 72.9781, city: 'Thane', state: 'Maharashtra' },
    'Bhopal': { lat: 23.2599, lon: 77.4126, city: 'Bhopal', state: 'Madhya Pradesh' },
    'Visakhapatnam': { lat: 17.6868, lon: 83.2185, city: 'Visakhapatnam', state: 'Andhra Pradesh' },
    'Vadodara': { lat: 22.3072, lon: 73.1812, city: 'Vadodara', state: 'Gujarat' },
    'Ghaziabad': { lat: 28.6692, lon: 77.4538, city: 'Ghaziabad', state: 'Uttar Pradesh' },
    'Ludhiana': { lat: 30.9010, lon: 75.8573, city: 'Ludhiana', state: 'Punjab' },
    'Agra': { lat: 27.1767, lon: 78.0081, city: 'Agra', state: 'Uttar Pradesh' },
    'Nashik': { lat: 19.9975, lon: 73.7898, city: 'Nashik', state: 'Maharashtra' },
    'Faridabad': { lat: 28.4089, lon: 77.3178, city: 'Faridabad', state: 'Haryana' },
    'Meerut': { lat: 28.9845, lon: 77.7064, city: 'Meerut', state: 'Uttar Pradesh' },
    'Rajkot': { lat: 22.3039, lon: 70.8022, city: 'Rajkot', state: 'Gujarat' },
    'Kalyan-Dombivli': { lat: 19.2354, lon: 73.1295, city: 'Kalyan-Dombivli', state: 'Maharashtra' },
    'Vasai-Virar': { lat: 19.3919, lon: 72.8397, city: 'Vasai-Virar', state: 'Maharashtra' },
    'Varanasi': { lat: 25.3176, lon: 82.9739, city: 'Varanasi', state: 'Uttar Pradesh' },
    'Srinagar': { lat: 34.0837, lon: 74.7973, city: 'Srinagar', state: 'Jammu and Kashmir' },
    'Aurangabad': { lat: 19.8762, lon: 75.3433, city: 'Aurangabad', state: 'Maharashtra' },
    'Dhanbad': { lat: 23.7957, lon: 86.4304, city: 'Dhanbad', state: 'Jharkhand' },
    'Amritsar': { lat: 31.6340, lon: 74.8723, city: 'Amritsar', state: 'Punjab' },
    'Navi Mumbai': { lat: 19.0330, lon: 73.0297, city: 'Navi Mumbai', state: 'Maharashtra' },
    'Allahabad': { lat: 25.4358, lon: 81.8463, city: 'Allahabad', state: 'Uttar Pradesh' },
    'Ranchi': { lat: 23.3441, lon: 85.3096, city: 'Ranchi', state: 'Jharkhand' },
    'Howrah': { lat: 22.5894, lon: 88.3104, city: 'Howrah', state: 'West Bengal' },
    'Coimbatore': { lat: 11.0168, lon: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu' },
    'Jabalpur': { lat: 23.1815, lon: 79.9864, city: 'Jabalpur', state: 'Madhya Pradesh' },
    'Gwalior': { lat: 26.2183, lon: 78.1828, city: 'Gwalior', state: 'Madhya Pradesh' },
    'Vijayawada': { lat: 16.5062, lon: 80.6480, city: 'Vijayawada', state: 'Andhra Pradesh' },
    'Jodhpur': { lat: 26.2389, lon: 73.0243, city: 'Jodhpur', state: 'Rajasthan' },
    'Madurai': { lat: 9.9252, lon: 78.1198, city: 'Madurai', state: 'Tamil Nadu' },
    'Raipur': { lat: 21.2514, lon: 81.6296, city: 'Raipur', state: 'Chhattisgarh' },
    'Kota': { lat: 25.2138, lon: 75.8648, city: 'Kota', state: 'Rajasthan' },
    'Guwahati': { lat: 26.1445, lon: 91.7362, city: 'Guwahati', state: 'Assam' },
    'Chandigarh': { lat: 30.7333, lon: 76.7794, city: 'Chandigarh', state: 'Chandigarh' },
    'Solapur': { lat: 17.6599, lon: 75.9064, city: 'Solapur', state: 'Maharashtra' },
    'Hubli-Dharwad': { lat: 15.3647, lon: 75.1240, city: 'Hubli-Dharwad', state: 'Karnataka' },
    'Bareilly': { lat: 28.3670, lon: 79.4304, city: 'Bareilly', state: 'Uttar Pradesh' },
    'Moradabad': { lat: 28.8386, lon: 78.7733, city: 'Moradabad', state: 'Uttar Pradesh' },
    'Mysore': { lat: 12.2958, lon: 76.6394, city: 'Mysore', state: 'Karnataka' },
    'Gurgaon': { lat: 28.4595, lon: 77.0266, city: 'Gurgaon', state: 'Haryana' },
    'Gurugram': { lat: 28.4595, lon: 77.0266, city: 'Gurugram', state: 'Haryana' },
    'Aligarh': { lat: 27.8974, lon: 78.0880, city: 'Aligarh', state: 'Uttar Pradesh' },
    'Jalandhar': { lat: 31.3260, lon: 75.5762, city: 'Jalandhar', state: 'Punjab' },
    'Tiruchirappalli': { lat: 10.7905, lon: 78.7047, city: 'Tiruchirappalli', state: 'Tamil Nadu' },
    'Bhubaneswar': { lat: 20.2961, lon: 85.8245, city: 'Bhubaneswar', state: 'Odisha' },
    'Salem': { lat: 11.6643, lon: 78.1460, city: 'Salem', state: 'Tamil Nadu' },
    'Mira-Bhayandar': { lat: 19.2952, lon: 72.8544, city: 'Mira-Bhayandar', state: 'Maharashtra' },
    'Warangal': { lat: 17.9784, lon: 79.5941, city: 'Warangal', state: 'Telangana' },
    'Thiruvananthapuram': { lat: 8.5241, lon: 76.9366, city: 'Thiruvananthapuram', state: 'Kerala' },
    'Guntur': { lat: 16.3067, lon: 80.4365, city: 'Guntur', state: 'Andhra Pradesh' },
    'Bhiwandi': { lat: 19.2967, lon: 73.0667, city: 'Bhiwandi', state: 'Maharashtra' },
    'Saharanpur': { lat: 29.9679, lon: 77.5510, city: 'Saharanpur', state: 'Uttar Pradesh' },
    'Gorakhpur': { lat: 26.7606, lon: 83.3732, city: 'Gorakhpur', state: 'Uttar Pradesh' },
    'Bikaner': { lat: 28.0229, lon: 73.3119, city: 'Bikaner', state: 'Rajasthan' },
    'Amravati': { lat: 20.9374, lon: 77.7796, city: 'Amravati', state: 'Maharashtra' },
    'Noida': { lat: 28.5355, lon: 77.3910, city: 'Noida', state: 'Uttar Pradesh' },
    'Jamshedpur': { lat: 22.8046, lon: 86.2029, city: 'Jamshedpur', state: 'Jharkhand' },
    'Bhilai': { lat: 21.1938, lon: 81.3509, city: 'Bhilai', state: 'Chhattisgarh' },
    'Cuttack': { lat: 20.4625, lon: 85.8828, city: 'Cuttack', state: 'Odisha' },
    'Firozabad': { lat: 27.1591, lon: 78.3957, city: 'Firozabad', state: 'Uttar Pradesh' },
    'Kochi': { lat: 9.9312, lon: 76.2673, city: 'Kochi', state: 'Kerala' },
    'Nellore': { lat: 14.4426, lon: 79.9865, city: 'Nellore', state: 'Andhra Pradesh' },
    'Bhavnagar': { lat: 21.7645, lon: 72.1519, city: 'Bhavnagar', state: 'Gujarat' },
    'Dehradun': { lat: 30.3165, lon: 78.0322, city: 'Dehradun', state: 'Uttarakhand' },
    'Durgapur': { lat: 23.5204, lon: 87.3119, city: 'Durgapur', state: 'West Bengal' },
    'Asansol': { lat: 23.6833, lon: 86.9833, city: 'Asansol', state: 'West Bengal' },
    'Rourkela': { lat: 22.2604, lon: 84.8536, city: 'Rourkela', state: 'Odisha' },
    'Nanded': { lat: 19.1383, lon: 77.3210, city: 'Nanded', state: 'Maharashtra' },
    'Kolhapur': { lat: 16.6913, lon: 74.2448, city: 'Kolhapur', state: 'Maharashtra' },
    'Ajmer': { lat: 26.4499, lon: 74.6399, city: 'Ajmer', state: 'Rajasthan' },
    'Akola': { lat: 20.7059, lon: 77.0218, city: 'Akola', state: 'Maharashtra' },
    'Gulbarga': { lat: 17.3297, lon: 76.8343, city: 'Gulbarga', state: 'Karnataka' },
    'Jamnagar': { lat: 22.4707, lon: 70.0577, city: 'Jamnagar', state: 'Gujarat' },
    'Ujjain': { lat: 23.1765, lon: 75.7885, city: 'Ujjain', state: 'Madhya Pradesh' },
    'Loni': { lat: 28.7514, lon: 77.2900, city: 'Loni', state: 'Uttar Pradesh' },
    'Siliguri': { lat: 26.7271, lon: 88.3953, city: 'Siliguri', state: 'West Bengal' },
    'Jhansi': { lat: 25.4484, lon: 78.5685, city: 'Jhansi', state: 'Uttar Pradesh' },
    'Ulhasnagar': { lat: 19.2215, lon: 73.1645, city: 'Ulhasnagar', state: 'Maharashtra' },
    'Jammu': { lat: 32.7266, lon: 74.8570, city: 'Jammu', state: 'Jammu and Kashmir' },
    'Sangli-Miraj & Kupwad': { lat: 16.8524, lon: 74.5815, city: 'Sangli-Miraj & Kupwad', state: 'Maharashtra' },
    'Mangalore': { lat: 12.9141, lon: 74.8560, city: 'Mangalore', state: 'Karnataka' },
    'Erode': { lat: 11.3410, lon: 77.7172, city: 'Erode', state: 'Tamil Nadu' },
    'Belgaum': { lat: 15.8497, lon: 74.4977, city: 'Belgaum', state: 'Karnataka' },
    'Ambattur': { lat: 13.0983, lon: 80.1619, city: 'Ambattur', state: 'Tamil Nadu' },
    'Tirunelveli': { lat: 8.7139, lon: 77.7567, city: 'Tirunelveli', state: 'Tamil Nadu' },
    'Malegaon': { lat: 20.5549, lon: 74.5288, city: 'Malegaon', state: 'Maharashtra' },
    'Gaya': { lat: 24.7955, lon: 85.0077, city: 'Gaya', state: 'Bihar' },
    'Jalgaon': { lat: 21.0077, lon: 75.5626, city: 'Jalgaon', state: 'Maharashtra' },
    'Udaipur': { lat: 24.5854, lon: 73.7125, city: 'Udaipur', state: 'Rajasthan' },
    'Maheshtala': { lat: 22.5087, lon: 88.3074, city: 'Maheshtala', state: 'West Bengal' },
    'Remote': { lat: 0, lon: 0, city: 'Remote', state: 'Remote' }
  };

  const location = cityCoordinates[candidate.location] || cityCoordinates['Ahmedabad']; // Default to Ahmedabad based on user's data

  // Calculate minimum duration based on availability
  const hoursPerWeek = candidate.availability?.hours_per_week || 40;
  const minDurationMonths = Math.max(1, Math.ceil(hoursPerWeek / 40)); // More accurate: 40 hours/week = 1 month

  // Create education string from level and field with proper formatting
  const educationLevelMap = {
    'High School': 'High School',
    'Undergraduate': 'B.Tech',
    'Graduate': 'M.Tech',
    'Postgraduate': 'M.Tech',
    'PhD': 'Ph.D'
  };

  const educationString = `${educationLevelMap[candidate.education_level] || candidate.education_level} ${candidate.field}`;

  // Use actual preferred job roles from candidate data
  const preferredJobRoles = candidate.preferred_job_roles || [];

  // Use actual preferred sectors from candidate data
  const preferredSectors = candidate.preferred_sectors || [];

  // Create comprehensive additional preferences array
  const additionalPreferences = [];
  if (candidate.remote_ok) {
    additionalPreferences.push('Remote work');
  }
  if (candidate.accessibility_needs && candidate.accessibility_needs !== 'None') {
    additionalPreferences.push(candidate.accessibility_needs);
  }

  // Add availability information
  if (candidate.availability?.start) {
    additionalPreferences.push(`Available from ${candidate.availability.start}`);
  }

  // Add hours per week information
  if (candidate.availability?.hours_per_week) {
    const hoursText = candidate.availability.hours_per_week >= 40 ? 'Full-time' :
                     candidate.availability.hours_per_week >= 20 ? 'Part-time' : 'Flexible';
    additionalPreferences.push(`${hoursText} availability`);
  }

  return {
    id: candidate.user.toString(),
    location: location,
    skills: candidate.skills || [],
    interests: candidate.interests || [],
    education: educationString,
    expected_salary: candidate.stipend_min || 5000,
    min_duration_months: minDurationMonths,
    max_distance_km: candidate.max_distance_km || 50,
    preferred_job_roles: preferredJobRoles,
    preferred_sectors: preferredSectors,
    additional_preferences: additionalPreferences
  };
};

// Transform ML response to frontend format
const transformMLResponseToFrontend = (mlResponse) => {
  return mlResponse.recommendations.map(rec => {
    const internship = rec.internship;
    return {
      id: internship.id,
      title: internship.title,
      organization: internship.company,
      location: internship.location.city || 'Remote',
      stipend: internship.expected_salary,
      duration_weeks: Math.ceil(internship.duration.months * 4.33), // Convert months to weeks
      start_window: 'Flexible',
      sector: internship.sector,
      skills_matched: internship.skills || [],
      match_score: rec.score,
      explanations: rec.explanation_tags || [`AI-recommended based on your profile`],
      language_supported: ['English'], // Default
      apply_url: '#', // ML server doesn't provide this
      description: `AI-recommended ${internship.job_role} position at ${internship.company}`,
      responsibilities: [`Work as ${internship.job_role}`],
      required_skills: internship.skills || [],
      deadline: null
    };
  });
};

// Fallback recommendations when ML server is unavailable
const getFallbackRecommendations = async (candidate) => {
  // Build filter based on candidate preferences
  const baseFilter = {
    is_active: true,
    stipend: { $gte: candidate.stipend_min }
  };

  if (!candidate.remote_ok) {
    baseFilter.location = candidate.location;
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

  return recommendations.slice(0, 10); // Return top 10
};

module.exports = {
  getRecommendations,
  getRecommendation,
  getMLRecommendations
};
