import os
import logging
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, OperationFailure
from pymongo.server_api import ServerApi

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, connection_string: Optional[str] = None):
        """Initialize MongoDB connection."""
        self.connection_string = connection_string or os.getenv(
            "MONGODB_URI",
            "mongodb+srv://dhruvdipakchudasama686_db_user:D7i20ZB0uipKiDDs@projectdata.qblzts3.mongodb.net/?retryWrites=true&w=majority&appName=projectdata"
        )
        self.client: Optional[MongoClient] = None
        self.db = None
        self.internships_collection: Optional[Collection] = None

    def connect(self) -> bool:
        """Establish connection to MongoDB."""
        try:
            self.client = MongoClient(self.connection_string, server_api=ServerApi('1'), serverSelectionTimeoutMS=5000)
            # Test the connection
            self.client.admin.command('ping')
            self.db = self.client.get_database("project_1")
            self.internships_collection = self.db.get_collection("internship_data")
            logger.info("Successfully connected to MongoDB Atlas")
            return True
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            return False

    def ensure_indexes(self) -> bool:
        """Create necessary indexes for efficient queries."""
        if self.internships_collection is None:
            logger.error("No collection available for index creation")
            return False

        try:
            # Create 2dsphere index for geospatial queries on exact location
            self.internships_collection.create_index([("location_point_exact", "2dsphere")])
            logger.info("Created 2dsphere index on location_point_exact field")

            # Create 2dsphere index for city location queries
            self.internships_collection.create_index([("location_point_city", "2dsphere")])
            logger.info("Created 2dsphere index on location_point_city field")

            # Create text indexes for better search performance (matching the schema)
            self.internships_collection.create_index([
                ("title", "text"),
                ("description", "text"),
                ("skills", "text"),
                ("interests", "text"),
                ("sector", "text"),
                ("job_role", "text")
            ])
            logger.info("Created text indexes for search fields")

            # Create compound index for common queries
            self.internships_collection.create_index([
                ("sector", 1),
                ("job_role", 1),
                ("expected_salary", -1)
            ])
            logger.info("Created compound index for sector, job_role, and salary")

            # Create compound sparse index for text search (matching the user's index)
            self.internships_collection.create_index([
                ("skills", "text"),
                ("interests", "text"),
                ("sector", "text")
            ], sparse=True)
            logger.info("Created compound sparse text index for skills, interests, and sector")

            return True
        except OperationFailure as e:
            logger.error(f"Failed to create indexes: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error creating indexes: {e}")
            return False

    def insert_internship(self, internship: Dict[str, Any]) -> bool:
        """Insert a single internship document."""
        if self.internships_collection is None:
            logger.error("No collection available for insertion")
            return False

        try:
            result = self.internships_collection.insert_one(internship)
            logger.info(f"Inserted internship with ID: {result.inserted_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to insert internship: {e}")
            return False

    def insert_internships_bulk(self, internships: List[Dict[str, Any]]) -> bool:
        """Insert multiple internship documents."""
        if self.internships_collection is None:
            logger.error("No collection available for bulk insertion")
            return False

        try:
            result = self.internships_collection.insert_many(internships)
            logger.info(f"Inserted {len(result.inserted_ids)} internships")
            return True
        except Exception as e:
            logger.error(f"Failed to insert internships in bulk: {e}")
            return False

    def find_internships_by_location(
        self,
        lat: float,
        lon: float,
        max_distance_km: int,
        limit: int = 100,
        geo_field: str = "location_point_exact"
    ) -> List[Dict[str, Any]]:
        """Find internships within a certain distance using geospatial queries.

        Args:
            lat: User's latitude
            lon: User's longitude
            max_distance_km: Maximum search distance in kilometers
            limit: Maximum number of results to return
            geo_field: Which geospatial field to use ('location_point_exact' or 'location_point_city')
        """
        if self.internships_collection is None:
            logger.error("No collection available for location search")
            return []

        try:
            # Use $near query for better performance and sorting by distance
            query = {
                geo_field: {
                    "$near": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [lon, lat]  # MongoDB expects [longitude, latitude]
                        },
                        "$maxDistance": max_distance_km * 1000  # Convert km to meters
                    }
                }
            }

            cursor = self.internships_collection.find(query).limit(limit)
            results = list(cursor)
            logger.info(f"Found {len(results)} internships within {max_distance_km}km using {geo_field}")
            return results
        except Exception as e:
            logger.error(f"Failed to find internships by location: {e}")
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
        """Find the nearest N internships to the user's coordinates, optionally filtered by preference.

        This implements the ML algorithm workflow: coordinates -> preferences filtering
        Supports max_distance_km to limit search radius.
        """
        if self.internships_collection is None:
            logger.error("No collection available for nearest search")
            return []

        try:
            # Build preference filter
            base_filter = {}
            if preference:
                if "sector" in preference and preference["sector"]:
                    # Case-insensitive regex match for sector
                    base_filter["sector"] = {"$regex": f"^{preference['sector']}$", "$options": "i"}
                if "skills" in preference and preference["skills"]:
                    base_filter["skills"] = {"$in": [s.lower() for s in preference["skills"]]}
                if "work_mode" in preference and preference["work_mode"]:
                    # Case-insensitive regex match for work_mode
                    base_filter["preference.work_mode"] = {"$regex": f"^{preference['work_mode']}$", "$options": "i"}

            # Add geospatial query
            geo_query = {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [user_lon, user_lat]  # [longitude, latitude]
                }
            }
            if max_distance_km is not None:
                geo_query["$maxDistance"] = max_distance_km * 1000  # meters

            base_filter[geo_field] = {
                "$near": geo_query
            }

            # Project only needed fields
            projection = {
                "_id": 0,
                "id": 1,
                "title": 1,
                "sector": 1,
                "skills": 1,
                "preference.work_mode": 1,
                "location.city": 1,
                "location.lat": 1,
                "location.lon": 1,
                "location_point_exact": 1,
                "location_point_city": 1,
                "expected_salary": 1,
                "job_role": 1,
                "qualification": 1,
                "duration": 1,
                "additional_support": 1,
                "interests": 1
            }

            cursor = self.internships_collection.find(base_filter, projection).limit(int(n))
            results = list(cursor)

            logger.info(f"Found {len(results)} nearest internships using {geo_field} with preferences: {preference}")
            return results

        except Exception as e:
            logger.error(f"Failed to find nearest internships: {e}")
            return []

    def find_internships_by_skills(self, skills: List[str], limit: int = 50) -> List[Dict[str, Any]]:
        """Find internships matching specific skills."""
        if self.internships_collection is None:
            logger.error("No collection available for skill search")
            return []

        try:
            # Create regex patterns for each skill
            skill_patterns = [f".*{skill}.*" for skill in skills]
            query = {
                "$or": [
                    {"skills": {"$in": skills}},
                    {"title": {"$regex": "|".join(skill_patterns), "$options": "i"}},
                    {"description": {"$regex": "|".join(skill_patterns), "$options": "i"}}
                ]
            }

            cursor = self.internships_collection.find(query).limit(limit)
            results = list(cursor)
            logger.info(f"Found {len(results)} internships matching skills: {skills}")
            return results
        except Exception as e:
            logger.error(f"Failed to find internships by skills: {e}")
            return []

    def find_internships_by_sector(self, sectors: List[str], limit: int = 50) -> List[Dict[str, Any]]:
        """Find internships in specific sectors."""
        if self.internships_collection is None:
            logger.error("No collection available for sector search")
            return []

        try:
            query = {"sector": {"$in": sectors}}
            cursor = self.internships_collection.find(query).limit(limit)
            results = list(cursor)
            logger.info(f"Found {len(results)} internships in sectors: {sectors}")
            return results
        except Exception as e:
            logger.error(f"Failed to find internships by sector: {e}")
            return []

    def get_collection_count(self) -> int:
        """Get total count of internships in collection."""
        if self.internships_collection is None:
            return 0

        try:
            return self.internships_collection.count_documents({})
        except Exception as e:
            logger.error(f"Failed to get collection count: {e}")
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
