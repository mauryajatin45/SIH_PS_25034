import time
import logging
from datetime import datetime
from typing import Dict, Any, List
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
    format_processing_time
)

# Setup logging
config = get_config()
setup_logging(config)
logger = logging.getLogger(__name__)

# Create a global recommender instance
recommender = Recommender()

# Create FastAPI app
app = FastAPI(
    title="PM Internship AI Recommender",
    description="AI-powered internship recommendation system for PM Internship platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
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

    @field_validator('education')
    @classmethod
    def validate_education(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('education cannot be empty')
        return v.strip()



# Dependency to get database connection
def get_db():
    """Dependency to get database connection."""
    db = get_database()
    if not db.connect():
        raise HTTPException(status_code=503, detail="Database connection failed")
    return db

# Middleware for request logging and timing
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing information."""
    start_time = time.time()
    request_id = create_request_id()

    # Add request ID to headers for tracing
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id

    processing_time = (time.time() - start_time) * 1000

    logger.info(
        f"Request {request_id}: {request.method} {request.url.path} - "
        f"{response.status_code} - {format_processing_time(processing_time)}"
    )

    return response

# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check(db: DatabaseManager = Depends(get_db)):
    """Health check endpoint."""
    try:
        return HealthResponse(
            status="healthy",
            timestamp=datetime.now(),
            database_connected=True
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.now(),
            database_connected=False
        )

# Main recommendation endpoint
@app.post("/recommend", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_recommendations(
    student_profile: StudentProfile,
    request: Request,
    top_k: int = 5,
    db: DatabaseManager = Depends(get_db)
):
    """Get internship recommendations for a student."""
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", create_request_id())

    try:
        # Convert Pydantic model to dict
        student_data = student_profile.model_dump()

        # Validate student profile
        validation_errors = validate_student_profile(student_data)
        if validation_errors:
            logger.warning(f"Validation errors for request {request_id}: {validation_errors}")
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid student profile",
                    "details": validation_errors,
                    "request_id": request_id
                }
            )

        # Sanitize profile for logging
        sanitize_student_profile(student_data)
        logger.info(f"Processing recommendation request {request_id} for student {student_profile.id}")

        # Get recommendations
        recommendations = recommender.recommend_internships(
            student_profile=student_data,
            top_k=min(top_k, config["max_recommendations"])
        )

        processing_time = (time.time() - start_time) * 1000

        logger.info(
            f"Completed recommendation request {request_id} in "
            f"{format_processing_time(processing_time)} - "
            f"found {len(recommendations['recommendations'])} recommendations"
        )

        return RecommendationResponse(**recommendations)

    except HTTPException:
        raise
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Error processing request {request_id}: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "details": {"message": str(e)},
                "request_id": request_id
            }
        )

# Batch recommendation endpoint
@app.post("/recommend/batch", response_model=Dict[str, Any], tags=["Recommendations"])
async def get_batch_recommendations(
    student_profiles: List[StudentProfile],
    request: Request,
    top_k: int = 5
):
    """Get recommendations for multiple students."""
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", create_request_id())

    try:
        logger.info(f"Processing batch recommendation request {request_id} for {len(student_profiles)} students")

        results = {}
        total_processing_time = 0

        for student_profile in student_profiles:
            student_start_time = time.time()

            try:
                student_data = student_profile.model_dump()
                validation_errors = validate_student_profile(student_data)

                if validation_errors:
                    results[student_profile.id] = {
                        "error": "Invalid student profile",
                        "details": validation_errors,
                        "processing_time_ms": (time.time() - student_start_time) * 1000
                    }
                    continue

                recommendations = recommender.recommend_internships(
                    student_profile=student_data,
                    top_k=min(top_k, config["max_recommendations"])
                )

                student_processing_time = (time.time() - student_start_time) * 1000
                total_processing_time += student_processing_time

                results[student_profile.id] = {
                    **recommendations,
                    "processing_time_ms": student_processing_time
                }

            except Exception as e:
                student_processing_time = (time.time() - student_start_time) * 1000
                total_processing_time += student_processing_time

                results[student_profile.id] = {
                    "error": "Processing failed",
                    "details": {"message": str(e)},
                    "processing_time_ms": student_processing_time
                }

        total_time = (time.time() - start_time) * 1000

        logger.info(
            f"Completed batch recommendation request {request_id} in "
            f"{format_processing_time(total_time)} - "
            f"processed {len(student_profiles)} students"
        )

        return {
            "request_id": request_id,
            "results": results,
            "total_students": len(student_profiles),
            "successful": sum(1 for r in results.values() if "recommendations" in r),
            "failed": sum(1 for r in results.values() if "error" in r),
            "total_processing_time_ms": total_time,
            "average_processing_time_ms": total_processing_time / len(student_profiles)
        }

    except Exception as e:
        total_time = (time.time() - start_time) * 1000
        logger.error(f"Error processing batch request {request_id}: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail={
                "error": "Batch processing failed",
                "details": {"message": str(e)},
                "request_id": request_id
            }
        )

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    request_id = request.headers.get("X-Request-ID", create_request_id())

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail.get("error", "HTTP Exception"),
            "details": exc.detail.get("details", {}),
            "request_id": request_id
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    request_id = request.headers.get("X-Request-ID", create_request_id())

    logger.error(f"Unhandled exception for request {request_id}: {str(exc)}")

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "details": {"message": "An unexpected error occurred"},
            "request_id": request_id
        }
    )

# Root endpoint
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
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting server on {config['api_host']}:{config['api_port']} with auto-reload enabled")
    uvicorn.run(
        app,
        host=config["api_host"],
        port=config["api_port"],
        log_level=config["log_level"].lower(),
        reload=True,  # Enable auto-reload on code changes
        reload_dirs=["./app"]  # Watch the app directory for changes
    )
