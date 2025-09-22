import os
import json
import uuid
import time
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

# ----------------------------- Defaults -------------------------------- #

DEFAULT_CONFIG: Dict[str, Any] = {
    "mongodb_uri": "mongodb://localhost:27017/pm_internship_ai",
    "debug": False,
    "log_level": "INFO",                     # DEBUG|INFO|WARNING|ERROR|CRITICAL
    "log_format": "plain",                   # plain|json
    "max_recommendations": 5,
    "default_search_radius_km": 50,
    "max_search_radius_km": 500,
    "min_internships_for_recommendation": 10,
    "api_host": "0.0.0.0",
    "api_port": 8000,
    "request_timeout_seconds": 30,
    "max_concurrent_requests": 10,
    "request_id_prefix": "req",
}

# ----------------------------- Helpers --------------------------------- #

def _env_bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return str(val).strip().lower() in {"1", "true", "yes", "y", "on"}

def _env_int(name: str, default: int) -> int:
    val = os.getenv(name)
    if val is None:
        return default
    try:
        return int(str(val).strip())
    except ValueError:
        return default

def _env_str(name: str, default: str) -> str:
    val = os.getenv(name)
    return default if val is None else str(val)

def _coerce_log_level(level: str) -> str:
    level = (level or "").upper()
    return level if level in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"} else "INFO"

# ------------------------------ Config --------------------------------- #

def get_config() -> Dict[str, Any]:
    """
    Get configuration from environment variables with sensible defaults.
    Non-crashing coercion: falls back to defaults on bad env values.
    """
    cfg = dict(DEFAULT_CONFIG)

    # Map env -> config keys
    cfg["mongodb_uri"] = _env_str("MONGODB_URI", cfg["mongodb_uri"])
    cfg["debug"] = _env_bool("DEBUG", cfg["debug"])
    cfg["log_level"] = _coerce_log_level(_env_str("LOG_LEVEL", cfg["log_level"]))
    cfg["log_format"] = _env_str("LOG_FORMAT", cfg["log_format"]).lower()  # plain|json

    cfg["max_recommendations"] = _env_int("MAX_RECOMMENDATIONS", cfg["max_recommendations"])
    cfg["default_search_radius_km"] = _env_int("DEFAULT_SEARCH_RADIUS_KM", cfg["default_search_radius_km"])
    cfg["max_search_radius_km"] = _env_int("MAX_SEARCH_RADIUS_KM", cfg["max_search_radius_km"])
    cfg["min_internships_for_recommendation"] = _env_int(
        "MIN_INTERNSHIPS_FOR_RECOMMENDATION", cfg["min_internships_for_recommendation"]
    )

    cfg["api_host"] = _env_str("API_HOST", cfg["api_host"])
    cfg["api_port"] = _env_int("API_PORT", cfg["api_port"])
    cfg["request_timeout_seconds"] = _env_int("REQUEST_TIMEOUT_SECONDS", cfg["request_timeout_seconds"])
    cfg["max_concurrent_requests"] = _env_int("MAX_CONCURRENT_REQUESTS", cfg["max_concurrent_requests"])
    cfg["request_id_prefix"] = _env_str("REQUEST_ID_PREFIX", cfg["request_id_prefix"])

    # If DEBUG, force INFO logs unless explicitly overridden to DEBUG
    if cfg["debug"] and cfg["log_level"] == "INFO":
        cfg["log_level"] = "DEBUG"

    return cfg

# ------------------------------ Logging -------------------------------- #

class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.utcfromtimestamp(record.created).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "module": record.module,
            "func": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        # add request_id if attached via LoggerAdapter / extra
        rid = getattr(record, "request_id", None)
        if rid:
            payload["request_id"] = rid
        return json.dumps(payload, ensure_ascii=False)

def setup_logging(config: Dict[str, Any]) -> None:
    """Setup logging configuration with optional JSON output."""
    log_level = getattr(logging, config.get("log_level", "INFO").upper(), logging.INFO)
    log_format = (config.get("log_format") or "plain").lower()

    logger = logging.getLogger("pm_internship_ai")
    logger.setLevel(log_level)
    logger.handlers.clear()

    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)

    if log_format == "json":
        formatter: logging.Formatter = _JsonFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    logger.propagate = False

    # quiet noisy libs
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)

# --------------------------- Request IDs ------------------------------- #

def create_request_id(prefix: Optional[str] = None) -> str:
    """
    Generate a unique, sortable-ish request ID.
    Example: req_20240921_153045_3f1c2a7b
    """
    pref = (prefix or _env_str("REQUEST_ID_PREFIX", DEFAULT_CONFIG["request_id_prefix"])).strip()
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    # short uuid (first 8 chars) is enough for logs; still highly unique
    uid = uuid.uuid4().hex[:8]
    return f"{pref}_{ts}_{uid}"

# ---------------------------- Validation ------------------------------- #

def _in_range(val: float, lo: float, hi: float) -> bool:
    return lo <= val <= hi

