import re
from typing import List, Dict, Any, Iterable
from haversine import haversine

# ----------------------------- Synonyms -------------------------------- #

# Skill/tech aliases (lowercased keys, normalized values)
SKILL_SYNONYMS: Dict[str, str] = {
    # core tech
    "py": "python",
    "python3": "python",
    "python": "python",
    "js": "javascript",
    "javascript": "javascript",
    "ts": "typescript",
    "typescript": "typescript",
    "react.js": "react",
    "reactjs": "react",
    "react": "react",
    "node": "nodejs",
    "node.js": "nodejs",
    "nodejs": "nodejs",
    "express": "express",
    "next.js": "nextjs",
    "nextjs": "nextjs",
    "django": "django",
    "flask": "flask",
    "sql": "sql",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "mysql": "mysql",
    "mongodb": "mongodb",
    "redis": "redis",

    # data / ml
    "ml": "machine learning",
    "machine learning": "machine learning",
    "dl": "deep learning",
    "deep learning": "deep learning",
    "ai": "artificial intelligence",
    "artificial intelligence": "artificial intelligence",
    "data science": "data science",
    "ds": "data science",
    "nlp": "natural language processing",
    "natural language processing": "natural language processing",
    "cv": "computer vision",
    "computer vision": "computer vision",
    "pandas": "pandas",
    "numpy": "numpy",
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "scikit-learn": "scikit-learn",
    "tensorflow": "tensorflow",
    "pytorch": "pytorch",

    # web/devops/cloud
    "web dev": "web development",
    "web development": "web development",
    "app dev": "app development",
    "mobile dev": "mobile development",
    "devops": "devops",
    "docker": "docker",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "cloud": "cloud computing",
    "aws": "amazon web services",
    "amazon web services": "amazon web services",
    "azure": "microsoft azure",
    "microsoft azure": "microsoft azure",
    "gcp": "google cloud platform",
    "google cloud platform": "google cloud platform",
    "ci/cd": "cicd",
    "ci cd": "cicd",
    "cicd": "cicd",

    # fintech/etc
    "fin tech": "fintech",
    "fintech": "fintech",
    "blockchain": "blockchain",

    # misc
    "git": "git",
    "rest": "rest apis",
    "rest api": "rest apis",
    "rest apis": "rest apis",
    "graphql": "graphql",
}

INTEREST_SYNONYMS: Dict[str, str] = {
    "health tech": "healthtech",
    "healthcare": "healthtech",
    "healthtech": "healthtech",
    "fintech": "fintech",
    "finance": "fintech",
    "edtech": "edtech",
    "education": "edtech",
    "agriculture": "agritech",
    "agritech": "agritech",
    "clean tech": "cleantech",
    "cleantech": "cleantech",
    "sustainability": "cleantech",
    "iot": "internet of things",
    "internet of things": "internet of things",
    "cyber security": "cybersecurity",
    "cybersecurity": "cybersecurity",
    "gaming": "gaming",
    "ecommerce": "ecommerce",
}

# --------------------------- Normalization ----------------------------- #

_WS = re.compile(r"\s+")
_PUNCT = re.compile(r"[^\w\+\#\.\-\/ ]+", flags=re.UNICODE)  # keep + # . - / for tech tokens

def normalize_text(text: str) -> str:
    """
    Normalize text: lowercase, trim, collapse spaces, light punctuation strip.
    Keeps symbols useful for tech terms (c++/c#, node.js, next.js, ci/cd).
    """
    if not text:
        return ""
    t = str(text).strip().lower()
    t = t.replace("&", " and ")
    t = _PUNCT.sub(" ", t)
    t = _WS.sub(" ", t).strip()
    return t

def _normalize_list(
    items: Iterable[str],
    synonyms: Dict[str, str],
) -> List[str]:
    """
    Normalize a list of strings with synonym mapping and order-preserving de-duplication.
    """
    seen = set()
    out: List[str] = []
    for raw in items or []:
        if raw is None:
            continue
        key = normalize_text(raw)
        mapped = synonyms.get(key, key)
        if mapped and mapped not in seen:
            seen.add(mapped)
            out.append(mapped)
    return out

def normalize_skills(skills: List[str]) -> List[str]:
    return _normalize_list(skills, SKILL_SYNONYMS)

def normalize_interests(interests: List[str]) -> List[str]:
    return _normalize_list(interests, INTEREST_SYNONYMS)

def normalize_job_roles(roles: List[str]) -> List[str]:
    return [normalize_text(r) for r in (roles or []) if r is not None]

def normalize_sectors(sectors: List[str]) -> List[str]:
    return [normalize_text(s) for s in (sectors or []) if s is not None]

# ------------------------------ Geo ------------------------------------ #

