import re
from typing import List, Dict, Any
from haversine import haversine

# Synonym mappings for skills and interests
SKILL_SYNONYMS = {
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "fin tech": "fintech",
    "fintech": "fintech",
    "data science": "data science",
    "ds": "data science",
    "web dev": "web development",
    "web development": "web development",
    "app dev": "app development",
    "mobile dev": "mobile development",
    "python": "python",
    "js": "javascript",
    "react": "react",
    "node": "nodejs",
    "sql": "sql",
    "database": "database",
    "cloud": "cloud computing",
    "aws": "amazon web services",
    "azure": "microsoft azure",
    "gcp": "google cloud platform"
}

INTEREST_SYNONYMS = {
    "healthtech": "healthtech",
    "health tech": "healthtech",
    "healthcare": "healthtech",
    "fintech": "fintech",
    "finance": "fintech",
    "edtech": "edtech",
    "education": "edtech",
    "agritech": "agritech",
    "agriculture": "agritech",
    "cleantech": "cleantech",
    "clean tech": "cleantech",
    "sustainability": "cleantech",
    "iot": "internet of things",
    "cybersecurity": "cybersecurity",
    "cyber security": "cybersecurity"
}

def normalize_text(text: str) -> str:
    """Normalize text by lowercasing, stripping whitespace, and removing extra spaces."""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text.lower().strip())

def normalize_skills(skills: List[str]) -> List[str]:
    """Normalize skills list with synonym mapping and deduplication."""
    normalized = set()
    for skill in skills:
        normalized_text = normalize_text(skill)
        # Apply synonym mapping
        mapped_skill = SKILL_SYNONYMS.get(normalized_text, normalized_text)
        normalized.add(mapped_skill)

    return list(normalized)

def normalize_interests(interests: List[str]) -> List[str]:
    """Normalize interests list with synonym mapping and deduplication."""
    normalized = set()
    for interest in interests:
        normalized_text = normalize_text(interest)
        # Apply synonym mapping
        mapped_interest = INTEREST_SYNONYMS.get(normalized_text, normalized_text)
        normalized.add(mapped_interest)

    return list(normalized)

def normalize_job_roles(roles: List[str]) -> List[str]:
    """Normalize job roles list."""
    return [normalize_text(role) for role in roles]

def normalize_sectors(sectors: List[str]) -> List[str]:
    """Normalize sectors list."""
    return [normalize_text(sector) for sector in sectors]

def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using haversine formula."""
    return haversine((lat1, lon1), (lat2, lon2))

def create_geojson_point(lon: float, lat: float) -> dict:
    """Create GeoJSON Point object."""
    return {
        "type": "Point",
        "coordinates": [lon, lat]
    }

def create_location_point_city(lon: float, lat: float) -> dict:
    """Create GeoJSON Point for city center location."""
    return {
        "type": "Point",
        "coordinates": [lon, lat]
    }

def create_location_point_exact(lon: float, lat: float) -> dict:
    """Create GeoJSON Point for exact internship location."""
    return {
        "type": "Point",
        "coordinates": [lon, lat]
    }

def normalize_qualification(qualification: str) -> str:
    """Normalize qualification text."""
    qual = normalize_text(qualification)

    # Common qualification mappings
    qual_mappings = {
        "b.tech": "bachelor of technology",
        "b.e": "bachelor of engineering",
        "b.sc": "bachelor of science",
        "b.com": "bachelor of commerce",
        "b.a": "bachelor of arts",
        "m.tech": "master of technology",
        "m.e": "master of engineering",
        "m.sc": "master of science",
        "m.com": "master of commerce",
        "m.a": "master of arts",
        "diploma": "diploma",
        "iti": "industrial training institute",
        "polytechnic": "diploma"
    }

    return qual_mappings.get(qual, qual)

def preprocess_student_profile(student: dict) -> dict:
    """Preprocess student profile data."""
    processed = student.copy()

    # Normalize text fields
    processed['education'] = normalize_qualification(processed.get('education', ''))
    processed['skills'] = normalize_skills(processed.get('skills', []))
    processed['interests'] = normalize_interests(processed.get('interests', []))
    processed['preferred_job_roles'] = normalize_job_roles(processed.get('preferred_job_roles', []))
    processed['preferred_sectors'] = normalize_sectors(processed.get('preferred_sectors', []))

    return processed

def preprocess_internship(internship: dict) -> dict:
    """Preprocess internship data."""
    processed = internship.copy()

    # Normalize text fields
    processed['title'] = normalize_text(processed.get('title', ''))
    processed['description'] = normalize_text(processed.get('description', ''))
    processed['qualification'] = normalize_qualification(processed.get('qualification', ''))
    processed['job_role'] = normalize_text(processed.get('job_role', ''))
    processed['sector'] = normalize_text(processed.get('sector', ''))
    processed['skills'] = normalize_skills(processed.get('skills', []))
    processed['interests'] = normalize_interests(processed.get('interests', []))

    # Add GeoJSON fields if coordinates are available (matching the schema)
    if 'location' in processed and 'lat' in processed['location'] and 'lon' in processed['location']:
        # Create GeoJSON point for city center location
        processed['location_point_city'] = create_location_point_city(
            processed['location']['lon'],
            processed['location']['lat']
        )

        # Create GeoJSON point for exact internship location (same as city for now)
        # In a real scenario, this would be jittered coordinates
        processed['location_point_exact'] = create_location_point_exact(
            processed['location']['lon'],
            processed['location']['lat']
        )

        # Keep backward compatibility with 'geo' field
        processed['geo'] = create_geojson_point(
            processed['location']['lon'],
            processed['location']['lat']
        )

    return processed
