# Udaan Backend API Routes Documentation

## Overview
This document provides comprehensive documentation for all API endpoints in the Udaan Backend system. The API follows RESTful conventions and uses JSON for data exchange.

## Base URL
```
http://localhost:5000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All responses follow this structure:
```json
{
  "success": true|false,
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

## 1. Health Check

### GET /health
**Description:** Check if the server is running
**Authentication:** None required
**Response:**
```json
{
  "success": true,
  "message": "Udaan Backend is running successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 2. Authentication Routes (`/api/auth`)

### POST /api/auth/register
**Description:** Register a new user account
**Authentication:** None required
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "candidate"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "candidate"
    }
  }
}
```

### POST /api/auth/login
**Description:** Login with email and password
**Authentication:** None required
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "candidate"
    }
  }
}
```

### GET /api/auth/me
**Description:** Get current user information
**Authentication:** Required
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "candidate"
    }
  }
}
```

### POST /api/auth/logout
**Description:** Logout user (client-side token removal)
**Authentication:** Required
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. Candidate Routes (`/api/candidates`)

### POST /api/candidates
**Description:** Create or update candidate profile
**Authentication:** Required
**Request Body:**
```json
{
  "education_level": "Graduate",
  "field": "Computer Science",
  "grad_year": 2024,
  "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "interests": ["Web Development", "Machine Learning", "Data Science"],
  "location": "Mumbai",
  "remote_ok": true,
  "stipend_min": 15000,
  "availability": {
    "start": "2024-06-01T00:00:00.000Z",
    "hours_per_week": 40
  },
  "accessibility_needs": "None"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439011",
    "education_level": "Graduate",
    "field": "Computer Science",
    "grad_year": 2024,
    "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
    "interests": ["Web Development", "Machine Learning", "Data Science"],
    "location": "Mumbai",
    "remote_ok": true,
    "stipend_min": 15000,
    "availability": {
      "start": "2024-06-01T00:00:00.000Z",
      "hours_per_week": 40
    },
    "accessibility_needs": "None",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/candidates/:id
**Description:** Get candidate profile by user ID
**Authentication:** Required
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com"
    },
    "education_level": "Graduate",
    "field": "Computer Science",
    "grad_year": 2024,
    "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
    "interests": ["Web Development", "Machine Learning", "Data Science"],
    "location": "Mumbai",
    "remote_ok": true,
    "stipend_min": 15000,
    "availability": {
      "start": "2024-06-01T00:00:00.000Z",
      "hours_per_week": 40
    },
    "accessibility_needs": "None",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 4. Internship Routes (`/api/internships`)

### GET /api/internships
**Description:** Get all internships with filtering options
**Authentication:** None required
**Query Parameters:**
- `sector` (string): Filter by sector
- `location` (string): Filter by location
- `remote` (boolean): Filter by remote work
- `min_stipend` (number): Minimum stipend filter
- `max_duration` (number): Maximum duration in weeks
- `limit` (number): Number of results (default: 50)
- `offset` (number): Pagination offset (default: 0)

**Example Request:**
```
GET /api/internships?sector=Technology&location=Mumbai&min_stipend=10000&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "internships": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "title": "Full Stack Developer Intern",
        "organization": "TechCorp Solutions",
        "location": "Mumbai",
        "stipend": 25000,
        "duration_weeks": 12,
        "start_window": "June 2024",
        "sector": "Technology",
        "description": "Join our dynamic team as a Full Stack Developer Intern...",
        "responsibilities": [
          "Develop web applications using React and Node.js",
          "Collaborate with cross-functional teams",
          "Participate in code reviews and testing"
        ],
        "required_skills": ["JavaScript", "React", "Node.js", "MongoDB"],
        "language_supported": ["English", "Hindi"],
        "apply_url": "https://techcorp.com/careers/internship-001",
        "deadline": "2024-05-15T23:59:59.000Z",
        "is_active": true,
        "created_by": "507f1f77bcf86cd799439010",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### GET /api/internships/:id
**Description:** Get specific internship details
**Authentication:** None required
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Full Stack Developer Intern",
    "organization": "TechCorp Solutions",
    "location": "Mumbai",
    "stipend": 25000,
    "duration_weeks": 12,
    "start_window": "June 2024",
    "sector": "Technology",
    "description": "Join our dynamic team as a Full Stack Developer Intern and gain hands-on experience in modern web development technologies.",
    "responsibilities": [
      "Develop web applications using React and Node.js",
      "Collaborate with cross-functional teams",
      "Participate in code reviews and testing",
      "Contribute to open-source projects"
    ],
    "required_skills": ["JavaScript", "React", "Node.js", "MongoDB", "Git"],
    "language_supported": ["English", "Hindi"],
    "apply_url": "https://techcorp.com/careers/internship-001",
    "deadline": "2024-05-15T23:59:59.000Z",
    "is_active": true,
    "created_by": "507f1f77bcf86cd799439010",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/internships/:id/similar
