import time
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from app.recommender import Recommender
from app.database import get_database, DatabaseManager
from app.models import RecommendationResponse, HealthResponse
from app.utils import (
    get_config,
    setup_logging,
    create_request_id,
    validate_student_profile,
    sanitize_student_profile,
    format_processing_time,
)

# --------------------------- Setup -------------------------------- #

config = get_config()
setup_logging(config)
logger = logging.getLogger("pm_internship_ai.api")

# Global recommender instance
recommender = Recommender()

# FastAPI app
app = FastAPI(
    title="PM Internship AI Recommender",
    description="AI-powered internship recommendation system for PM Internship platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------- Request Models (unchanged) ------------- #

class Location(BaseModel):
    """Location model for student profile."""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude")
    city: str = Field(..., description="City name")
    state: str = Field(..., description="State name")

class StudentProfile(BaseModel):
    """Student profile model for recommendation requests."""
    id: str = Field(..., description="Unique student identifier")
    location: Location = Field(..., description="Student location")
    skills: List[str] = Field(default=[], description="Student skills")
    interests: List[str] = Field(default=[], description="Student interests")
    education: str = Field(..., description="Education qualification")
    expected_salary: float = Field(default=0, ge=0, description="Expected salary")
    min_duration_months: int = Field(default=1, ge=1, description="Minimum internship duration")
    max_distance_km: int = Field(default=50, ge=1, description="Maximum distance preference")
    preferred_job_roles: List[str] = Field(default=[], description="Preferred job roles")
    preferred_sectors: List[str] = Field(default=[], description="Preferred sectors")
    additional_preferences: List[str] = Field(default=[], description="Additional preferences")

    @field_validator("education")
    @classmethod
    def validate_education(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("education cannot be empty")
        return v.strip()

# --------------------------- Dependencies --------------------------- #

def get_db():
    """Dependency to get database connection."""
    db = get_database()
    if not db.connect():
        raise HTTPException(status_code=503, detail={"error": "Service unavailable", "details": {"db": "connection failed"}})
    return db

# --------------------------- Middleware ---------------------------- #

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing + inject request id header."""
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", create_request_id())
    request.state.request_id = request_id  # make available to handlers

    try:
        response = await call_next(request)
    except Exception as e:
        # ensure header even on exceptions thrown before handlers add it
        response = JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "details": {"message": "An unexpected error occurred"},
                "request_id": request_id,
            },
        )

    processing_time_ms = (time.time() - start_time) * 1000.0
    # add trace headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Processing-Time"] = format_processing_time(processing_time_ms)

    logger.info(
        "req=%s %s %s -> %s in %s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        format_processing_time(processing_time_ms),
    )
    return response

# --------------------------- Endpoints ----------------------------- #

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check(db: DatabaseManager = Depends(get_db)):
    """Health check endpoint."""
    try:
        return HealthResponse(
            status="healthy",
            timestamp=datetime.now(),
            database_connected=True,
            model_loaded=True,
        )
    except Exception as e:
        logger.error("Health check failed: %s", e, exc_info=True)
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.now(),
            database_connected=False,
            model_loaded=False,
        )

@app.post("/recommend", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_recommendations(
    student_profile: StudentProfile,
    request: Request,
    top_k: int = 5,
    db: DatabaseManager = Depends(get_db),
):
    """Get internship recommendations for a student."""
    start_time = time.time()
    request_id = getattr(request.state, "request_id", create_request_id())

    try:
        # Convert Pydantic model to dict
        student_data = student_profile.model_dump()

        # Validate student profile
        validation_errors = validate_student_profile(student_data)
        if validation_errors:
            logger.warning("req=%s validation errors: %s", request_id, validation_errors)
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid student profile",
                    "details": validation_errors,
                    "request_id": request_id,
                },
            )

        # Sanitize profile for logging
        safe_log_profile = sanitize_student_profile(student_data)
        logger.info("req=%s processing recommend for student=%s", request_id, safe_log_profile.get("id"))

        # Clamp top_k to config
        max_k = int(config.get("max_recommendations", 5))
        eff_top_k = max(1, min(int(top_k), max_k))

        # Get recommendations
        recommendations = recommender.recommend_internships(
            student_profile=student_data,
            top_k=eff_top_k,
        )

        processing_time_ms = (time.time() - start_time) * 1000.0
        logger.info(
            "req=%s completed in %s, returned=%d (radius=%s, total_found=%s)",
            request_id,
            format_processing_time(processing_time_ms),
            len(recommendations.get("recommendations", [])),
            recommendations.get("search_radius_used"),
            recommendations.get("total_found"),
        )

        return RecommendationResponse(**recommendations)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("req=%s error: %s", request_id, str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "details": {"message": str(e)},
                "request_id": request_id,
            },
        )

def _process_single_student(
    student_profile: StudentProfile,
    eff_top_k: int,
    internships_by_id: Dict[str, Dict[str, Any]],
    compare_rows: Dict[str, Dict[str, Any]]
) -> Tuple[Dict[str, Any], Dict[str, Any], float]:
    """Process a single student and return legacy result, student output, and processing time."""
    student_start = time.time()
    sid = student_profile.id

    try:
        student_data = student_profile.model_dump()
        validation_errors = validate_student_profile(student_data)

        if validation_errors:
            elapsed = (time.time() - student_start) * 1000.0
            error_result = {
                "error": "Invalid student profile",
                "details": validation_errors,
                "processing_time_ms": elapsed,
            }
            student_out = {
                "student_id": sid,
                "error": {"message": "Invalid student profile", "details": validation_errors},
                "processing_time_ms": elapsed,
            }
            return error_result, student_out, elapsed

        recs = recommender.recommend_internships(student_profile=student_data, top_k=eff_top_k)
        elapsed = (time.time() - student_start) * 1000.0

        # Legacy result
        legacy_result = {**recs, "processing_time_ms": elapsed}

        # Process recommendations for comparison
        slim_recs = []
        for rec in recs.get("recommendations", []):
            internship = rec.get("internship")
            if not internship:
                slim_recs.append({
                    "internship_id": None,
                    "score": rec.get("score", 0.0),
                    "distance_km": rec.get("distance_km", 0.0),
                    "tags": rec.get("explanation_tags", []),
                    "fallback": True,
                })
                continue

            iid = internship.get("id")
            if iid and iid not in internships_by_id:
                internships_by_id[iid] = _extract_internship_data(internship)

            slim_recs.append({
                "internship_id": iid,
                "score": rec.get("score", 0.0),
                "distance_km": rec.get("distance_km", 0.0),
                "tags": rec.get("explanation_tags", []),
                "fallback": False,
            })

            # Build comparison row
            if iid:
                _update_comparison_row(compare_rows, iid, sid, rec, internships_by_id)

        student_out = {
            "student_id": sid,
            "recommendations": slim_recs,
            "meta": {
                "total_found": recs.get("total_found", 0),
                "search_radius_used": recs.get("search_radius_used", 0),
            },
            "processing_time_ms": elapsed,
        }

        return legacy_result, student_out, elapsed

    except Exception as e:
        elapsed = (time.time() - student_start) * 1000.0
        error_result = {
            "error": "Processing failed",
            "details": {"message": str(e)},
            "processing_time_ms": elapsed,
        }
        student_out = {
            "student_id": sid,
            "error": {"message": "Processing failed", "details": {"message": str(e)}},
            "processing_time_ms": elapsed,
        }
        return error_result, student_out, elapsed

def _extract_internship_data(internship: Dict[str, Any]) -> Dict[str, Any]:
    """Extract relevant data from internship for indexing."""
    return {
        "id": internship.get("id"),
        "title": internship.get("title"),
        "sector": internship.get("sector"),
        "job_role": internship.get("job_role"),
        "work_mode": internship.get("work_mode") or (internship.get("preference", {}) or {}).get("work_mode"),
        "location": {
            "city": (internship.get("location", {}) or {}).get("city"),
            "lat": (internship.get("location", {}) or {}).get("lat"),
            "lon": (internship.get("location", {}) or {}).get("lon"),
        },
        "duration_months": ((internship.get("duration", {}) or {}).get("months")
                            or internship.get("duration_months")),
        "expected_salary": internship.get("expected_salary"),
        "stipend": internship.get("stipend"),
        "compensation_monthly": ((internship.get("compensation", {}) or {}).get("monthly")),
        "skills": internship.get("skills", []),
        "interests": internship.get("interests", []),
        "qualification": internship.get("qualification"),
        "created_at": internship.get("created_at") or internship.get("posted_at") or internship.get("createdAt"),
    }

def _update_comparison_row(compare_rows: Dict[str, Dict[str, Any]], iid: str, sid: str, rec: Dict[str, Any], internships_by_id: Dict[str, Dict[str, Any]]):
    """Update comparison row with student recommendation data."""
    if iid not in compare_rows:
        base = internships_by_id.get(iid, {})
        compare_rows[iid] = {
            "id": iid,
            "title": base.get("title"),
            "sector": base.get("sector"),
            "job_role": base.get("job_role"),
            "work_mode": base.get("work_mode"),
            "location_city": (base.get("location") or {}).get("city"),
            "duration_months": base.get("duration_months"),
            "expected_salary": base.get("expected_salary"),
            "stipend": base.get("stipend"),
            "compensation_monthly": base.get("compensation_monthly"),
            "skills": base.get("skills", []),
            "by_student": [],
        }

    compare_rows[iid]["by_student"].append({
        "student_id": sid,
        "score": rec.get("score", 0.0),
        "distance_km": rec.get("distance_km", 0.0),
    })

def _calculate_batch_statistics(legacy_results: Dict[str, Any], total_time_ms: float, num_students: int) -> Tuple[int, int, float]:
    """Calculate batch processing statistics."""
    successful = sum(1 for r in legacy_results.values() if "recommendations" in r)
    failed = sum(1 for r in legacy_results.values() if "error" in r)
    avg_time = (total_time_ms / num_students) if num_students else 0.0
    return successful, failed, avg_time

@app.post("/recommend/batch", response_model=Dict[str, Any], tags=["Recommendations"])
async def get_batch_recommendations(
    student_profiles: List[StudentProfile],
    request: Request,
    top_k: int = 5,
):
    """Get recommendations for multiple students + a comparison-ready structure."""
    start_time = time.time()
    request_id = getattr(request.state, "request_id", create_request_id())

    try:
        total_processing_time = 0.0
        legacy_results: Dict[str, Any] = {}
        students_out: List[Dict[str, Any]] = []
        internships_by_id: Dict[str, Dict[str, Any]] = {}
        compare_rows: Dict[str, Dict[str, Any]] = {}

        logger.info("req=%s processing batch for %d students", request_id, len(student_profiles))

        max_k = int(config.get("max_recommendations", 5))
        eff_top_k = max(1, min(int(top_k), max_k))

        # Process each student
        for sp in student_profiles:
            legacy_result, student_out, elapsed = _process_single_student(
                sp, eff_top_k, internships_by_id, compare_rows
            )
            legacy_results[sp.id] = legacy_result
            students_out.append(student_out)
            total_processing_time += elapsed

        total_time_ms = (time.time() - start_time) * 1000.0
        successful, failed, avg_time = _calculate_batch_statistics(legacy_results, total_processing_time, len(student_profiles))

        # Finalize comparison data
        compare_internships = list(compare_rows.values())
        compare_internships.sort(key=lambda x: (x.get("title") or "", x.get("id") or ""))

        logger.info(
            "req=%s batch completed in %s (ok=%d, fail=%d)",
            request_id,
            format_processing_time(total_time_ms),
            successful,
            failed,
        )

        return {
            "request_id": request_id,
            "students": students_out,
            "compare": {
                "internships": compare_internships,
                "fields": [
                    {"key": "title", "label": "Title"},
                    {"key": "job_role", "label": "Role"},
                    {"key": "sector", "label": "Sector"},
                    {"key": "work_mode", "label": "Mode"},
                    {"key": "location_city", "label": "City"},
                    {"key": "duration_months", "label": "Duration (mo)"},
                    {"key": "expected_salary", "label": "Expected Salary"},
                    {"key": "stipend", "label": "Stipend"},
                    {"key": "compensation_monthly", "label": "Comp (Monthly)"},
                    {"key": "skills", "label": "Key Skills"},
                ],
            },
            "index": {"internships_by_id": internships_by_id},
            "results": legacy_results,
            "total_students": len(student_profiles),
            "successful": successful,
            "failed": failed,
            "total_processing_time_ms": total_time_ms,
            "average_processing_time_ms": avg_time,
        }

    except Exception as e:
        total_time_ms = (time.time() - start_time) * 1000.0
        logger.error("req=%s batch error: %s", request_id, str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Batch processing failed",
                "details": {"message": str(e)},
                "request_id": request_id,
            },
        )

# --------------------------- Error Handlers -------------------------- #

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent shape."""
    request_id = getattr(request.state, "request_id", create_request_id())
    # exc.detail may be str or dict
    detail = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": detail.get("error", "HTTP Exception"),
            "details": detail.get("details", detail),
            "request_id": request_id,
        },
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    request_id = getattr(request.state, "request_id", create_request_id())
    logger.error("Unhandled exception req=%s: %s", request_id, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "details": {"message": "An unexpected error occurred"},
            "request_id": request_id,
        },
    )

# --------------------------- Root ----------------------------------- #

@app.get("/", tags=["General"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "PM Internship AI Recommender",
        "version": "1.0.0",
        "description": "AI-powered internship recommendation system",
        "endpoints": {
            "health": "/health",
            "recommend": "/recommend",
            "batch_recommend": "/recommend/batch",
            "docs": "/docs",
        },
    }

# --------------------------- Entrypoint ------------------------------ #

if __name__ == "__main__":
    import uvicorn

    logger.info(
        "Starting server on %s:%s with auto-reload enabled",
        config["api_host"],
        config["api_port"],
    )
    uvicorn.run(
        app,
        host=config["api_host"],
        port=config["api_port"],
        log_level=config["log_level"].lower(),
        reload=True,
        reload_dirs=["./app"],
    )
