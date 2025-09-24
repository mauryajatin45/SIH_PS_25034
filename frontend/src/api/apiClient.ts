// client/src/api/apiClient.ts
const RAW_BASE = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
const RAW_PREFIX = (import.meta as any)?.env?.VITE_PREFIX_URL as string | undefined;

const normalize = (v: string) => v.replace(/\/+$/, '');
const ensureLeadingSlash = (v: string) => (v.startsWith('/') ? v : `/${v}`);
const addHttpIfMissing = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);

// Detect if we're running on HTTPS (production)
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// Use relative URLs in production to avoid mixed content issues
let BASE_URL = isProduction ? '' : 'http://13.201.95.207:5000';
let API_PREFIX = '/api';

if (RAW_BASE) {
  // If VITE_API_URL is provided, it may already include /api
  const cleaned = normalize(RAW_BASE);
  BASE_URL = cleaned;
  API_PREFIX = '';
} else if (RAW_PREFIX) {
  // If prefix looks like a full URL/host, treat it as the full base
  const looksLikeHost = RAW_PREFIX.includes('localhost') || RAW_PREFIX.includes('.') || /^\d+\.\d+\.\d+\.\d+/.test(RAW_PREFIX) || /^https?:\/\//i.test(RAW_PREFIX);
  if (looksLikeHost) {
    BASE_URL = normalize(addHttpIfMissing(RAW_PREFIX));
    API_PREFIX = '';
  } else {
    BASE_URL = isProduction ? '' : 'http://13.201.95.207:5000/';
    API_PREFIX = ensureLeadingSlash(RAW_PREFIX);
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;

  // read token from storage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const res = await fetch(url, {
    credentials: 'include', // harmless if you’re not using cookies
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  // parse response safely
  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return { message: text };
        }
      })()
    : {};

  if (!res.ok) {
    const err = (data as any);
    const message = err?.error?.message || err?.message || res.statusText || 'API request failed';
    throw new Error(message);
  }
  return data;
}

export const apiClient = {
  // -------- AUTH --------
  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // expects { email, password, role }
  register: (data: { email: string; password: string; role: 'candidate' | 'admin' }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  // -------- CANDIDATES (profile upsert for current user) --------
  saveCandidate: (data: any) => request('/candidates', { method: 'POST', body: JSON.stringify(data) }),

  // optional helpers you already had
  getCandidates: () => request('/candidates', { method: 'GET' }),
  getCandidateById: (id: string) => request(`/candidates/${id}`, { method: 'GET' }),
  getMyCandidate: () => request('/candidates/me', { method: 'GET' }),
  createCandidate: (data: any) => request('/candidates', { method: 'POST', body: JSON.stringify(data) }),
  updateCandidate: (id: string, data: any) =>
    request(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateMyCandidate: (data: any) => request('/candidates/me', { method: 'PUT', body: JSON.stringify(data) }),
  deleteCandidate: (id: string) => request(`/candidates/${id}`, { method: 'DELETE' }),

  // -------- INTERNSHIPS --------
  getInternships: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/internships${qs}`, { method: 'GET' });
  },
  getInternship: (id: string) => request(`/internships/${id}`, { method: 'GET' }),
  getSimilarInternships: (id: string) => request(`/internships/${id}/similar`, { method: 'GET' }),
  createInternship: (data: any) => request('/internships', { method: 'POST', body: JSON.stringify(data) }),
  updateInternship: (id: string, data: any) =>
    request(`/internships/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInternship: (id: string) => request(`/internships/${id}`, { method: 'DELETE' }),

  // -------- RECOMMENDATIONS --------
  getRecommendations: (candidateId: string, filters?: Record<string, any>) =>
    request('/recommendations', {
      method: 'POST',
      body: JSON.stringify({ candidate_id: candidateId, filters }),
    }),
  getMLRecommendations: (candidateId: string) =>
    request('/recommendations/ml', {
      method: 'POST',
      body: JSON.stringify({ candidate_id: candidateId }),
    }),
  getRecommendation: (id: string) => request(`/recommendations/${id}`, { method: 'GET' }),
  getAllOpportunities: (candidateId: string, filters?: Record<string, any>, page: number = 1, limit: number = 10) =>
    request('/recommendations/all', {
      method: 'POST',
      body: JSON.stringify({ candidate_id: candidateId, filters, page, limit }),
    }),

  // -------- SEARCH --------
  searchInternships: (params: Record<string, string>) => {
    const qs = `?${new URLSearchParams(params).toString()}`;
    return request(`/search/internships${qs}`, { method: 'GET' });
  },

  // -------- FEEDBACK (UPDATED) --------
  // Create feedback tied to the logged-in user -> candidate (no voice for now)
  submitFeedback: (data: { rating: 'up' | 'down'; text?: string; internship?: string }) =>
    request('/feedback', { method: 'POST', body: JSON.stringify(data) }),

  // View my feedback (requires you to have GET /api/feedback/me on backend)
  getMyFeedback: () => request('/feedback/me', { method: 'GET' }),

  // Admin analytics (requires admin token)
  getFeedbackAnalytics: () => request('/feedback/analytics', { method: 'GET' }),

  // -------- ANALYTICS (general) --------
  getAnalytics: () => request('/analytics', { method: 'GET' }),
  getAnalyticsByType: (type: string) => request(`/analytics/${type}`, { method: 'GET' }),

  // -------- HEALTH / DEBUG --------
  healthCheck: () => request('/health', { method: 'GET' }),
  getDebugRoutes: () => request('/debug/routes', { method: 'GET' }),
};
