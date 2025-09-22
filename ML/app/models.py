from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Location(BaseModel):
    city: str
    state: Optional[str] = None
    lat: float
    lon: float

class Duration(BaseModel):
    months: int

class Preference(BaseModel):
    work_mode: str  # "remote", "hybrid", "onsite"

class StudentProfile(BaseModel):
    id: str
    name: str
    education: str  # "B.Tech", "B.Sc", "Diploma", etc.
    skills: List[str] = []
    interests: List[str] = []
    preferred_job_roles: List[str] = []
    preferred_sectors: List[str] = []
    location: Location
    expected_salary: Optional[int] = None
    min_duration_months: int = 1
    max_distance_km: int = 50
    additional_preferences: List[str] = []  # "mentor", "certificate", "stipend"

class Internship(BaseModel):
    id: str
    title: str
    description: Optional[str] = None  # Made optional with default None
    qualification: str
    skills: List[str] = []
    interests: List[str] = []
    job_role: str
    sector: str
    location: Location
    duration: Duration
    expected_salary: int
    preference: Preference
    additional_support: List[str] = []
    geo: Optional[Dict[str, Any]] = None  # Made optional with default None

class RecommendationResult(BaseModel):
    internship: Internship
    score: float
    distance_km: float
    explanation_tags: List[str]

class RecommendationResponse(BaseModel):
    student_id: str
    recommendations: List[RecommendationResult]
    total_found: int
    search_radius_used: int
    processing_time_ms: float

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    database_connected: bool
