from __future__ import annotations

from pydantic import BaseModel, Field, validator, root_validator
from typing import List, Optional, Dict, Any
from datetime import datetime


# ----------------------------- Core value objects ----------------------------- #

class Location(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    lat: float
    lon: float
    # optional to support recommender reading location.max_distance_km
    max_distance_km: Optional[float] = None

    @validator("lat")
    def _lat_range(cls, v: float) -> float:
        if not (-90 <= v <= 90):
            raise ValueError("latitude must be between -90 and 90")
        return v

    @validator("lon")
    def _lon_range(cls, v: float) -> float:
        if not (-180 <= v <= 180):
            raise ValueError("longitude must be between -180 and 180")
        return v


class Duration(BaseModel):
    months: int = Field(..., ge=0)


# ----------------------------- Preferences ----------------------------------- #

class Preference(BaseModel):
    # normalized in preprocessing as 'remote' | 'hybrid' | 'onsite'
    work_mode: Optional[str] = None
    duration_min_months: Optional[int] = Field(None, ge=0)

    # keep these here so student_profile.preference can carry richer filters
    preferred_job_roles: List[str] = Field(default_factory=list)
    preferred_sectors: List[str] = Field(default_factory=list)
    additional_preferences: List[str] = Field(default_factory=list)


# ----------------------------- Student models -------------------------------- #

class StudentProfile(BaseModel):
    id: str
    name: Optional[str] = None
    education: Optional[str] = None  # normalized by preprocessing
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    preferred_job_roles: List[str] = Field(default_factory=list)
    preferred_sectors: List[str] = Field(default_factory=list)
    location: Location
    expected_salary: Optional[float] = Field(None, ge=0)
    min_duration_months: int = Field(1, ge=1)
    # historically at top-level; recommender also supports location.max_distance_km
    max_distance_km: Optional[float] = Field(50, gt=0)
    additional_preferences: List[str] = Field(default_factory=list)
    # new: allow nested preference bag (optional)
    preference: Optional[Preference] = None

    class Config:
        # allow extra keys to keep compatibility with upstream clients
        extra = "allow"


# ----------------------------- Internship models ----------------------------- #

class Internship(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    qualification: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    job_role: Optional[str] = None
    sector: Optional[str] = None
    location: Location
    duration: Duration

    # compensation: recommender reads expected_salary | stipend | compensation.monthly
    expected_salary: Optional[float] = Field(None, ge=0)
    stipend: Optional[float] = Field(None, ge=0)
    compensation: Optional[Dict[str, Any]] = None  # e.g., {"monthly": 15000, ...}

    # work mode lives on the internship directly after preprocessing
    work_mode: Optional[str] = None  # "remote" | "hybrid" | "onsite"

    # extras
    additional_support: List[str] = Field(default_factory=list)

    # geo fields (optional; created in preprocessing if coords present)
    geo: Optional[Dict[str, Any]] = None
    location_point_city: Optional[Dict[str, Any]] = None
    location_point_exact: Optional[Dict[str, Any]] = None

    # metadata often used for tie-breakers
    created_at: Optional[datetime] = None
    posted_at: Optional[datetime] = None
    createdAt: Optional[datetime] = None  # legacy compatibility

    class Config:
        extra = "allow"


# ----------------------------- Recommender I/O ------------------------------- #

class RecommendationResult(BaseModel):
    internship: Optional[Internship] = None  # can be None for a fallback meta row
    score: float = Field(..., ge=0.0, le=1.0)
    distance_km: float = Field(..., ge=0.0)
    explanation_tags: List[str] = Field(default_factory=list)


class RecommendationResponse(BaseModel):
    student_id: str
    recommendations: List[RecommendationResult] = Field(default_factory=list)
    total_found: int = Field(..., ge=0)
    search_radius_used: int = Field(..., ge=0)
    processing_time_ms: float = Field(..., ge=0.0)


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    database_connected: bool
    model_loaded: bool
    additional_info: Optional[Dict[str, Any]] = None
    version: Optional[str] = None
    environment: Optional[str] = None
    uptime_seconds: Optional[float] = None