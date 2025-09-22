// Generate unique ID
const generateId = (prefix = '') => {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
};

// Format API response
const formatResponse = (success, data = null, error = null) => {
  return {
    success,
    ...(data && { data }),
    ...(error && { error })
  };
};

// Paginate results
const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const results = {};
  
  if (endIndex < array.length) {
    results.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit
    };
  }
  
  results.results = array.slice(startIndex, endIndex);
  results.total = array.length;
  results.totalPages = Math.ceil(array.length / limit);
  
  return results;
};

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize input
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  return input;
};

// Calculate distance between two locations (simplified)
const calculateLocationDistance = (loc1, loc2) => {
  // This is a simplified version - in production, you'd use a geocoding service
  if (loc1.toLowerCase() === loc2.toLowerCase()) return 0;
  if (loc1.toLowerCase() === 'remote' || loc2.toLowerCase() === 'remote') return 1;
  return Math.random(); // Random distance for demo purposes
};

module.exports = {
  generateId,
  formatResponse,
  paginate,
  isValidEmail,
  sanitizeInput,
  calculateLocationDistance
};