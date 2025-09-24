import os
import logging
from typing import List, Dict, Any, Optional

from pymongo import MongoClient, ASCENDING, DESCENDING, GEOSPHERE, TEXT
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, OperationFailure
from pymongo.server_api import ServerApi

logger = logging.getLogger(__name__)


class DatabaseManager:
    def __init__(self, connection_string: Optional[str] = None):
        """Initialize MongoDB connection."""
        self.connection_string = connection_string or os.getenv(
            "MONGODB_URI",
            "mongodb+srv://dhruvdipakchudasama686_db_user:D7i20ZB0uipKiDDs@projectdata.qblzts3.mongodb.net/?retryWrites=true&w=majority&appName=projectdata",
        )
        self.db_name = os.getenv("MONGODB_DB", "project_1")
        self.collection_name = os.getenv("MONGODB_COLLECTION", "internship_data")

        self.client: Optional[MongoClient] = None
        self.db = None
        self.internships_collection: Optional[Collection] = None

    def connect(self) -> bool:
        """Establish connection to MongoDB."""
        try:
            # ServerApi('1') works for Atlas; harmless for community server
            self.client = MongoClient(
                self.connection_string,
                server_api=ServerApi("1"),
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=10000,
                retryWrites=True,
            )
            # test connection
            self.client.admin.command("ping")
            self.db = self.client.get_database(self.db_name)
            self.internships_collection = self.db.get_collection(self.collection_name)
            logger.info("Connected to MongoDB db=%s collection=%s", self.db_name, self.collection_name)
            return True
        except ConnectionFailure as e:
            logger.error("Failed to connect to MongoDB: %s", e)
            return False
        except Exception as e:
            logger.error("Unexpected error connecting to MongoDB: %s", e)
            return False

    def ensure_indexes(self) -> bool:
        """Create necessary indexes for efficient queries."""
        if self.internships_collection is None:
            logger.error("No collection available for index creation")
            return False

        try:
            col = self.internships_collection

            # Geospatial indexes (GeoJSON expects lon,lat and GEOSPHERE)
            try:
                col.create_index([("location_point_exact", GEOSPHERE)], name="idx_geo_exact")
            except OperationFailure as e:
                if "IndexOptionsConflict" in str(e):
                    logger.info("Geospatial index for location_point_exact already exists")
                else:
                    raise
            try:
                col.create_index([("location_point_city", GEOSPHERE)], name="idx_geo_city")
            except OperationFailure as e:
                if "IndexOptionsConflict" in str(e):
                    logger.info("Geospatial index for location_point_city already exists")
                else:
                    raise
            logger.info("Ensured geospatial indexes")

            # Text index for search fields (single combined text index)
            # Note: only one text index per collection in MongoDB
            try:
                col.create_index(
                    [
                        ("title", TEXT),
                        ("description", TEXT),
                        ("skills", TEXT),
                        ("interests", TEXT),
                        ("sector", TEXT),
                        ("job_role", TEXT),
                    ],
                    name="idx_text_all",
                    default_language="english",
                )
                logger.info("Ensured text index")
            except OperationFailure as te:
                logger.warning("Text index ensure warning: %s", te)

            # Compound indexes for common filters/sorts
            col.create_index([("sector", ASCENDING), ("job_role", ASCENDING), ("expected_salary", DESCENDING)],
                             name="idx_sector_role_salary")
            col.create_index([("created_at", DESCENDING)], name="idx_created_at")
            col.create_index([("posted_at", DESCENDING)], name="idx_posted_at")
            col.create_index([("createdAt", DESCENDING)], name="idx_createdAt_legacy")

            logger.info("All indexes ensured")
            return True
        except OperationFailure as e:
            logger.error("Failed to create indexes: %s", e)
            return False
        except Exception as e:
            logger.error("Unexpected error creating indexes: %s", e)
            return False

    def insert_internship(self, internship: Dict[str, Any]) -> bool:
        """Insert a single internship document."""
        if self.internships_collection is None:
            logger.error("No collection available for insertion")
            return False
        try:
            result = self.internships_collection.insert_one(internship)
            logger.info("Inserted internship with ID: %s", result.inserted_id)
            return True
        except Exception as e:
            logger.error("Failed to insert internship: %s", e)
            return False

    def insert_internships_bulk(self, internships: List[Dict[str, Any]]) -> bool:
        """Insert multiple internship documents."""
        if self.internships_collection is None:
            logger.error("No collection available for bulk insertion")
            return False
        if not internships:
            logger.info("No internships provided for bulk insert")
            return True
        try:
            result = self.internships_collection.insert_many(internships, ordered=False)
            logger.info("Inserted %d internships", len(result.inserted_ids))
            return True
        except Exception as e:
            logger.error("Failed to insert internships in bulk: %s", e)
            return False

    def find_internships_by_location(
        self,
        lat: float,
        lon: float,
        max_distance_km: int,
        limit: int = 100,
        geo_field: str = "location_point_exact",
    ) -> List[Dict[str, Any]]:
        """
        Find internships within a certain distance using geospatial queries.
        """
        if self.internships_collection is None:
            logger.error("No collection available for location search")
            return []

        try:
            query = {
                geo_field: {
                    "$near": {
                        "$geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
                        "$maxDistance": int(max(0, max_distance_km)) * 1000,  # meters
                    }
                }
            }

            projection = {"_id": 0}
            cursor = self.internships_collection.find(query, projection).limit(int(limit))
            results = list(cursor)
            logger.info("Found %d internships within %dkm via %s", len(results), max_distance_km, geo_field)
            return results
        except Exception as e:
            logger.error("Failed to find internships by location: %s", e)
            return []

    def find_nearest_internships(
        self,
        user_lat: float,
        user_lon: float,
        preference: Optional[Dict[str, Any]] = None,
        n: int = 5,
        geo_field: str = "location_point_exact",
        max_distance_km: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Find the nearest N internships to the user's coordinates, optionally filtered by preference.
        Supports max_distance_km to limit search radius.
        """
        if self.client is None:
            logger.info("Connecting to database for nearest search")
            if not self.connect():
                logger.error("Failed to connect to database")
                return []
        if self.internships_collection is None:
            logger.error("No collection available for nearest search")
            return []

        try:
            base_filter: Dict[str, Any] = {}

            # Preference filters (case-insensitive; your preprocessing normalizes to lowercase)
            if preference:
                sector = preference.get("sector")
                if sector:
                    base_filter["sector"] = {"$regex": f"^{sector}$", "$options": "i"}

                skills = preference.get("skills") or []
                if skills:
                    # normalized skills are simple lowercase tokens
                    base_filter["skills"] = {"$in": [str(s).lower() for s in skills if s]}

                work_mode = preference.get("work_mode")
                if work_mode:
                    # support both new 'work_mode' field and legacy 'preference.work_mode'
                    base_filter["$or"] = [
                        {"work_mode": {"$regex": f"^{work_mode}$", "$options": "i"}},
                        {"preference.work_mode": {"$regex": f"^{work_mode}$", "$options": "i"}},
                    ]

                # optional role/sector arrays
                preferred_roles = preference.get("preferred_job_roles") or []
                if preferred_roles:
                    base_filter["job_role"] = {"$in": [str(r).lower() for r in preferred_roles if r]}

                preferred_sectors = preference.get("preferred_sectors") or []
                if preferred_sectors:
                    base_filter.setdefault("$or", [])
                    base_filter["$or"].append({"sector": {"$in": [str(s).lower() for s in preferred_sectors if s]}})

                # duration minimum if provided
                md = preference.get("min_duration_months")
                if isinstance(md, (int, float)) and md > 0:
                    # duration stored as {"months": int} and/or flat duration_months
                    base_filter["$or"] = (base_filter.get("$or") or []) + [
                        {"duration.months": {"$gte": int(md)}},
                        {"duration_months": {"$gte": int(md)}},
                    ]

            # Geospatial near query (requires GEOSPHERE index on geo_field)
            near_clause: Dict[str, Any] = {
                "$geometry": {"type": "Point", "coordinates": [float(user_lon), float(user_lat)]}
            }
            if max_distance_km is not None:
                near_clause["$maxDistance"] = int(max(0, max_distance_km)) * 1000

            base_filter[geo_field] = {"$near": near_clause}

            # Projection: include fields the recommender uses for scoring/tie-breakers
            projection = {
                "_id": 0,
                "id": 1,
                "title": 1,
                "description": 1,
                "sector": 1,
                "skills": 1,
                "interests": 1,
                "job_role": 1,
                "qualification": 1,
                "location": 1,
                "location_point_exact": 1,
                "location_point_city": 1,
                "duration": 1,
                "duration_months": 1,
                "expected_salary": 1,
                "stipend": 1,
                "compensation": 1,
                "additional_support": 1,
                "work_mode": 1,
                "preference.work_mode": 1,  # legacy
                "geo": 1,
                "created_at": 1,
                "posted_at": 1,
                "createdAt": 1,
            }

            cursor = self.internships_collection.find(base_filter, projection).limit(int(n))
            results = list(cursor)
            logger.info(
                "Found %d nearest internships using %s (prefs=%s, radius_km=%s)",
                len(results),
                geo_field,
                {k: v for k, v in (preference or {}).items() if v},
                max_distance_km,
            )
            return results

        except Exception as e:
            logger.error("Failed to find nearest internships: %s", e)
            return []

    def find_internships_by_skills(self, skills: List[str], limit: int = 50) -> List[Dict[str, Any]]:
        """Find internships matching specific skills (normalized + regex fallback)."""
        if self.internships_collection is None:
            logger.error("No collection available for skill search")
            return []

        try:
            skills_norm = [str(s).lower() for s in (skills or []) if s]
            if not skills_norm:
                return []

            skill_regex = "|".join([f"\\b{r}\\b" for r in skills_norm])

            query = {
                "$or": [
                    {"skills": {"$in": skills_norm}},
                    {"title": {"$regex": skill_regex, "$options": "i"}},
                    {"description": {"$regex": skill_regex, "$options": "i"}},
                ]
            }

            cursor = self.internships_collection.find(query, {"_id": 0}).limit(int(limit))
            results = list(cursor)
            logger.info("Found %d internships matching skills: %s", len(results), skills_norm)
            return results
        except Exception as e:
            logger.error("Failed to find internships by skills: %s", e)
            return []

    def find_internships_by_sector(self, sectors: List[str], limit: int = 50) -> List[Dict[str, Any]]:
        """Find internships in specific sectors (case-insensitive)."""
        if self.internships_collection is None:
            logger.error("No collection available for sector search")
            return []

        try:
            if not sectors:
                return []
            # Use regex OR for case-insensitive membership
            regexes = [{"sector": {"$regex": f"^{str(s).lower()}$", "$options": "i"}} for s in sectors if s]
            if not regexes:
                return []

            query = {"$or": regexes}
            cursor = self.internships_collection.find(query, {"_id": 0}).limit(int(limit))
            results = list(cursor)
            logger.info("Found %d internships in sectors: %s", len(results), sectors)
            return results
        except Exception as e:
            logger.error("Failed to find internships by sector: %s", e)
            return []

    def get_collection_count(self) -> int:
        """Get total count of internships in collection."""
        if self.internships_collection is None:
            return 0
        try:
            return int(self.internships_collection.count_documents({}))
        except Exception as e:
            logger.error("Failed to get collection count: %s", e)
            return 0

    def close(self):
        """Close the MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection")


# Global database manager instance
db_manager = DatabaseManager()

def get_database() -> DatabaseManager:
    """Get the global database manager instance."""
    return db_manager
