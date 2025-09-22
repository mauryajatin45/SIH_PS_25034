const {
  EDUCATION_LEVELS,
  FIELDS,
  INTEREST_OPTIONS,
  SKILL_SUGGESTIONS,
  CITIES
} = require('./constants');

// Calculate match score between candidate and internship
const calculateMatchScore = (candidate, internship) => {
  let score = 0;
  const explanations = [];
  const skillsMatched = [];

  // 1. Skills matching (40% of total score)
  const candidateSkills = candidate.skills.map(s => s.toLowerCase());
  const requiredSkills = internship.required_skills.map(s => s.toLowerCase());
  
  const matchedSkills = candidateSkills.filter(skill => 
    requiredSkills.some(reqSkill => reqSkill.includes(skill) || skill.includes(reqSkill))
  );
  
  skillsMatched.push(...matchedSkills);
  
  if (matchedSkills.length > 0) {
    const skillScore = (matchedSkills.length / requiredSkills.length) * 0.4;
    score += skillScore;
    explanations.push(`Matches ${matchedSkills.length} of ${requiredSkills.length} required skills`);
  }

  // 2. Location matching (20% of total score)
  if (candidate.remote_ok && internship.location.toLowerCase() === 'remote') {
    score += 0.2;
    explanations.push('Perfect remote work match');
  } else if (internship.location.toLowerCase().includes(candidate.location.toLowerCase()) ||
             candidate.location.toLowerCase().includes(internship.location.toLowerCase())) {
    score += 0.2;
    explanations.push('Location match');
  } else if (candidate.remote_ok) {
    score += 0.1;
    explanations.push('Remote work acceptable for candidate');
  }

  // 3. Stipend matching (15% of total score)
  if (internship.stipend >= candidate.stipend_min) {
    score += 0.15;
    explanations.push(`Stipend (${internship.stipend}) meets or exceeds expectations (${candidate.stipend_min})`);
  } else {
    // Partial credit for close matches
    const stipendRatio = internship.stipend / candidate.stipend_min;
    if (stipendRatio >= 0.7) {
      score += 0.1 * stipendRatio;
      explanations.push(`Stipend is close to expectations (${Math.round(stipendRatio * 100)}%)`);
    }
  }

  // 4. Sector/Interest matching (15% of total score)
  const candidateInterests = candidate.interests.map(i => i.toLowerCase());
  if (candidateInterests.includes(internship.sector.toLowerCase())) {
    score += 0.15;
    explanations.push(`Sector (${internship.sector}) matches candidate interests`);
  }

  // 5. Duration matching (10% of total score)
  // Assuming candidate availability is in hours per week, convert to equivalent weeks
  const candidateTotalHours = candidate.availability.hours_per_week * 4; // Approximate monthly
  const internshipTotalHours = internship.duration_weeks * 40; // Assuming 40 hours/week
    
  if (candidateTotalHours >= internshipTotalHours * 0.8) {
    score += 0.1;
    explanations.push('Duration matches candidate availability');
  }

  // Ensure score is between 0 and 1
  score = Math.min(Math.max(score, 0), 1);

  return {
    score: parseFloat(score.toFixed(2)),
    explanations,
    skillsMatched
  };
};

// Generate match explanations based on score components
const generateMatchExplanations = (candidate, internship, matchData) => {
  const explanations = [...matchData.explanations];

  // Add additional context-based explanations
  if (matchData.score > 0.8) {
    explanations.unshift('Excellent match based on your profile');
  } else if (matchData.score > 0.6) {
    explanations.unshift('Good match with your skills and preferences');
  } else if (matchData.score > 0.4) {
    explanations.unshift('Reasonable match worth considering');
  }

  // Language support check
  if (internship.language_supported && internship.language_supported.length > 0) {
    const candidateLanguages = candidate.skills.filter(skill => 
      ['hindi', 'english', 'bengali', 'tamil', 'telugu'].includes(skill.toLowerCase())
    );
    
    const languageMatch = candidateLanguages.some(lang => 
      internship.language_supported.some(supLang => 
        supLang.toLowerCase().includes(lang.toLowerCase()) || 
        lang.toLowerCase().includes(supLang.toLowerCase())
      )
    );
    
    if (languageMatch) {
      explanations.push('Language support matches your skills');
    }
  }

  return explanations;
};

module.exports = {
  calculateMatchScore,
  generateMatchExplanations
};