def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance using haversine; safe against None/NaN.
    Returns 0.0 if any coordinate is missing or identical.
    """
    try:
        p1 = (float(lat1), float(lon1))
        p2 = (float(lat2), float(lon2))
        if p1 == p2:
            return 0.0
        return float(haversine(p1, p2))
    except Exception:
        return 0.0

def create_geojson_point(lon: float, lat: float) -> dict:
    return {"type": "Point", "coordinates": [float(lon), float(lat)]}

def create_location_point_city(lon: float, lat: float) -> dict:
    return {"type": "Point", "coordinates": [float(lon), float(lat)]}

def create_location_point_exact(lon: float, lat: float) -> dict:
    return {"type": "Point", "coordinates": [float(lon), float(lat)]}

# ------------------------- Domain Normalizers -------------------------- #

_QUAL_MAP = {
    # bachelor
    "btech": "bachelor of technology",
    "b.tech": "bachelor of technology",
    "be": "bachelor of engineering",
    "b.e": "bachelor of engineering",
    "bsc": "bachelor of science",
    "b.sc": "bachelor of science",
    "bcom": "bachelor of commerce",
    "b.com": "bachelor of commerce",
    "ba": "bachelor of arts",
    "b.a": "bachelor of arts",
    "bachelors": "bachelor",
    "bachelor": "bachelor",

    # master
    "mtech": "master of technology",
    "m.tech": "master of technology",
    "me": "master of engineering",
    "m.e": "master of engineering",
    "msc": "master of science",
    "m.sc": "master of science",
    "mcom": "master of commerce",
    "m.com": "master of commerce",
    "ma": "master of arts",
    "m.a": "master of arts",
    "masters": "master",
    "master": "master",

    # diploma / vocational
    "diploma": "diploma",
    "iti": "industrial training institute",
    "polytechnic": "diploma",
}

def normalize_qualification(qualification: str) -> str:
    q = normalize_text(qualification)
    return _QUAL_MAP.get(q, q)

def normalize_work_mode(mode: str) -> str:
    """
    Map variants to {'onsite','hybrid','remote'}.
    """
    m = normalize_text(mode)
    if m in {"remote", "work from home", "wfh", "fully remote"}:
        return "remote"
    if m in {"hybrid", "flex", "flexible", "partial remote"}:
        return "hybrid"
    if not m:
        return ""
    return "onsite"

def normalize_duration_months(duration: Any) -> int:
    """
    Normalize various duration shapes to integer months.
    Accepts int, float, str digits, or dict like {"months": 3}.
    """
    if isinstance(duration, dict):
        duration = duration.get("months", 0)
    try:
        months = int(float(duration))
        return max(0, months)
    except Exception:
        return 0

# ------------------------------ Preprocess ----------------------------- #

def preprocess_student_profile(student: dict) -> dict:
    """
    Preprocess student profile data (shallow copy).
    Expected keys used downstream:
      - education, skills, interests, preferred_job_roles, preferred_sectors
    """
    processed = dict(student or {})

    processed["education"] = normalize_qualification(processed.get("education", ""))
    processed["skills"] = normalize_skills(processed.get("skills", []))
    processed["interests"] = normalize_interests(processed.get("interests", []))
    processed["preferred_job_roles"] = normalize_job_roles(processed.get("preferred_job_roles", []))
    processed["preferred_sectors"] = normalize_sectors(processed.get("preferred_sectors", []))

    # Optional: normalize preference.work_mode / duration if present
    pref = processed.get("preference") or {}
    if isinstance(pref, dict):
        if "work_mode" in pref:
            pref["work_mode"] = normalize_work_mode(pref.get("work_mode", ""))
        if "duration_min_months" in pref:
            pref["duration_min_months"] = normalize_duration_months(pref.get("duration_min_months"))
        processed["preference"] = pref

    return processed

def preprocess_internship(internship: dict) -> dict:
    """
    Preprocess internship data (shallow copy).
    Ensures normalized strings, skills/interests, work_mode, duration, and GeoJSON fields if coords available.
    """
    processed = dict(internship or {})

    processed["title"] = normalize_text(processed.get("title", ""))
    processed["description"] = normalize_text(processed.get("description", ""))
    processed["qualification"] = normalize_qualification(processed.get("qualification", ""))
    processed["job_role"] = normalize_text(processed.get("job_role", ""))
    processed["sector"] = normalize_text(processed.get("sector", ""))
    processed["skills"] = normalize_skills(processed.get("skills", []))
    processed["interests"] = normalize_interests(processed.get("interests", []))

    # work mode normalization (accept both 'work_mode' and 'mode')
    wm = processed.get("work_mode", processed.get("mode", ""))
    wm_norm = normalize_work_mode(wm)
    if wm_norm:
        processed["work_mode"] = wm_norm

    # duration normalization (accept both 'duration' dict and 'duration_months')
    dur = processed.get("duration", processed.get("duration_months", 0))
    months = normalize_duration_months(dur)
    if "duration" not in processed or not isinstance(processed.get("duration"), dict):
        processed["duration"] = {"months": months}
    else:
        processed["duration"]["months"] = months
    processed["duration_months"] = months  # keep a flat field too for convenience

    # GeoJSON if coords present (lon/lat order per GeoJSON spec)
    loc = processed.get("location") or {}
    if isinstance(loc, dict) and ("lat" in loc) and ("lon" in loc):
        lon = loc.get("lon")
        lat = loc.get("lat")
        processed["location_point_city"] = create_location_point_city(lon, lat)
        processed["location_point_exact"] = create_location_point_exact(lon, lat)
        processed["geo"] = create_geojson_point(lon, lat)

    return processed
