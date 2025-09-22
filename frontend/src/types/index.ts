export interface CandidateProfile {
  education_level: 'Undergraduate' | 'Graduate' | 'Diploma' | 'Other';
  field: string;
  grad_year: number;
  skills: string[];
  interests: string[];
  location: string;
  remote_ok: boolean;
  stipend_min: number;
  availability: {
    start: string;
    hours_per_week: number;
  };
  accessibility_needs: string | null;
}

export interface InternshipRecommendation {
  id: string;
  title: string;
  organization: string;
  location: string;
  stipend: number;
  duration_weeks: number;
  start_window: string;
  sector: string;
  skills_matched: string[];
  match_score: number;
  explanations: string[];
  language_supported: string[];
  apply_url: string;
  description?: string;
  responsibilities?: string[];
  required_skills?: string[];
  deadline?: string;
}

export interface FeedbackData {
  rating: 'up' | 'down';
  text?: string;
  voiceUrl?: string;
}

export interface FormStep {
  id: string;
  title: string;
  completed: boolean;
}