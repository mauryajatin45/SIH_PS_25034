# PM Internship AI Recommender API Endpoints

## Overview
This document provides comprehensive documentation for all available endpoints in the PM Internship AI Recommender API. The API is built with FastAPI and provides AI-powered internship recommendations for students.

**Base URL:** `http://localhost:8000` (when running locally)

## Table of Contents
- [General Endpoints](#general-endpoints)
- [Health Endpoints](#health-endpoints)
- [Recommendation Endpoints](#recommendation-endpoints)
- [Error Responses](#error-responses)
- [Request/Response Models](#requestresponse-models)

## General Endpoints

| Method | Endpoint | Description | Headers | Request Body |
|--------|----------|-------------|---------|--------------|
| GET | `/` | Root endpoint with API information | None | None |
| GET | `/docs` | Interactive API documentation (Swagger UI) | None | None |
| GET | `/redoc` | Alternative API documentation (ReDoc) | None | None |

### Root Endpoint Response
```json
{
  "name": "PM Internship AI Recommender",
  "version": "1.0.0",
  "description": "AI-powered internship recommendation system",
  "endpoints": {
    "health": "/health",
    "recommend": "/recommend",
    "batch_recommend": "/recommend/batch",
    "docs": "/docs"
  }
}
```

## Health Endpoints

| Method | Endpoint | Description | Headers | Request Body |
|--------|----------|-------------|---------|--------------|
| GET | `/health` | Health check endpoint to verify system status | None | None |

### Health Check Response
```json
{
  "status": "healthy",
  "database_connected": true,
  "collection_count": 5000,
  "version": "1.0.0",
  "processing_time_ms": 15.2
}
```

**Response Fields:**
- `status`: System health status ("healthy" or "unhealthy")
- `database_connected`: Boolean indicating database connectivity
- `collection_count`: Number of documents in the database collection
- `version`: API version
- `processing_time_ms`: Time taken to process the health check

## Recommendation Endpoints

### 1. Single Recommendation

| Method | Endpoint | Description | Headers | Request Body |
|--------|----------|-------------|---------|--------------|
| POST | `/recommend` | Get internship recommendations for a single student | `Content-Type: application/json` | StudentProfile JSON |

**Query Parameters:**
- `top_k` (optional): Number of recommendations to return (default: 5, max: configured limit)

**Request Body (StudentProfile):**
```json
{
  "id": "student_123",
  "location": {
    "lat": 19.0760,
    "lon": 72.8777,
    "city": "Mumbai",
    "state": "Maharashtra"
  },
  "skills": ["Python", "Machine Learning", "Data Analysis"],
  "interests": ["AI", "Technology", "Innovation"],
  "education": "B.Tech Computer Science",
  "expected_salary": 15000,
  "min_duration_months": 3,
  "max_distance_km": 50,
  "preferred_job_roles": ["Data Scientist", "ML Engineer"],
  "preferred_sectors": ["Technology", "IT"],
  "additional_preferences": ["Remote work", "Flexible hours"]
}
```

**Response:**
```json
{
  "student_id": "student_123",
  "recommendations": [
    {
      "internship": {
        "id": "internship_456",
        "title": "Data Science Intern",
        "company": "Tech Corp",
        "location": {
          "lat": 19.0820,
          "lon": 72.8800,
          "city": "Mumbai"
        },
        "skills": ["Python", "Machine Learning"],
        "sector": "Technology",
        "job_role": "Data Scientist",
        "duration": {"months": 6},
        "expected_salary": 12000,
        "additional_support": ["Mentorship", "Certificate"]
      },
      "score": 0.95,
      "distance_km": 2.5,
      "explanation_tags": [
        "Matched skills: Python, Machine Learning",
        "Sector match: Technology",
        "Within 50 km"
      ]
    }
  ],
  "total_found": 150,
  "search_radius_used": 30,
  "processing_time_ms": 245.8,
  "request_id": "req_20241201_143022_0123"
}
```

### 2. Batch Recommendations

| Method | Endpoint | Description | Headers | Request Body |
|--------|----------|-------------|---------|--------------|
| POST | `/recommend/batch` | Get recommendations for multiple students | `Content-Type: application/json` | Array of StudentProfile JSON |

**Query Parameters:**
- `top_k` (optional): Number of recommendations per student (default: 5, max: configured limit)

**Request Body:**
```json
[
  {
    "id": "student_123",
    "location": {
      "lat": 19.0760,
      "lon": 72.8777,
      "city": "Mumbai",
      "state": "Maharashtra"
    },
    "skills": ["Python", "Machine Learning"],
    "education": "B.Tech Computer Science",
    "expected_salary": 15000,
    "min_duration_months": 3,
    "max_distance_km": 50,
    "preferred_job_roles": ["Data Scientist"],
    "preferred_sectors": ["Technology"]
  },
  {
    "id": "student_456",
    "location": {
      "lat": 28.7041,
      "lon": 77.1025,
      "city": "Delhi",
      "state": "Delhi"
    },
    "skills": ["Java", "Web Development"],
    "education": "BCA",
    "expected_salary": 10000,
    "min_duration_months": 2,
    "max_distance_km": 30,
    "preferred_job_roles": ["Software Developer"],
    "preferred_sectors": ["IT"]
  }
]
```

**Response:**
```json
{
  "request_id": "req_20241201_143022_0124",
  "results": {
    "student_123": {
      "recommendations": [...],
      "total_found": 120,
      "search_radius_used": 30,
      "processing_time_ms": 245.8
    },
    "student_456": {
      "recommendations": [...],
      "total_found": 85,
      "search_radius_used": 30,
      "processing_time_ms": 198.3
    }
  },
  "total_students": 2,
  "successful": 2,
  "failed": 0,
  "total_processing_time_ms": 444.1,
  "average_processing_time_ms": 222.05
}
```

## Error Responses

### Validation Error (400)
```json
{
  "error": "Invalid student profile",
  "details": {
    "location.lat": "latitude must be between -90 and 90",
    "education": "education cannot be empty"
  },
  "request_id": "req_20241201_143022_0123"
}
```

### Database Connection Error (503)
```json
{
  "error": "Database connection failed",
  "details": {},
  "request_id": "req_20241201_143022_0123"
}
```

### Internal Server Error (500)
```json
{
  "error": "Internal server error",
  "details": {
    "message": "An unexpected error occurred"
  },
  "request_id": "req_20241201_143022_0123"
}
```

## Request/Response Models

### Location Model
```json
{
  "lat": 19.0760,
  "lon": 72.8777,
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

**Fields:**
- `lat` (float, required): Latitude (-90 to 90)
- `lon` (float, required): Longitude (-180 to 180)
- `city` (string, required): City name
- `state` (string, required): State name

### StudentProfile Model
```json
{
  "id": "student_123",
  "location": {...},
  "skills": ["Python", "Machine Learning"],
  "interests": ["AI", "Technology"],
  "education": "B.Tech Computer Science",
  "expected_salary": 15000,
  "min_duration_months": 3,
  "max_distance_km": 50,
  "preferred_job_roles": ["Data Scientist"],
  "preferred_sectors": ["Technology"],
  "additional_preferences": ["Remote work"]
}
```

**Fields:**
- `id` (string, required): Unique student identifier
- `location` (Location, required): Student location
- `skills` (array, optional): List of student skills
- `interests` (array, optional): List of student interests
- `education` (string, required): Education qualification
- `expected_salary` (float, optional): Expected salary (≥ 0)
- `min_duration_months` (int, optional): Minimum internship duration (≥ 1)
- `max_distance_km` (int, optional): Maximum distance preference (≥ 1)
- `preferred_job_roles` (array, optional): Preferred job roles
- `preferred_sectors` (array, optional): Preferred sectors
- `additional_preferences` (array, optional): Additional preferences

### Recommendation Response Model
```json
{
  "student_id": "student_123",
  "recommendations": [...],
  "total_found": 150,
  "search_radius_used": 30,
  "processing_time_ms": 245.8,
  "request_id": "req_20241201_143022_0123"
}
```

**Fields:**
- `student_id` (string): Student identifier
- `recommendations` (array): List of scored internship recommendations
- `total_found` (int): Total internships found in search
- `search_radius_used` (int): Search radius used (km)
- `processing_time_ms` (float): Processing time in milliseconds
- `request_id` (string): Unique request identifier

## Notes

1. **Request ID**: All responses include a `request_id` for tracing and debugging
2. **Processing Time**: All endpoints include processing time in the response
3. **CORS**: The API supports CORS for web applications
4. **Validation**: Input validation is performed on all endpoints
5. **Error Handling**: Comprehensive error handling with detailed error messages
6. **Logging**: All requests are logged with timing information

## Example Usage

### cURL Example
```bash
curl -X POST "http://localhost:8000/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "student_123",
    "location": {
      "lat": 19.0760,
      "lon": 72.8777,
      "city": "Mumbai",
      "state": "Maharashtra"
    },
    "skills": ["Python", "Machine Learning"],
    "education": "B.Tech Computer Science",
    "expected_salary": 15000,
    "min_duration_months": 3,
    "max_distance_km": 50
  }'
```

### Python Example
```python
import requests

url = "http://localhost:8000/recommend"
data = {
    "id": "student_123",
    "location": {
        "lat": 19.0760,
        "lon": 72.8777,
        "city": "Mumbai",
        "state": "Maharashtra"
    },
    "skills": ["Python", "Machine Learning"],
    "education": "B.Tech Computer Science",
    "expected_salary": 15000,
    "min_duration_months": 3,
    "max_distance_km": 50
}

response = requests.post(url, json=data)
print(response.json())
