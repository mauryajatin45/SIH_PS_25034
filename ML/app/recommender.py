import os
import time
import math
import logging
from functools import lru_cache
from typing import List, Dict, Any, Set, Optional, Tuple

from app.preprocessing import (
    preprocess_student_profile,
    preprocess_internship,
    calculate_distance_km,
    normalize_text
)
from app.database import get_database

logger = logging.getLogger(__name__)

# ---------------------------- Config ---------------------------------- #
# Optional determinism for tests/debugging
_SEED = os.getenv("RECOMMENDER_SEED")
if _SEED is not None:
    import random
    random.seed(int(_SEED))

# City coordinates mapping for the ML algorithm workflow
CITY_COORDINATES: Dict[str, Dict[str, float]] = {
    "Mumbai": {"lat": 19.0760, "lon": 72.8777},
    "Delhi": {"lat": 28.7041, "lon": 77.1025},
    "Bangalore": {"lat": 12.9716, "lon": 77.5946},
    "Pune": {"lat": 18.5204, "lon": 73.8567},
    "Chennai": {"lat": 13.0827, "lon": 80.2707},
    "Hyderabad": {"lat": 17.3850, "lon": 78.4867},
    "Kolkata": {"lat": 22.5726, "lon": 88.3639},
    "Ahmedabad": {"lat": 23.0225, "lon": 72.5714},
    "Jaipur": {"lat": 26.9124, "lon": 75.7873},
    "Lucknow": {"lat": 26.8467, "lon": 80.9462},
    "Surat": {"lat": 21.1702, "lon": 72.8311},
    "Kanpur": {"lat": 26.4499, "lon": 80.3319},
    "Nagpur": {"lat": 21.1458, "lon": 79.0882},
    "Indore": {"lat": 22.7196, "lon": 75.8577},
    "Thane": {"lat": 19.2183, "lon": 72.9781},
    "Bhopal": {"lat": 23.2599, "lon": 77.4126},
    "Visakhapatnam": {"lat": 17.6868, "lon": 83.2185},
    "Patna": {"lat": 25.5941, "lon": 85.1376},
    "Vadodara": {"lat": 22.3072, "lon": 73.1812},
    "Ghaziabad": {"lat": 28.6692, "lon": 77.4538},
    "Ludhiana": {"lat": 30.9010, "lon": 75.8573},
    "Agra": {"lat": 27.1767, "lon": 78.0081},
    "Nashik": {"lat": 19.9975, "lon": 73.7898},
    "Faridabad": {"lat": 28.4089, "lon": 77.3178},
    "Meerut": {"lat": 28.9845, "lon": 77.7064},
    "Rajkot": {"lat": 22.3039, "lon": 70.8022},
    "Kalyan-Dombivli": {"lat": 19.2350, "lon": 73.1300},
    "Vasai-Virar": {"lat": 19.3919, "lon": 72.8397},
    "Varanasi": {"lat": 25.3176, "lon": 82.9739},
    "Srinagar": {"lat": 34.0837, "lon": 74.7973},
    "Aurangabad": {"lat": 19.8762, "lon": 75.3433},
    "Dhanbad": {"lat": 23.7957, "lon": 86.4304},
    "Amritsar": {"lat": 31.6340, "lon": 74.8723},
    "Navi Mumbai": {"lat": 19.0330, "lon": 73.0297},
    "Allahabad": {"lat": 25.4358, "lon": 81.8463},
    "Ranchi": {"lat": 23.3441, "lon": 85.3096},
    "Howrah": {"lat": 22.5958, "lon": 88.2636},
    "Coimbatore": {"lat": 11.0168, "lon": 76.9558},
    "Jabalpur": {"lat": 23.1815, "lon": 79.9864},
    "Gwalior": {"lat": 26.2183, "lon": 78.1828},
    "Vijayawada": {"lat": 16.5062, "lon": 80.6480},
    "Jodhpur": {"lat": 26.2389, "lon": 73.0243},
    "Madurai": {"lat": 9.9252, "lon": 78.1198},
    "Raipur": {"lat": 21.2514, "lon": 81.6296},
    "Kota": {"lat": 25.2138, "lon": 75.8648},
    "Guwahati": {"lat": 26.1445, "lon": 91.7362},
    "Chandigarh": {"lat": 30.7333, "lon": 76.7794},
    "Solapur": {"lat": 17.6599, "lon": 75.9064},
    "Hubli-Dharwad": {"lat": 15.3647, "lon": 75.1240},
    "Bareilly": {"lat": 28.3670, "lon": 79.4304},
    "Moradabad": {"lat": 28.8386, "lon": 78.7733},
    "Mysore": {"lat": 12.2958, "lon": 76.6394},
    "Gurgaon": {"lat": 28.4595, "lon": 77.0266},
    "Aligarh": {"lat": 27.8974, "lon": 78.0880},
    "Jalandhar": {"lat": 31.3260, "lon": 75.5762},
    "Tiruchirappalli": {"lat": 10.7905, "lon": 78.7047},
    "Bhubaneswar": {"lat": 20.2961, "lon": 85.8245},
    "Salem": {"lat": 11.6643, "lon": 78.1460},
    "Mira-Bhayandar": {"lat": 19.2952, "lon": 72.8544},
    "Warangal": {"lat": 17.9784, "lon": 79.5941},
    "Thiruvananthapuram": {"lat": 8.5241, "lon": 76.9366},
    "Guntur": {"lat": 16.3067, "lon": 80.4365},
    "Bhiwandi": {"lat": 19.2967, "lon": 73.0631},
    "Saharanpur": {"lat": 29.9679, "lon": 77.5510},
    "Gorakhpur": {"lat": 26.7606, "lon": 83.3732},
    "Bikaner": {"lat": 28.0229, "lon": 73.3119},
    "Amravati": {"lat": 20.9374, "lon": 77.7796},
    "Noida": {"lat": 28.5355, "lon": 77.3910},
    "Jamshedpur": {"lat": 22.8046, "lon": 86.2029},
    "Bhilai": {"lat": 21.1938, "lon": 81.3509},
    "Cuttack": {"lat": 20.4625, "lon": 85.8828},
    "Firozabad": {"lat": 27.1591, "lon": 78.3957},
    "Kochi": {"lat": 9.9312, "lon": 76.2673},
    "Nellore": {"lat": 14.4426, "lon": 79.9865},
    "Bhavnagar": {"lat": 21.7645, "lon": 72.1519},
    "Dehradun": {"lat": 30.3165, "lon": 78.0322},
    "Durgapur": {"lat": 23.5204, "lon": 87.3119},
    "Asansol": {"lat": 23.6833, "lon": 86.9833},
    "Nanded": {"lat": 19.1383, "lon": 77.3210},
    "Kolhapur": {"lat": 16.6913, "lon": 74.2447},
    "Ajmer": {"lat": 26.4499, "lon": 74.6399},
    "Gulbarga": {"lat": 17.3297, "lon": 76.8343},
    "Jamnagar": {"lat": 22.4722, "lon": 70.0577},
    "Ujjain": {"lat": 23.1765, "lon": 75.7885},
    "Loni": {"lat": 28.7500, "lon": 77.2833},
    "Siliguri": {"lat": 26.7271, "lon": 88.3953},
    "Jhansi": {"lat": 25.4484, "lon": 78.5685},
    "Ulhasnagar": {"lat": 19.2215, "lon": 73.1645},
    "Sangli": {"lat": 16.8524, "lon": 74.5815},
    "Jammu": {"lat": 32.7266, "lon": 74.8570},
    "Mangalore": {"lat": 12.9141, "lon": 74.8560},
    "Erode": {"lat": 11.3410, "lon": 77.7172},
    "Belgaum": {"lat": 15.8497, "lon": 74.4977},
    "Ambattur": {"lat": 13.1143, "lon": 80.1481},
    "Tirunelveli": {"lat": 8.7139, "lon": 77.7567},
    "Malegaon": {"lat": 20.5544, "lon": 74.5286},
    "Gaya": {"lat": 24.7955, "lon": 85.0077},
    "Jalgaon": {"lat": 21.0077, "lon": 75.5626},
    "Udaipur": {"lat": 24.5854, "lon": 73.7125},
    "Maheshtala": {"lat": 22.5086, "lon": 88.3253},
}

