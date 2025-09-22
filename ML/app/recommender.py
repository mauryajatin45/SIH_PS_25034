import os
import time
import math
import logging
from dataclasses import dataclass, field
from functools import lru_cache
from typing import List, Dict, Any, Set, Optional, Tuple, Iterable

from app.preprocessing import (
    preprocess_student_profile,
    preprocess_internship,
    calculate_distance_km,
    normalize_text,
)
from app.database import get_database

logger = logging.getLogger(__name__)

# ---------------------------- Config ---------------------------------- #
_SEED = os.getenv("RECOMMENDER_SEED")
if _SEED is not None:
    import random
    random.seed(int(_SEED))

# Primary geospatial field to use in DB nearest search
DEFAULT_GEO_FIELD = os.getenv("GEO_NEAR_FIELD", "location_point_exact")

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

# ----------------------------- Types ---------------------------------- #
Number = float

@dataclass(frozen=True)
class Weights:
    """Relative weights should roughly sum to 1.0."""
    skills: float = 0.30        # primary predictor of success
    role: float = 0.20          # keeps titles aligned with intent
    sector: float = 0.12        # industry context matters, but less than role
    interests: float = 0.08     # mild nudge for long-term engagement
    qualification: float = 0.06 # avoid over-filtering; treat as soft signal
    salary: float = 0.10        # practical constraint users really feel
    duration: float = 0.08      # internship/contract viability
    support: float = 0.06       # mentorship/certificates/stipend as tie-breakers

@dataclass
class DistanceConfig:
    penalty_per_km: float = 0.0018
    max_penalty: float = 0.25

@dataclass
class RecommenderConfig:
    weights: Weights = field(default_factory=Weights)
    distance: DistanceConfig = field(default_factory=DistanceConfig)
    radius_tiers_km: Tuple[int, ...] = (30, 60, 120, 240)
    prefer_recent_days: int = 90  # tie-breaker if created_at exists

