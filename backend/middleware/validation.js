// middleware/validation.js

// ---------- Shared helpers ----------
const handleValidationErrors = (req, res, next) => {
  // Hook for aggregating/formatting errors from other validators (kept for future use)
  next();
};

const isValidObjectId = (value) => /^[a-fA-F\d]{24}$/.test(String(value || ''));

// ---------- Candidate validators ----------
const isValidEducationLevel = (value) =>
  ['Undergraduate', 'Graduate', 'Diploma', 'Other'].includes(value);

const isValidField = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidGradYear = (value) => Number.isInteger(value) && value >= 2023 && value <= 2030;

const isValidSkills = (value) => Array.isArray(value) && value.every((s) => typeof s === 'string');

const isValidLocation = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidStipend = (value) => typeof value === 'number' && value >= 0;

const isValidAvailability = (value) =>
  value &&
  typeof value.start === 'string' &&
  typeof value.hours_per_week === 'number' &&
  value.hours_per_week >= 1 &&
  value.hours_per_week <= 40;

const isValidMaxDistance = (value) => typeof value === 'number' && value >= 1 && value <= 500;

const isValidPreferredJobRoles = (value) => Array.isArray(value) && value.every((s) => typeof s === 'string');

const isValidPreferredSectors = (value) => Array.isArray(value) && value.every((s) => typeof s === 'string');

// ---------- Candidate validation middleware ----------
const validateCandidate = (req, res, next) => {
  const errors = [];
  const { education_level, field, grad_year, skills, location, stipend_min, availability } = req.body;

  if (!isValidEducationLevel(education_level)) {
    errors.push({
      field: 'education_level',
      message: 'Invalid education level. Must be one of: Undergraduate, Graduate, Diploma, Other',
    });
  }

  if (!isValidField(field)) {
    errors.push({ field: 'field', message: 'Field is required' });
  }

  if (!isValidGradYear(grad_year)) {
    errors.push({ field: 'grad_year', message: 'Graduation year must be between 2023 and 2030' });
  }

  if (!isValidSkills(skills)) {
    errors.push({ field: 'skills', message: 'Skills must be an array of strings' });
  }

  if (!isValidLocation(location)) {
    errors.push({ field: 'location', message: 'Location is required' });
  }

  if (!isValidStipend(stipend_min)) {
    errors.push({ field: 'stipend_min', message: 'Minimum stipend must be a positive number' });
  }

  if (!isValidAvailability(availability)) {
    errors.push({
      field: 'availability',
      message: 'Availability must include start date and hours per week (1-40)',
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: errors },
    });
  }

  next();
};

// ---------- Internship validators ----------
const isValidInternshipTitle = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidOrganization = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidDuration = (value) => typeof value === 'number' && value >= 1;
const isValidSector = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidDescription = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidUrl = (value) => {
  try {
    // Allow empty/undefined (optional fields should be checked by caller)
    if (value === undefined || value === null || value === '') return false;
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isValidDate = (value) => !isNaN(Date.parse(value));

// ---------- Internship validation middleware ----------
const validateInternship = (req, res, next) => {
  const errors = [];
  const {
    title,
    organization,
    location,
    stipend,
    duration_weeks,
    sector,
    description,
    apply_url,
    deadline,
  } = req.body;

  if (!isValidInternshipTitle(title)) errors.push({ field: 'title', message: 'Title is required' });
  if (!isValidOrganization(organization))
    errors.push({ field: 'organization', message: 'Organization is required' });
  if (!isValidLocation(location)) errors.push({ field: 'location', message: 'Location is required' });
  if (!isValidStipend(stipend)) errors.push({ field: 'stipend', message: 'Stipend must be a positive number' });
  if (!isValidDuration(duration_weeks))
    errors.push({ field: 'duration_weeks', message: 'Duration must be at least 1 week' });
  if (!isValidSector(sector)) errors.push({ field: 'sector', message: 'Sector is required' });
  if (!isValidDescription(description))
    errors.push({ field: 'description', message: 'Description is required' });
  if (!isValidUrl(apply_url))
    errors.push({ field: 'apply_url', message: 'Apply URL must be a valid URL' });
  if (!isValidDate(deadline)) errors.push({ field: 'deadline', message: 'Deadline must be a valid date' });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: errors },
    });
  }

  next();
};

// ---------- Feedback validation middleware (UPDATED) ----------
const validateFeedback = (req, res, next) => {
  const { rating, text, internship } = req.body || {};
  const errors = [];

  // rating required: 'up' | 'down'
  if (!['up', 'down'].includes(rating)) {
    errors.push({ field: 'rating', message: 'Rating must be either "up" or "down"' });
  }

  // text optional but must be string if present
  if (text !== undefined && typeof text !== 'string') {
    errors.push({ field: 'text', message: 'Text feedback must be a string' });
  }

  // internship optional but must be a valid ObjectId if present
  if (internship !== undefined && !isValidObjectId(internship)) {
    errors.push({ field: 'internship', message: 'Invalid internship id' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: errors },
    });
  }

  next();
};

module.exports = {
  validateCandidate,
  validateInternship,
  validateFeedback,
  handleValidationErrors,
};
