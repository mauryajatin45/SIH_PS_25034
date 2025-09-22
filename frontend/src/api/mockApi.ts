import { CandidateProfile, InternshipRecommendation, FeedbackData } from '../types';
import { mockInternships } from '../data/mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  async getRecommendations(profile: CandidateProfile): Promise<InternshipRecommendation[]> {
    await delay(1500); // Simulate API call
    
    // Simple matching logic based on profile
    let recommendations = [...mockInternships];
    
    // Filter by location preference
    if (!profile.remote_ok) {
      recommendations = recommendations.filter(intern => 
        intern.location.toLowerCase().includes((profile.location || '').toLowerCase()) ||
        intern.location === 'Remote'
      );
    }
    
    // Filter by stipend
    recommendations = recommendations.filter(intern => 
      intern.stipend >= (typeof profile.stipend_min === 'number' ? profile.stipend_min : 0)
    );
    
    // Sort by match score and skills overlap
    recommendations = recommendations.sort((a, b) => {
      const aSkillMatch = a.skills_matched.filter(skill => 
        (profile.skills || []).some(pSkill => 
          pSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(pSkill.toLowerCase())
        )
      ).length;
      
      const bSkillMatch = b.skills_matched.filter(skill => 
        (profile.skills || []).some(pSkill => 
          pSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(pSkill.toLowerCase())
        )
      ).length;
      
      return (b.match_score + bSkillMatch * 0.1) - (a.match_score + aSkillMatch * 0.1);
    });
    
    // Return top 5 recommendations
    return recommendations.slice(0, 5);
  },

  async getInternshipDetails(id: string): Promise<InternshipRecommendation | null> {
    await delay(800);
    return mockInternships.find(intern => intern.id === id) || null;
  },

  async submitFeedback(feedback: FeedbackData): Promise<boolean> {
    await delay(500);
    console.log('Feedback submitted:', feedback);
    return true;
  },

  async getSimilarInternships(id: string): Promise<InternshipRecommendation[]> {
    await delay(600);
    const current = mockInternships.find(intern => intern.id === id);
    if (!current) return [];
    
    return mockInternships
      .filter(intern => intern.id !== id && intern.sector === current.sector)
      .slice(0, 3);
  }
};