**Description:** Get similar internships based on sector
**Authentication:** None required
**Response:**
```json
{
  "success": true,
  "data": {
    "internships": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "title": "Frontend Developer Intern",
        "organization": "WebTech Inc",
        "location": "Mumbai",
        "stipend": 20000,
        "duration_weeks": 10,
        "start_window": "July 2024",
        "sector": "Technology",
        "description": "Frontend development internship focusing on React and modern web technologies...",
        "responsibilities": [
          "Build responsive web interfaces",
          "Implement user interactions",
          "Optimize application performance"
        ],
        "required_skills": ["JavaScript", "React", "CSS", "HTML"],
        "language_supported": ["English"],
        "apply_url": "https://webtech.com/careers/frontend-intern",
        "deadline": "2024-06-30T23:59:59.000Z",
        "is_active": true,
        "created_by": "507f1f77bcf86cd799439010",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### POST /api/internships
**Description:** Create new internship (Admin only)
**Authentication:** Required (Admin role)
**Request Body:**
```json
{
  "title": "Data Science Intern",
  "organization": "DataCorp Analytics",
  "location": "Remote",
  "stipend": 30000,
  "duration_weeks": 16,
  "start_window": "August 2024",
  "sector": "Technology",
  "description": "Join our data science team and work on real-world machine learning projects...",
  "responsibilities": [
    "Analyze large datasets",
    "Build predictive models",
    "Create data visualizations",
    "Present findings to stakeholders"
  ],
  "required_skills": ["Python", "Machine Learning", "Statistics", "SQL"],
  "language_supported": ["English"],
  "apply_url": "https://datacorp.com/careers/ds-intern",
  "deadline": "2024-07-15T23:59:59.000Z"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Data Science Intern",
    "organization": "DataCorp Analytics",
    "location": "Remote",
    "stipend": 30000,
    "duration_weeks": 16,
    "start_window": "August 2024",
    "sector": "Technology",
    "description": "Join our data science team and work on real-world machine learning projects...",
    "responsibilities": [
      "Analyze large datasets",
      "Build predictive models",
      "Create data visualizations",
      "Present findings to stakeholders"
    ],
    "required_skills": ["Python", "Machine Learning", "Statistics", "SQL"],
    "language_supported": ["English"],
    "apply_url": "https://datacorp.com/careers/ds-intern",
    "deadline": "2024-07-15T23:59:59.000Z",
    "is_active": true,
    "created_by": "507f1f77bcf86cd799439010",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### PUT /api/internships/:id
**Description:** Update internship (Admin only)
**Authentication:** Required (Admin role)
**Request Body:** Same as POST, with fields to update
**Response:** Updated internship object

### DELETE /api/internships/:id
**Description:** Delete internship (Admin only) - Soft delete by setting is_active to false
**Authentication:** Required (Admin role)
**Response:**
```json
{
  "success": true,
  "message": "Internship deleted successfully"
}
```

---

## 5. Recommendation Routes (`/api/recommendations`)

### POST /api/recommendations
**Description:** Get personalized internship recommendations based on candidate profile
**Authentication:** Required
**Request Body:**
```json
{
  "candidate_id": "507f1f77bcf86cd799439011",
  "filters": {
    "sector": "Technology",
    "location": "Mumbai",
    "remote": true,
    "min_stipend": 15000,
    "max_duration": 12
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "title": "Full Stack Developer Intern",
        "organization": "TechCorp Solutions",
        "location": "Mumbai",
        "stipend": 25000,
        "duration_weeks": 12,
        "start_window": "June 2024",
        "sector": "Technology",
        "description": "Join our dynamic team as a Full Stack Developer Intern...",
        "responsibilities": [
          "Develop web applications using React and Node.js",
          "Collaborate with cross-functional teams",
          "Participate in code reviews and testing"
        ],
        "required_skills": ["JavaScript", "React", "Node.js", "MongoDB"],
        "language_supported": ["English", "Hindi"],
        "apply_url": "https://techcorp.com/careers/internship-001",
        "deadline": "2024-05-15T23:59:59.000Z",
        "is_active": true,
        "created_by": "507f1f77bcf86cd799439010",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "skills_matched": ["JavaScript", "React", "Node.js", "MongoDB"],
        "match_score": 0.85,
        "explanations": [
          "Strong match in required skills",
          "Location preference met",
          "Stipend exceeds minimum requirement"
        ]
      }
    ],
    "total_count": 15,
    "filters_applied": {
      "sector": "Technology",
      "location": "Mumbai",
      "remote": true,
      "min_stipend": 15000,
      "max_duration": 12
    }
  }
}
```

### GET /api/recommendations/:id
**Description:** Get specific recommendation details
**Authentication:** Required
**Response:** Same as GET /api/internships/:id

---

## 6. Search Routes (`/api/search`)

### GET /api/search/internships
**Description:** Search internships with advanced filtering and sorting
**Authentication:** None required
**Query Parameters:**
- `q` (string): Search query for text search
- `sector` (string): Filter by sector
- `location` (string): Filter by location
- `skills` (string): Comma-separated skills list
- `min_stipend` (number): Minimum stipend
- `remote` (boolean): Remote work filter
- `sort_by` (string): Sort by 'relevance', 'stipend', 'deadline', 'duration'
- `sort_order` (string): 'asc' or 'desc'
- `limit` (number): Number of results (default: 50)
- `offset` (number): Pagination offset (default: 0)

**Example Request:**
```
GET /api/search/internships?q=javascript&sector=Technology&min_stipend=20000&sort_by=stipend&sort_order=desc&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "internships": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "title": "Full Stack Developer Intern",
        "organization": "TechCorp Solutions",
        "location": "Mumbai",
        "stipend": 25000,
        "duration_weeks": 12,
        "start_window": "June 2024",
        "sector": "Technology",
        "description": "Join our dynamic team as a Full Stack Developer Intern...",
        "responsibilities": [
          "Develop web applications using React and Node.js",
          "Collaborate with cross-functional teams",
          "Participate in code reviews and testing"
        ],
        "required_skills": ["JavaScript", "React", "Node.js", "MongoDB"],
        "language_supported": ["English", "Hindi"],
        "apply_url": "https://techcorp.com/careers/internship-001",
        "deadline": "2024-05-15T23:59:59.000Z",
        "is_active": true,
        "created_by": "507f1f77bcf86cd799439010",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0,
    "query": {
      "q": "javascript",
      "sector": "Technology",
      "location": null,
      "skills": null,
      "min_stipend": 20000,
      "remote": null,
      "sort_by": "stipend",
      "sort_order": "desc"
    }
  }
}
```

---

## 7. Feedback Routes (`/api/feedback`)

### POST /api/feedback
**Description:** Submit feedback for internships or general platform feedback
**Authentication:** Required
**Request Body:**
```json
{
  "candidate_id": "507f1f77bcf86cd799439011",
  "internship_id": "507f1f77bcf86cd799439013",
  "rating": "up",
  "text": "Great internship opportunity with excellent learning experience!",
  "voice_url": "https://storage.example.com/feedback/voice-123.mp3",
  "metadata": {
    "session_id": "session_abc123",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "feedback_id": "507f1f77bcf86cd799439016",
    "message": "Thank you for your feedback!"
  }
}
```

### GET /api/feedback/analytics
**Description:** Get feedback analytics (Admin only)
**Authentication:** Required (Admin role)
**Response:**
```json
{
  "success": true,
  "data": {
    "total_feedback": 150,
    "positive_rating": 0.75,
    "negative_rating": 0.25,
    "top_issues": ["stipend", "duration", "location", "skills", "support"],
    "feedback_by_sector": {
      "Technology": 45,
      "Marketing": 30,
      "Social Impact": 25,
      "Finance": 20,
      "Healthcare": 15,
      "unknown": 15
    }
  }
}
```

---

## 8. Analytics Routes (`/api/analytics`)

### GET /api/analytics/matching
**Description:** Get matching analytics (Admin only)
**Authentication:** Required (Admin role)
**Response:**
```json
{
  "success": true,
  "data": {
    "total_matches": 450,
    "average_match_score": 0.78,
    "top_performing_sectors": ["Technology", "Marketing", "Social Impact"],
    "improvement_suggestions": [
      "Add more remote opportunities",
      "Increase stipend range diversity"
    ]
  }
}
```

### GET /api/analytics/candidates
**Description:** Get candidate analytics (Admin only)
**Authentication:** Required (Admin role)
**Response:**
```json
{
  "success": true,
  "data": {
    "total_candidates": 200,
    "active_candidates": 200,
    "completion_rate": 0.85,
    "popular_skills": [
      { "skill": "JavaScript", "count": 45 },
      { "skill": "Python", "count": 38 },
      { "skill": "React", "count": 32 },
      { "skill": "Node.js", "count": 28 },
      { "skill": "Machine Learning", "count": 25 }
    ],
    "geographic_distribution": {
      "Mumbai": 45,
      "Delhi": 38,
      "Bangalore": 32,
      "Pune": 25,
      "Hyderabad": 20,
      "Chennai": 18,
      "Remote": 22
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `DUPLICATE_EMAIL` | User already exists with this email |
| `INVALID_CREDENTIALS` | Invalid email or password |
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_ERROR` | Server internal error |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Headers:** Rate limit information is included in response headers

---

## CORS Configuration

- **Origin:** Configurable via `FRONTEND_URL` environment variable
- **Default:** `http://localhost:3000`
- **Credentials:** Supported

---

## Notes

1. All timestamps are in ISO 8601 format
2. Object IDs are MongoDB ObjectIds (24-character hex strings)
3. Pagination uses `limit` and `offset` parameters
4. Text search uses MongoDB's full-text search capabilities
5. Admin routes require `role: "admin"` in user profile
6. Soft delete is implemented for internships (setting `is_active: false`)
7. JWT tokens expire after 7 days
8. File uploads for voice feedback are supported via URL references
