import os
import logging
from typing import Dict, Any
from datetime import datetime

# Configuration settings
DEFAULT_CONFIG = {
    "mongodb_uri": "mongodb://localhost:27017/pm_internship_ai",
    "debug": False,
    "log_level": "INFO",
    "max_recommendations": 5,
    "default_search_radius_km": 50,
    "max_search_radius_km": 500,
    "min_internships_for_recommendation": 10,
    "api_host": "0.0.0.0",
    "api_port": 8000,
    "request_timeout_seconds": 30,
    "max_concurrent_requests": 10
}

def get_config() -> Dict[str, Any]:
    """Get configuration from environment variables with defaults."""
    config = DEFAULT_CONFIG.copy()

    # Override with environment variables if present
    env_mappings = {
        "mongodb_uri": "MONGODB_URI",
        "debug": "DEBUG",
        "log_level": "LOG_LEVEL",
        "max_recommendations": "MAX_RECOMMENDATIONS",
        "default_search_radius_km": "DEFAULT_SEARCH_RADIUS_KM",
        "max_search_radius_km": "MAX_SEARCH_RADIUS_KM",
        "api_host": "API_HOST",
        "api_port": "API_PORT",
        "request_timeout_seconds": "REQUEST_TIMEOUT_SECONDS"
    }

    for config_key, env_var in env_mappings.items():
        env_value = os.getenv(env_var)
        if env_value is not None:
            # Convert string values to appropriate types
            if config_key in ["debug"]:
                config[config_key] = env_value.lower() in ("true", "1", "yes", "on")
            elif config_key in ["max_recommendations", "default_search_radius_km",
                              "max_search_radius_km", "api_port", "request_timeout_seconds"]:
                try:
                    config[config_key] = int(env_value)
                except ValueError:
                    pass  # Keep default if conversion fails
            else:
                config[config_key] = env_value

    return config

def setup_logging(config: Dict[str, Any]) -> None:
    """Setup logging configuration."""
    log_level = getattr(logging, config["log_level"].upper(), logging.INFO)

    # Create logger
    logger = logging.getLogger("pm_internship_ai")
    logger.setLevel(log_level)

    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()

    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)

    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)

    # Add handler to logger
    logger.addHandler(console_handler)

    # Prevent propagation to root logger
    logger.propagate = False

    # Set specific log levels for noisy libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)

def create_request_id() -> str:
    """Generate a unique request ID."""
    return f"req_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(datetime.now()) % 10000:04d}"

def validate_student_profile(student_profile: Dict[str, Any]) -> Dict[str, str]:
    """Validate student profile and return any errors."""
    errors = {}

    # Required fields
    required_fields = ["id", "location"]
    for field in required_fields:
        if field not in student_profile or not student_profile[field]:
            errors[field] = f"{field} is required"

    # Validate location
    if "location" in student_profile:
        location = student_profile["location"]
        if not isinstance(location, dict):
            errors["location"] = "location must be an object"
        else:
            required_location_fields = ["lat", "lon", "city"]
            for field in required_location_fields:
                if field not in location or location[field] is None:
                    errors[f"location.{field}"] = f"location.{field} is required"

            # Validate coordinates
            if "lat" in location and not (-90 <= location["lat"] <= 90):
                errors["location.lat"] = "latitude must be between -90 and 90"
            if "lon" in location and not (-180 <= location["lon"] <= 180):
                errors["location.lon"] = "longitude must be between -180 and 180"

    # Validate optional fields
    if "expected_salary" in student_profile and student_profile["expected_salary"] is not None:
        if not isinstance(student_profile["expected_salary"], (int, float)) or student_profile["expected_salary"] < 0:
            errors["expected_salary"] = "expected_salary must be a non-negative number"

    if "min_duration_months" in student_profile and student_profile["min_duration_months"] is not None:
        if not isinstance(student_profile["min_duration_months"], int) or student_profile["min_duration_months"] < 1:
            errors["min_duration_months"] = "min_duration_months must be a positive integer"

    if "max_distance_km" in student_profile and student_profile["max_distance_km"] is not None:
        if not isinstance(student_profile["max_distance_km"], int) or student_profile["max_distance_km"] < 1:
            errors["max_distance_km"] = "max_distance_km must be a positive integer"

    return errors

def sanitize_student_profile(student_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize student profile by removing sensitive information."""
    sanitized = student_profile.copy()

    # Remove sensitive fields that shouldn't be logged
    sensitive_fields = ["email", "phone", "address", "ssn", "aadhar"]
    for field in sensitive_fields:
        if field in sanitized:
            del sanitized[field]

    return sanitized

def format_processing_time(processing_time_ms: float) -> str:
    """Format processing time in a human-readable way."""
    if processing_time_ms < 1000:
        return f"{processing_time_ms:.0f}ms"
    else:
        return f"{processing_time_ms/1000:.2f}s"

def get_memory_usage() -> Dict[str, Any]:
    """Get current memory usage (basic implementation)."""
    try:
        import psutil
        process = psutil.Process()
        memory_info = process.memory_info()
        return {
            "rss_mb": memory_info.rss / 1024 / 1024,
            "vms_mb": memory_info.vms / 1024 / 1024,
            "percent": process.memory_percent()
        }
    except ImportError:
        return {"error": "psutil not available"}
    except Exception as e:
        return {"error": str(e)}