def validate_student_profile(student_profile: Dict[str, Any]) -> Dict[str, str]:
    """
    Validate student profile and return any errors (field -> message).
    Notes:
      - Requires: id, location.lat, location.lon
      - location.city is recommended (used for fallbacks) but not strictly required if lat/lon present.
    """
    errors: Dict[str, str] = {}

    if not isinstance(student_profile, dict):
        return {"_schema": "student_profile must be an object"}

    # Required high-level fields
    if not student_profile.get("id"):
        errors["id"] = "id is required"

    # Validate location
    loc = student_profile.get("location")
    if not isinstance(loc, dict):
        errors["location"] = "location must be an object with lat/lon (and optional city)"
        return errors

    lat = loc.get("lat")
    lon = loc.get("lon")
    city = loc.get("city")

    if lat is None:
        errors["location.lat"] = "location.lat is required"
    if lon is None:
        errors["location.lon"] = "location.lon is required"

    if isinstance(lat, (int, float)) and not _in_range(float(lat), -90, 90):
        errors["location.lat"] = "latitude must be between -90 and 90"
    if isinstance(lon, (int, float)) and not _in_range(float(lon), -180, 180):
        errors["location.lon"] = "longitude must be between -180 and 180"

    # city optional but recommended for some fallbacks
    if city is None:
        # soft warning style message; keep as error map entry if you want hard enforcement
        # comment below to make it purely informational
        errors.setdefault("location.city", "location.city is recommended for better results")

    # Optional numeric fields
    if "expected_salary" in student_profile and student_profile["expected_salary"] is not None:
        es = student_profile["expected_salary"]
        if not isinstance(es, (int, float)) or es < 0:
            errors["expected_salary"] = "expected_salary must be a non-negative number"

    if "min_duration_months" in student_profile and student_profile["min_duration_months"] is not None:
        md = student_profile["min_duration_months"]
        if not isinstance(md, int) or md < 1:
            errors["min_duration_months"] = "min_duration_months must be a positive integer"

    if "max_distance_km" in student_profile and student_profile["max_distance_km"] is not None:
        mdist = student_profile["max_distance_km"]
        if not isinstance(mdist, (int, float)) or mdist <= 0:
            errors["max_distance_km"] = "max_distance_km must be a positive number"

    return errors

# ----------------------------- Sanitizing ------------------------------ #

_SENSITIVE_TOP_LEVEL = {"email", "phone", "address", "ssn", "aadhar", "aadhaar", "pan", "pan_number"}

def sanitize_student_profile(student_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize student profile by removing sensitive information (non-destructive shallow copy).
    Only strips known sensitive top-level keys.
    """
    sanitized = dict(student_profile or {})
    for key in list(sanitized.keys()):
        if key.lower() in _SENSITIVE_TOP_LEVEL:
            sanitized.pop(key, None)
    return sanitized

# --------------------------- Time Formatting --------------------------- #

def format_processing_time(processing_time_ms: float) -> str:
    """
    Format processing time in a human-readable way.
    <1000ms -> e.g., '237ms'
    1s..59s -> e.g., '1.42s'
    >=60s   -> e.g., '2m 03s'
    """
    try:
        ms = float(processing_time_ms)
    except (TypeError, ValueError):
        return "n/a"

    if ms < 1000:
        return f"{ms:.0f}ms"
    secs = ms / 1000.0
    if secs < 60:
        return f"{secs:.2f}s"
    minutes = int(secs // 60)
    rem = int(round(secs % 60))
    return f"{minutes}m {rem:02d}s"

# --------------------------- Memory Usage ------------------------------ #

def get_memory_usage() -> Dict[str, Any]:
    """
    Get current memory usage (best-effort).
    Returns rss_mb, vms_mb, percent when psutil is available; otherwise a minimal fallback.
    """
    try:
        import psutil  # type: ignore
        process = psutil.Process()
        memory_info = process.memory_info()
        return {
            "rss_mb": memory_info.rss / (1024 * 1024),
            "vms_mb": memory_info.vms / (1024 * 1024),
            "percent": process.memory_percent(),
        }
    except ImportError:
        # Fallback: try reading from /proc if available
        result: Dict[str, Any] = {"error": "psutil not available"}
        try:
            if os.path.exists("/proc/self/status"):
                with open("/proc/self/status", "r") as f:
                    data = f.read()
                def _parse_kb(tag: str) -> Optional[float]:
                    for line in data.splitlines():
                        if line.startswith(tag):
                            parts = line.split()
                            if len(parts) >= 2 and parts[1].isdigit():
                                return float(parts[1]) / 1024.0  # to MB
                    return None
                rss = _parse_kb("VmRSS:")
                vms = _parse_kb("VmSize:")
                if rss is not None:
                    result["rss_mb"] = rss
                if vms is not None:
                    result["vms_mb"] = vms
        except Exception as e:
            result["detail"] = str(e)
        return result
    except Exception as e:
        return {"error": str(e)}
