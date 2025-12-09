"""
MongoDB Database Configuration and Connection Management
Implements secure connection pooling for high-concurrency scenarios.
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from cache import cache

try:
    from config import settings
    USE_CONFIG = True
except ImportError:
    USE_CONFIG = False

logger = logging.getLogger("Phishing-Email-Detection-System-API.Database")


class DatabaseManager:
    """
    Manages MongoDB connection with efficient connection pooling.
    Optimized for high-concurrency async operations.
    """

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self._is_connected: bool = False

    async def connect(self) -> bool:
        """
        Establish connection to MongoDB with connection pooling.
        Returns True if successful, False otherwise.
        """
        try:
            # Get configuration
            if USE_CONFIG:
                mongo_host = settings.MONGO_HOST
                mongo_port = settings.MONGO_PORT
                mongo_username = settings.MONGO_USERNAME
                mongo_password = settings.MONGO_PASSWORD
                mongo_db_name = settings.MONGO_DB_NAME
                max_pool = settings.MONGO_MAX_POOL_SIZE
                min_pool = settings.MONGO_MIN_POOL_SIZE
            else:
                mongo_host = os.getenv("MONGO_HOST", "localhost")
                mongo_port = int(os.getenv("MONGO_PORT", "27017"))
                mongo_username = os.getenv("MONGO_USERNAME", "admin")
                mongo_password = os.getenv("MONGO_PASSWORD", "securepassword123")
                mongo_db_name = os.getenv("MONGO_DB_NAME", "phishing_detection")
                max_pool = 50
                min_pool = 10

            # Build connection URI with authentication
            mongo_uri = f"mongodb://{mongo_username}:{mongo_password}@{mongo_host}:{mongo_port}/"

            logger.info(f"Connecting to MongoDB at {mongo_host}:{mongo_port}...")

            # Create client with optimized connection pool settings
            self.client = AsyncIOMotorClient(
                mongo_uri,
                maxPoolSize=max_pool,
                minPoolSize=min_pool,
                maxIdleTimeMS=45000,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=45000,
                retryWrites=True,
                retryReads=True,  # Also retry read operations
                w="majority",  # Write concern for data safety
            )

            # Get database reference
            self.db = self.client[mongo_db_name]

            # Test connection
            await self.client.admin.command("ping")
            self._is_connected = True

            # Create indexes for better query performance
            await self._create_indexes()

            logger.info("✓ MongoDB connection established successfully!")
            return True

        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"✗ Failed to connect to MongoDB: {e}")
            self._is_connected = False
            return False
        except Exception as e:
            logger.error(f"✗ Unexpected error during MongoDB connection: {e}")
            self._is_connected = False
            return False

    async def _create_indexes(self):
        """Create database indexes for optimized queries."""
        try:
            # Index on timestamp for sorting reports by date
            await self.db.predictions.create_index([("timestamp", -1)])
            # Index on prediction for filtering
            await self.db.predictions.create_index("prediction")
            # Compound index for common queries
            await self.db.predictions.create_index(
                [("prediction", 1), ("timestamp", -1)]
            )
            # Index on SHA256 for attachment lookups
            await self.db.predictions.create_index("attachments_info.sha256")
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.warning(f"Failed to create indexes: {e}")

    async def disconnect(self):
        """Close MongoDB connection and cleanup resources."""
        if self.client:
            self.client.close()
            self._is_connected = False
            logger.info("MongoDB connection closed")

    @property
    def is_connected(self) -> bool:
        """Check if database is connected."""
        return self._is_connected

    async def save_prediction(self, prediction_data: Dict[str, Any]) -> Optional[str]:
        """
        Save a prediction record to the database.
        Returns the inserted document ID as string, or None if failed.

        Args:
            prediction_data: Dictionary containing prediction information

        Returns:
            String ID of inserted document, or None on failure
        """
        if not self.is_connected or self.db is None:
            logger.error("Cannot save prediction: Database not connected")
            return None

        try:
            # Add timestamp
            document = {
                **prediction_data,
                "timestamp": datetime.utcnow(),
            }

            # Insert document
            result = await self.db.predictions.insert_one(document)

            inserted_id = str(result.inserted_id)
            
            # Invalidate cache since we have new data
            cache.delete("all_reports")
            
            logger.info(f"Prediction saved successfully with ID: {inserted_id}")
            return inserted_id

        except Exception as e:
            logger.error(f"Failed to save prediction: {e}", exc_info=True)
            return None

    async def get_all_reports(self, use_cache: bool = True) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve all prediction reports from database.
        Returns list of reports or None on failure.
        
        Args:
            use_cache: Whether to use cached results
        """
        if not self.is_connected or self.db is None:
            logger.error("Cannot fetch reports: Database not connected")
            return None

        try:
            # Try cache first
            if use_cache:
                cache_key = "all_reports"
                cached = cache.get(cache_key)
                if cached is not None:
                    logger.debug(f"Cache hit for all reports ({len(cached)} reports)")
                    return cached
            
            # Fetch all documents, sorted by timestamp (newest first)
            cursor = self.db.predictions.find().sort("timestamp", -1)
            reports = await cursor.to_list(length=None)

            # Convert ObjectId to string for JSON serialization
            for report in reports:
                report["_id"] = str(report["_id"])

            # Cache the results
            if use_cache:
                cache.set(cache_key, reports, ttl=60)  # Cache for 1 minute
            
            logger.info(f"Retrieved {len(reports)} reports from database")
            return reports

        except Exception as e:
            logger.error(f"Failed to fetch reports: {e}", exc_info=True)
            return None

    async def get_report_by_id(self, report_id: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """
        Retrieve a single prediction report by ID.

        Args:
            report_id: String representation of MongoDB ObjectId
            use_cache: Whether to use cached results

        Returns:
            Report document or None if not found/error
        """
        if not self.is_connected or self.db is None:
            logger.error("Cannot fetch report: Database not connected")
            return None

        try:
            # Try cache first
            if use_cache:
                cache_key = f"report_{report_id}"
                cached = cache.get(cache_key)
                if cached is not None:
                    logger.debug(f"Cache hit for report {report_id}")
                    return cached
            
            from bson import ObjectId
            from bson.errors import InvalidId

            # Validate and convert to ObjectId
            try:
                object_id = ObjectId(report_id)
            except InvalidId:
                logger.warning(f"Invalid ObjectId format: {report_id}")
                return None

            # Find document
            report = await self.db.predictions.find_one({"_id": object_id})

            if report:
                # Convert ObjectId to string
                report["_id"] = str(report["_id"])
                
                # Cache the result
                if use_cache:
                    cache.set(cache_key, report, ttl=300)  # Cache for 5 minutes
                
                logger.info(f"Retrieved report with ID: {report_id}")
            else:
                logger.info(f"No report found with ID: {report_id}")

            return report

        except Exception as e:
            logger.error(f"Failed to fetch report by ID: {e}", exc_info=True)
            return None


# Global database manager instance
db_manager = DatabaseManager()