# Primary geospatial field to use in DB nearest search
DEFAULT_GEO_FIELD = os.getenv("GEO_NEAR_FIELD", "location_point_exact")

# ------------------------ Core Recommender ---------------------------- #
class Recommender:
    """
    Score & rank internships for a student. Performs:
      - Geospatial shortlist (Mongo $near)
      - Content scoring (skills/role/sector/etc.)
      - Distance penalty + tie-break
    """

    def __init__(self) -> None:
        # Relative weights must sum to ~1 for readability (not strictly required)
        self.weights: Dict[str, float] = {
            "skills": 0.28,
            "role": 0.14,
            "sector": 0.14,
            "interests": 0.10,
            "qualification": 0.07,
            "salary": 0.08,
            "duration": 0.08,
            "support": 0.07,
            # distance handled as a penalty
        }

        # Distance penalty config
        self.distance_penalty_per_km: float = 0.0018  # gentler slope
        self.max_distance_penalty: float = 0.25

        # Fallback radius tiers (km) for city->coords workflow (used for iterative broadening)
        self.radius_tiers: List[int] = [30, 60, 120, 240]

    # ---------------------- Similarity Components --------------------- #
    @staticmethod
    def calculate_jaccard_similarity(set1: Set[str], set2: Set[str]) -> float:
        """Jaccard similarity with empty-set safety."""
        if not set1 and not set2:
            return 0.0
        inter = len(set1 & set2)
        union = len(set1 | set2)
        return (inter / union) if union else 0.0

    @staticmethod
    def _qual_category(q: str) -> Optional[str]:
        qn = normalize_text(q)
        if not qn:
            return None
        buckets = {
            "bachelor": ["b.tech", "b.e", "bsc", "b.sc", "bcom", "b.com", "ba", "b.a", "bachelor"],
            "master": ["m.tech", "m.e", "msc", "m.sc", "mcom", "m.com", "ma", "m.a", "master"],
            "diploma": ["diploma", "polytechnic", "iti"],
        }
        for cat, keys in buckets.items():
            if any(k in qn for k in keys):
                return cat
        return None

    def calculate_qualification_match(self, student_qual: str, internship_qual: str) -> float:
        """Loose matching across exact, contains, and same-level categories."""
        if not student_qual or not internship_qual:
            return 0.0
        s = normalize_text(student_qual)
        i = normalize_text(internship_qual)
        if s == i:
            return 1.0
        if s and s in i:
            return 0.8
        sc, ic = self._qual_category(s), self._qual_category(i)
        if sc and ic and sc == ic:
            return 0.6
        return 0.0

    @staticmethod
    def calculate_salary_match(student_salary: Optional[float], internship_salary: Optional[float]) -> float:
        """Neutral if either missing; reward at/above expectation; soft degrade down to 0.0."""
        if not student_salary or not internship_salary:
            return 0.5
        if internship_salary >= student_salary:
            return 1.0
        if internship_salary >= student_salary * 0.9:
            return 0.9
        if internship_salary >= student_salary * 0.8:
            return 0.8
        return 0.0

    @staticmethod
    def calculate_duration_match(student_min_duration: int, internship_duration: int) -> float:
        """1.0 if internship meets or exceeds student's minimum; otherwise taper (soft)."""
        if internship_duration >= student_min_duration:
            return 1.0
        # soft decay down to zero if 1 month below
        diff = student_min_duration - internship_duration
        return max(0.0, 1.0 - 0.5 * diff)

    @staticmethod
    def calculate_support_bonus(additional_support: List[str], student_preferences: List[str]) -> float:
        """High-value supports + minor credit for matching user prefs."""
        if not additional_support:
            return 0.0
        high_value = {"mentor", "stipend", "certificate", "training"}
        prefs = {normalize_text(p) for p in (student_preferences or [])}
        score = 0.0
        for s in additional_support:
            sn = normalize_text(s)
            if sn in high_value:
                score += 1.0
            elif sn in prefs:
                score += 0.5
        return min(score, 2.0)

    def calculate_distance_penalty(self, distance_km: float, max_preferred_km: float) -> float:
        """Linear penalty beyond preference with a cap."""
        if distance_km <= max_preferred_km:
            return 0.0
        excess = distance_km - max_preferred_km
        return min(excess * self.distance_penalty_per_km, self.max_distance_penalty)

    # --------------------------- Scoring ------------------------------ #
    def score_internship(self, student: Dict[str, Any], internship: Dict[str, Any]) -> Dict[str, Any]:
        """Compute a composite score and attach explanation + distance."""
        student_skills = {normalize_text(s) for s in student.get("skills", [])}
        internship_skills = {normalize_text(s) for s in internship.get("skills", [])}
        student_interests = {normalize_text(s) for s in student.get("interests", [])}
        internship_interests = {normalize_text(s) for s in internship.get("interests", [])}

        skills_score = self.calculate_jaccard_similarity(student_skills, internship_skills)
        interests_score = self.calculate_jaccard_similarity(student_interests, internship_interests)

        role_score = 1.0 if normalize_text(student.get("job_role", "")) == normalize_text(str(internship.get("job_role", ""))) else 0.0
        sector_score = 1.0 if normalize_text(student.get("sector", "")) == normalize_text(str(internship.get("sector", ""))) else 0.0

        qual_score = self.calculate_qualification_match(student.get("education", ""), internship.get("qualification", ""))

        salary_score = self.calculate_salary_match(student.get("expected_salary"), internship.get("expected_salary"))
        duration_score = self.calculate_duration_match(
            int(student.get("min_duration_months", 1) or 1),
            int(internship.get("duration", {}).get("months", 1) or 1),
        )
        support_score = self.calculate_support_bonus(internship.get("additional_support", []), student.get("additional_preferences", []))

        # Distance
        s_lat = float(student.get("location", {}).get("lat", 0.0) or 0.0)
        s_lon = float(student.get("location", {}).get("lon", 0.0) or 0.0)
        i_lat = float(internship.get("location", {}).get("lat", 0.0) or 0.0)
        i_lon = float(internship.get("location", {}).get("lon", 0.0) or 0.0)
        distance_km = calculate_distance_km(s_lat, s_lon, i_lat, i_lon)
        distance_penalty = self.calculate_distance_penalty(distance_km, float(student.get("max_distance_km", 50)))

        total = (
            self.weights["skills"] * skills_score
            + self.weights["role"] * role_score
            + self.weights["sector"] * sector_score
            + self.weights["interests"] * interests_score
            + self.weights["qualification"] * qual_score
            + self.weights["salary"] * salary_score
            + self.weights["duration"] * duration_score
            + self.weights["support"] * support_score
            - distance_penalty
        )
        total = max(0.0, min(1.0, total))  # clamp to [0,1]

        # Explanations
        tags: List[str] = []
        if skills_score >= 0.3 and student_skills & internship_skills:
            ms = list(student_skills & internship_skills)[:3]
            tags.append(f"Matched skills: {', '.join(ms)}")
        if sector_score >= 0.5:
            tags.append(f"Sector match: {internship.get('sector', 'N/A')}")
        if role_score >= 0.5:
            tags.append(f"Role match: {internship.get('job_role', 'N/A')}")
        if salary_score >= 0.8:
            tags.append("Salary meets expectation")
        if duration_score >= 1.0:
            tags.append(f"Duration fits ({internship.get('duration', {}).get('months', 0)} months)")
        if support_score > 0:
            tags.append("Valuable support offered")

        pref_km = float(student.get("max_distance_km", 50))
        if distance_km <= pref_km:
            tags.append(f"Within {int(pref_km)} km")
        else:
            tags.append(f"{distance_km:.0f} km (beyond preference)")

        # Add missing fields with default values to match the Internship model
        internship_with_defaults = internship.copy()
        if "description" not in internship_with_defaults:
            internship_with_defaults["description"] = f"{internship.get('title', 'Internship')} opportunity in {internship.get('sector', 'Technology')} sector"
        if "geo" not in internship_with_defaults:
            # Create a basic GeoJSON point from the location coordinates
            lat = internship.get("location", {}).get("lat", 0.0)
            lon = internship.get("location", {}).get("lon", 0.0)
            internship_with_defaults["geo"] = {
                "type": "Point",
                "coordinates": [lon, lat]  # GeoJSON format: [longitude, latitude]
            }

        return {
            "internship": internship_with_defaults,
            "score": total,
            "distance_km": distance_km,
            "explanation_tags": tags,
        }

    # ------------------------- Data Access ---------------------------- #
    def shortlist_by_location(self, student: Dict[str, Any], radius_km: int) -> List[Dict[str, Any]]:
        """
        Prefer DB-level geospatial shortlist using an indexed GeoJSON field.
        Falls back to empty list if coordinates missing or DB returns nothing.
        """
        db = get_database()
        s_loc = student.get("location", {}) or {}
        lat = s_loc.get("lat")
        lon = s_loc.get("lon")

        if lat is None or lon is None:
            logger.warning("Student location missing; cannot shortlist by location.")
            return []

        try:
            internships = db.find_internships_by_location(
                lat=float(lat),
                lon=float(lon),
                max_distance_km=int(radius_km),
                limit=200,
                geo_field=DEFAULT_GEO_FIELD,  # prefer exact points
            )
            logger.info("Shortlisted %d internships within %dkm via geo index '%s'",
                        len(internships), radius_km, DEFAULT_GEO_FIELD)
            return internships
        except Exception as e:
            logger.exception("Location shortlist failed: %s", e)
            return []

    # ----------------------- Orchestration ---------------------------- #
    def recommend_internships(self, student_profile: Dict[str, Any], top_k: int = 5) -> Dict[str, Any]:
        """
        End-to-end recommend: geo shortlist -> content scoring -> top_k.
        Returns metadata including timing, total_found, radius used.
        Implements fallback logic for no matches by expanding radius and relaxing preferences.
        """
        start_time = time.time()

        # 1. Get city coordinates from student profile or fallback to city mapping
        city = student_profile.get("location", {}).get("city", "")
        coords = CITY_COORDINATES.get(city)
        if coords:
            lat, lon = coords["lat"], coords["lon"]
        else:
            lat = student_profile.get("location", {}).get("lat")
            lon = student_profile.get("location", {}).get("lon")

        if lat is None or lon is None:
            logger.warning("Student location missing; cannot recommend internships.")
            return {"recommendations": [], "total_found": 0, "radius_used_km": 0, "time_taken_s": 0.0}

        # Extract preferences from nested structure
        preference = student_profile.get("preference", {})
        sector = None
        skills = None
        preferred_work_mode = None
        min_duration_months = 1
        preferred_job_roles = []
        preferred_sectors = []

        if preference:
            sector = preference.get("preferred_sectors")
            if sector and isinstance(sector, list):
                sector = sector[0] if sector else None
            skills = student_profile.get("skills")
            preferred_work_mode = preference.get("work_mode") or preference.get("work_mode") or None
            min_duration_months = preference.get("duration_min_months", 1)
            preferred_job_roles = preference.get("preferred_job_roles", [])
            preferred_sectors = preference.get("preferred_sectors", [])

        # 2. Use DB to find nearest internships with preferences
        db = get_database()
        internships = []
        radius_used = 0
        fallback_note = ""
        max_radius = self.radius_tiers[-1] if self.radius_tiers else 240

        # Try expanding radius tiers until internships found or max radius reached
        for radius in self.radius_tiers:
            internships = db.find_nearest_internships(
                user_lat=lat,
                user_lon=lon,
                preference={
                    "sector": sector,
                    "skills": skills,
                    "work_mode": preferred_work_mode,
                    "min_duration_months": min_duration_months,
                    "preferred_job_roles": preferred_job_roles,
                    "preferred_sectors": preferred_sectors,
                },
                n=200,
                geo_field=DEFAULT_GEO_FIELD,
                max_distance_km=radius,
            )
            if internships:
                radius_used = radius
                break

        # If no internships found, relax preferences and try again with max radius
        if not internships:
            fallback_note = (
                "No internships found within preferred radius and preferences. "
                "Relaxing preferences for broader recommendations."
            )
            relaxed_preferences = {
                "sector": None,
                "skills": None,
                "work_mode": None,
                "min_duration_months": 0,
                "preferred_job_roles": [],
                "preferred_sectors": [],
            }
            internships = db.find_nearest_internships(
                user_lat=lat,
                user_lon=lon,
                preference=relaxed_preferences,
                n=200,
                geo_field=DEFAULT_GEO_FIELD,
                max_distance_km=max_radius,
            )
            radius_used = max_radius

        # 3. Prepare student data for scoring
        student_for_scoring = {
            "skills": skills or [],
            "job_role": preferred_job_roles[0] if preferred_job_roles else "",
            "sector": preferred_sectors[0] if preferred_sectors else sector or "",
            "interests": student_profile.get("interests", []),
            "education": student_profile.get("qualification", ""),
            "expected_salary": student_profile.get("expected_salary"),
            "min_duration_months": min_duration_months,
            "additional_preferences": [],  # Could be extended
            "location": {
                "lat": lat,
                "lon": lon,
                "max_distance_km": student_profile.get("location", {}).get("max_distance_km", 50),
            },
        }

        # 4. Score and rank internships
        scored = []
        for internship in internships:
            score_data = self.score_internship(student_for_scoring, internship)
            scored.append(score_data)

        scored.sort(key=lambda x: x["score"], reverse=True)
        top_recommendations = scored[:top_k]

        time_taken = time.time() - start_time

        # Add fallback note to recommendations if applicable
        if fallback_note:
            for rec in top_recommendations:
                rec.setdefault("explanation_tags", []).append("Fallback: preferences relaxed")
            top_recommendations.append({
                "internship": None,
                "score": 0.0,
                "distance_km": 0.0,
                "explanation_tags": [fallback_note],
            })

        return {
            "student_id": student_profile.get("id", ""),
            "recommendations": top_recommendations,
            "total_found": len(internships),
            "search_radius_used": radius_used,
            "processing_time_ms": time_taken * 1000,  # Convert seconds to milliseconds
        }

# Create a global recommender instance
recommender = Recommender()
