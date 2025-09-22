import { InternshipRecommendation } from '../types';

export const mockInternships: InternshipRecommendation[] = [
  {
    id: 'intern_001',
    title: 'Data Analytics Intern',
    organization: 'Tech for Good Foundation',
    location: 'Remote',
    stipend: 8000,
    duration_weeks: 12,
    start_window: 'Oct–Nov 2025',
    sector: 'Social Impact',
    skills_matched: ['Excel', 'Data Analysis', 'Hindi'],
    match_score: 0.92,
    explanations: [
      'Perfect match for your Excel and data analysis skills',
      'Offers remote work and stipend above your expectation',
      'Organization supports Hindi speakers',
      'Social impact sector aligns with your interests'
    ],
    language_supported: ['Hindi', 'English'],
    apply_url: 'https://example.com/apply/001',
    description: 'Join our mission to analyze data for social good initiatives across India. Work with real datasets to drive positive change in rural communities.',
    responsibilities: [
      'Analyze data from social programs',
      'Create reports and visualizations',
      'Support field teams with insights',
      'Present findings to stakeholders'
    ],
    required_skills: ['Excel', 'Data Analysis', 'Communication'],
    deadline: '2025-09-15'
  },
  {
    id: 'intern_002',
    title: 'Content Marketing Intern',
    organization: 'Digital India Initiative',
    location: 'Delhi, India',
    stipend: 6000,
    duration_weeks: 8,
    start_window: 'Nov–Dec 2025',
    sector: 'Marketing',
    skills_matched: ['Content Writing', 'Hindi', 'Social Media'],
    match_score: 0.88,
    explanations: [
      'Your content writing skills are a perfect fit',
      'Hindi language skills highly valued',
      'Location preference matches',
      'Growing digital marketing sector'
    ],
    language_supported: ['Hindi', 'English', 'Bengali'],
    apply_url: 'https://example.com/apply/002',
    description: 'Help create engaging content for India\'s digital transformation programs. Work with diverse teams to reach millions of citizens.',
    responsibilities: [
      'Create social media content',
      'Write blog posts and articles',
      'Develop campaign materials',
      'Engage with online communities'
    ],
    required_skills: ['Content Writing', 'Social Media', 'Hindi'],
    deadline: '2025-10-01'
  },
  {
    id: 'intern_003',
    title: 'UX Design Intern',
    organization: 'Accessible Tech Solutions',
    location: 'Bangalore, India',
    stipend: 12000,
    duration_weeks: 16,
    start_window: 'Dec 2025–Jan 2026',
    sector: 'Design',
    skills_matched: ['Design', 'User Research'],
    match_score: 0.85,
    explanations: [
      'Design portfolio shows strong potential',
      'Interest in accessible technology aligns',
      'Stipend exceeds your minimum requirement',
      'Extended duration for deep learning'
    ],
    language_supported: ['English', 'Hindi', 'Kannada'],
    apply_url: 'https://example.com/apply/003',
    description: 'Design inclusive digital experiences for users with disabilities. Learn cutting-edge accessibility practices while building real products.',
    responsibilities: [
      'Design accessible user interfaces',
      'Conduct user research with diverse groups',
      'Create wireframes and prototypes',
      'Test designs with assistive technologies'
    ],
    required_skills: ['Design Thinking', 'Figma', 'User Research'],
    deadline: '2025-11-15'
  },
  {
    id: 'intern_004',
    title: 'Operations Support Intern',
    organization: 'Rural Development Corp',
    location: 'Ranchi, Jharkhand',
    stipend: 5500,
    duration_weeks: 10,
    start_window: 'Oct 2025',
    sector: 'Operations',
    skills_matched: ['Operations', 'Hindi', 'Project Management'],
    match_score: 0.83,
    explanations: [
      'Location matches your preference exactly',
      'Hindi communication skills essential',
      'Operations experience valued highly',
      'Local community impact focus'
    ],
    language_supported: ['Hindi', 'English'],
    apply_url: 'https://example.com/apply/004',
    description: 'Support rural development operations in Jharkhand. Help coordinate programs that directly impact local communities.',
    responsibilities: [
      'Coordinate field operations',
      'Manage project timelines',
      'Communicate with local stakeholders',
      'Track program metrics'
    ],
    required_skills: ['Operations', 'Hindi', 'Communication'],
    deadline: '2025-09-30'
  },
  {
    id: 'intern_005',
    title: 'Research Intern',
    organization: 'Policy Research Institute',
    location: 'Remote',
    stipend: 7500,
    duration_weeks: 14,
    start_window: 'Nov 2025–Feb 2026',
    sector: 'Research',
    skills_matched: ['Research', 'Data Analysis', 'Writing'],
    match_score: 0.81,
    explanations: [
      'Research skills match requirements',
      'Flexible remote work arrangement',
      'Extended learning opportunity',
      'Policy research experience valuable'
    ],
    language_supported: ['English', 'Hindi'],
    apply_url: 'https://example.com/apply/005',
    description: 'Conduct research on education policy impacts across Indian states. Contribute to reports that influence national policy.',
    responsibilities: [
      'Conduct literature reviews',
      'Analyze policy data',
      'Interview stakeholders',
      'Write research reports'
    ],
    required_skills: ['Research Methods', 'Data Analysis', 'Academic Writing'],
    deadline: '2025-10-20'
  }
];

export const educationLevels = ['Undergraduate', 'Graduate', 'Diploma', 'Other'];
export const fields = [
  'Computer Science', 'Engineering', 'Business', 'Arts', 'Science', 
  'Commerce', 'Medicine', 'Law', 'Education', 'Social Work', 'Other'
];
export const skillSuggestions = [
  'Python', 'JavaScript', 'Excel', 'Data Analysis', 'Content Writing',
  'Social Media', 'Design', 'Research', 'Project Management', 'Communication',
  'Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Marketing', 'Sales',
  'Customer Service', 'Teaching', 'Photography', 'Video Editing'
];
export const interestOptions = [
  'Data', 'Design', 'Marketing', 'Operations', 'Social Impact',
  'Technology', 'Education', 'Healthcare', 'Environment', 'Finance',
  'Media', 'Research', 'Policy', 'Startups', 'NGOs'
];
export const cities = [
  'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Bhopal', 'Ranchi', 'Patna', 'Guwahati'
];