# ------------------------ Core Recommender ---------------------------- #
class Recommender:
    """
    Score & rank internships for a student. Performs:
      - Geospatial shortlist (Mongo $near)
      - Content scoring (skills/role/sector/etc.)
      - Distance penalty (+ remote/work-from-home handling)
      - Deterministic tie-breaking (recent + stipend + distance)
    """

    def __init__(self, config: Optional[RecommenderConfig] = None) -> None:
        self.cfg = config or RecommenderConfig()

        # Optional sanity: warn if weights drift too far
        total_w = sum(vars(self.cfg.weights).values())
        if not (0.95 <= total_w <= 1.05):
            logger.warning("Weights sum to %.3f (expected ~1.0)", total_w)

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
    @lru_cache(maxsize=512)
    def _qual_category_cached(qn: str) -> Optional[str]:
        buckets = {
            "bachelor": ("b.tech", "b.e", "bsc", "b.sc", "bcom", "b.com", "ba", "b.a", "bachelor"),
            "master": ("m.tech", "m.e", "msc", "m.sc", "mcom", "m.com", "ma", "m.a", "master"),
            "diploma": ("diploma", "polytechnic", "iti"),
        }
        for cat, keys in buckets.items():
            if any(k in qn for k in keys):
                return cat
        return None

    def _qual_category(self, q: str) -> Optional[str]:
        qn = normalize_text(q or "")
        if not qn:
            return None
        return self._qual_category_cached(qn)

    def calculate_qualification_match(self, student_qual: str, internship_qual: str) -> float:
        """Loose matching across exact, contains, and same-level categories."""
        s = normalize_text(student_qual or "")
        i = normalize_text(internship_qual or "")
        if not s or not i:
            return 0.0
        if s == i:
            return 1.0
        if s and s in i:
            return 0.8
        sc, ic = self._qual_category(s), self._qual_category(i)
        if sc and ic and sc == ic:
            return 0.6
        return 0.0

    @staticmethod
    def calculate_salary_match(student_salary: Optional[Number], internship_salary: Optional[Number]) -> float:
        """Neutral if either missing; reward at/above expectation; soft degrade down to 0.0."""
        if not student_salary or not internship_salary:
            return 0.5
        if internship_salary >= student_salary:
            return 1.0
        ratio = internship_salary / student_salary
        if ratio >= 0.9:
            return 0.9
        if ratio >= 0.8:
            return 0.8
        return 0.0

    @staticmethod
    def calculate_duration_match(student_min_duration: int, internship_duration: int) -> float:
        """1.0 if internship meets or exceeds student's minimum; otherwise taper (soft)."""
        sm = max(0, int(student_min_duration or 0))
        im = max(0, int(internship_duration or 0))
        if im >= sm:
            return 1.0
        diff = sm - im
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

    def calculate_distance_penalty(self, distance_km: float, max_preferred_km: float, work_mode: Optional[str]) -> float:
        """
        Linear penalty beyond preference with a cap. Remote-compatible roles lower/skip penalty.
        work_mode: 'remote'|'hybrid'|'onsite' (case-insensitive). If remote, no penalty.
        """
        wm = (work_mode or "").strip().lower()
        if wm == "remote":
            return 0.0
        if distance_km <= max_preferred_km:
            return 0.0
        excess = distance_km - max_preferred_km
        base = excess * self.cfg.distance.penalty_per_km
        # hybrid jobs take half distance penalty
        if wm == "hybrid":
            base *= 0.5
        return min(base, self.cfg.distance.max_penalty)

    # --------------------------- Scoring ------------------------------ #
    def score_internship(self, student: Dict[str, Any], internship: Dict[str, Any]) -> Dict[str, Any]:
        """Compute a composite score and attach explanation + distance."""
        w = self.cfg.weights

        student_skills = {normalize_text(s) for s in (student.get("skills") or []) if s}
        internship_skills = {normalize_text(s) for s in (internship.get("skills") or []) if s}
        student_interests = {normalize_text(s) for s in (student.get("interests") or []) if s}
        internship_interests = {normalize_text(s) for s in (internship.get("interests") or []) if s}

        skills_score = self.calculate_jaccard_similarity(student_skills, internship_skills)
        interests_score = self.calculate_jaccard_similarity(student_interests, internship_interests)

        role_score = 1.0 if normalize_text(student.get("job_role", "")) == normalize_text(str(internship.get("job_role", ""))) else 0.0
        sector_score = 1.0 if normalize_text(student.get("sector", "")) == normalize_text(str(internship.get("sector", ""))) else 0.0

        qual_score = self.calculate_qualification_match(student.get("education", ""), internship.get("qualification", ""))

        # Treat any of these stipend fields as salary if present
        i_salary = (
            internship.get("expected_salary")
            or internship.get("stipend")
            or (internship.get("compensation", {}) or {}).get("monthly")
        )
        salary_score = self.calculate_salary_match(student.get("expected_salary"), i_salary)

        i_duration = (internship.get("duration", {}) or {}).get("months") or internship.get("duration_months") or 0
        duration_score = self.calculate_duration_match(int(student.get("min_duration_months", 1) or 1), int(i_duration or 0))

        support_score = self.calculate_support_bonus(internship.get("additional_support", []) or [], student.get("additional_preferences", []) or [])

        # Distance
        s_loc = student.get("location", {}) or {}
        s_lat = float(s_loc.get("lat") or 0.0)
        s_lon = float(s_loc.get("lon") or 0.0)
        i_loc = internship.get("location", {}) or {}
        i_lat = float(i_loc.get("lat") or 0.0)
        i_lon = float(i_loc.get("lon") or 0.0)
        distance_km = calculate_distance_km(s_lat, s_lon, i_lat, i_lon)

        work_mode = normalize_text(internship.get("work_mode", "") or internship.get("mode", ""))
        max_pref_km = float(s_loc.get("max_distance_km", 50) or 50)
        distance_penalty = self.calculate_distance_penalty(distance_km, max_pref_km, work_mode)

        total = (
            w.skills * skills_score
            + w.role * role_score
            + w.sector * sector_score
            + w.interests * interests_score
            + w.qualification * qual_score
            + w.salary * salary_score
            + w.duration * duration_score
            + w.support * support_score
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
            tags.append(f"Duration fits ({int(i_duration or 0)} months)")
        if support_score > 0:
            tags.append("Valuable support offered")

        if work_mode == "remote":
            tags.append("Remote-friendly (no distance penalty)")
        elif work_mode == "hybrid":
            tags.append("Hybrid (reduced distance penalty)")

        if distance_km <= max_pref_km:
            tags.append(f"Within {int(max_pref_km)} km")
        else:
            tags.append(f"{distance_km:.0f} km (beyond preference)")

        # Ensure required fields exist for UI/model consumers
        internship_with_defaults = dict(internship)
        if "description" not in internship_with_defaults:
            internship_with_defaults["description"] = f"{internship.get('title', 'Internship')} opportunity in {internship.get('sector', 'Technology')}"

        if "geo" not in internship_with_defaults:
            lat = i_loc.get("lat", 0.0)
            lon = i_loc.get("lon", 0.0)
            internship_with_defaults["geo"] = {"type": "Point", "coordinates": [lon, lat]}

        return {
            "internship": internship_with_defaults,
            "score": total,
            "distance_km": float(distance_km),
            "explanation_tags": tags,
        }

    # ------------------------- Data Access ---------------------------- #
    def _nearest(self, *, lat: float, lon: float, preference: Dict[str, Any], radius_km: int, n: int = 200) -> List[Dict[str, Any]]:
        db = get_database()
        try:
            return db.find_nearest_internships(
                user_lat=lat,
                user_lon=lon,
                preference=preference,
                n=n,
                geo_field=DEFAULT_GEO_FIELD,
                max_distance_km=radius_km,
            ) or []
        except Exception as e:
            logger.exception("DB nearest failed: %s", e)
            return []

    # ----------------------- Orchestration ---------------------------- #
    def recommend_internships(self, student_profile: Dict[str, Any], top_k: int = 5) -> Dict[str, Any]:
        """
        End-to-end recommend: geo shortlist -> content scoring -> top_k.
        Fallback logic expands radius & relaxes preferences if needed.
        Deterministic tie-break: score desc, created_at desc, stipend desc, distance asc.
        """
        start_time = time.time()

        # 1) resolve coordinates (city mapping as fallback)
        loc = (student_profile.get("location") or {})
        city = (loc.get("city") or "").strip()
        coords = CITY_COORDINATES.get(city) if city else None
        lat = (coords or loc).get("lat")
        lon = (coords or loc).get("lon")
        if lat is None or lon is None:
            logger.warning("Student location missing; cannot recommend internships.")
            return {"recommendations": [], "total_found": 0, "search_radius_used": 0, "processing_time_ms": 0.0}

        # 2) extract preferences
        preference = student_profile.get("preference") or {}
        preferred_sectors = preference.get("preferred_sectors") or []
        sector_primary = preferred_sectors[0] if preferred_sectors else preference.get("sector")
        preferred_job_roles = preference.get("preferred_job_roles") or []
        skills = student_profile.get("skills") or []
        preferred_work_mode = preference.get("work_mode") or None
        min_duration_months = int(preference.get("duration_min_months", 1) or 1)

        pref_payload = {
            "sector": sector_primary,
            "skills": skills,
            "work_mode": preferred_work_mode,
            "min_duration_months": min_duration_months,
            "preferred_job_roles": preferred_job_roles,
            "preferred_sectors": preferred_sectors,
        }

        # 3) shortlist with progressive radius
        radius_used = 0
        all_candidates: List[Dict[str, Any]] = []
        for r in self.cfg.radius_tiers_km:
            all_candidates = self._nearest(lat=float(lat), lon=float(lon), preference=pref_payload, radius_km=r)
            if all_candidates:
                radius_used = r
                break

        # 4) relax if nothing found
        fallback_note = ""
        if not all_candidates:
            fallback_note = "No exact matches found; expanded search with relaxed preferences."
            relaxed = {
                "sector": None,
                "skills": None,
                "work_mode": None,
                "min_duration_months": 0,
                "preferred_job_roles": [],
                "preferred_sectors": [],
            }
            max_r = self.cfg.radius_tiers_km[-1] if self.cfg.radius_tiers_km else 240
            all_candidates = self._nearest(lat=float(lat), lon=float(lon), preference=relaxed, radius_km=max_r, n=300)
            radius_used = max_r

        # 5) build student vector for scoring
        student_for_scoring = {
            "skills": skills,
            "job_role": preferred_job_roles[0] if preferred_job_roles else "",
            "sector": preferred_sectors[0] if preferred_sectors else (sector_primary or ""),
            "interests": student_profile.get("interests", []),
            "education": student_profile.get("qualification", ""),
            "expected_salary": student_profile.get("expected_salary"),
            "min_duration_months": min_duration_months,
            "additional_preferences": preference.get("additional_preferences", []),
            "location": {
                "lat": float(lat),
                "lon": float(lon),
                "max_distance_km": loc.get("max_distance_km", 50),
            },
        }

        # 6) score
        scored: List[Dict[str, Any]] = []
        for internship in all_candidates:
            try:
                scored.append(self.score_internship(student_for_scoring, internship))
            except Exception as e:
                logger.exception("Scoring failed for internship id=%s: %s", internship.get("id"), e)

        # 7) rank with deterministic tie-breakers
        def _created_at_ts(it: Dict[str, Any]) -> float:
            # try a few common schema variants
            meta = it.get("internship", {})
            created = meta.get("created_at") or meta.get("posted_at") or meta.get("createdAt")
            if isinstance(created, (int, float)):
                return float(created)
            # ISO string?
            if isinstance(created, str):
                try:
                    # naive parse: YYYY-MM-DD...
                    parts = created.split("T")[0].split("-")
                    if len(parts) >= 3:
                        y, m, d = [int(x) for x in parts[:3]]
                        return (y * 372) + (m * 31) + d  # monotonic-ish without dateutil
                except Exception:
                    return 0.0
            return 0.0

        def _stipend_val(it: Dict[str, Any]) -> float:
            i = it.get("internship", {})
            return float(
                i.get("expected_salary")
                or i.get("stipend")
                or (i.get("compensation", {}) or {}).get("monthly", 0.0)
                or 0.0
            )

        scored.sort(
            key=lambda x: (
                -x["score"],
                -_created_at_ts(x),
                -_stipend_val(x),
                x["distance_km"],
            )
        )

        top_recommendations = scored[: max(0, int(top_k))]

        if fallback_note:
            for rec in top_recommendations:
                rec.setdefault("explanation_tags", []).append("Fallback: preferences relaxed")
            # surface the note as a meta row if nothing at all found
            if not top_recommendations:
                top_recommendations.append({
                    "internship": None,
                    "score": 0.0,
                    "distance_km": 0.0,
                    "explanation_tags": [fallback_note],
                })

        elapsed_ms = (time.time() - start_time) * 1000.0

        return {
            "student_id": student_profile.get("id", ""),
            "recommendations": top_recommendations,
            "total_found": len(all_candidates),
            "search_radius_used": radius_used,
            "processing_time_ms": elapsed_ms,
        }

# Create a global recommender instance
recommender = Recommender()
