export interface CandidateProfile {
  education_level: 'Undergraduate' | 'Graduate' | 'Diploma' | 'Other';
  field: string;
  grad_year: number;
  skills: string[];
  interests: string[];
  locations: string[];
  remote_ok: boolean;
  stipend_min: number;
  availability: {
    start: string;
    hours_per_week: number;
  };
  accessibility_needs: string | null;
  // New fields for ML model compatibility
  max_distance_km: number;
  preferred_job_roles: string[];
  preferred_sectors: string[];
}

export interface InternshipRecommendation {
  id: string;
  title: string;
  organization: string;
  location: string | { city: string; lat: number; lon: number };
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
  // ML-specific fields
  expected_salary?: number;
  duration_months?: number;
  job_role?: string;
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

export interface MLInternship {
  id: string;
  title: string;
  description: string;
  qualification: string;
  skills: string[];
  interests: string[];
  work_mode: string;
  preference: {
    work_mode: string;
  };
  expected_salary: number;
  job_role: string;
  sector: string;
  location: {
    city: string;
    lat: number;
    lon: number;
  };
  duration: {
    months: number;
  };
  duration_months: number;
  additional_support: string[];
  created_at: string;
  posted_at: string;
  location_point_city: {
    type: string;
    coordinates: [number, number];
  };
  location_point_exact: {
    type: string;
    coordinates: [number, number];
  };
  geo: {
    type: string;
    coordinates: [number, number];
  };
}

export interface PaginatedResponse<T> {
  recommendations: T[];
  total_count: number;
  current_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  filters_applied: Record<string, any>;
}

export interface AllOpportunitiesResponse {
  success: boolean;
  data: PaginatedResponse<InternshipRecommendation>;
}
