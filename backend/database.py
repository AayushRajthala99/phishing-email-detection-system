"""
MongoDB Database Configuration and Connection Management
Implements secure connection pooling for high-concurrency scenarios.
"""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

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
            # Get configuration from environment variables
            mongo_host = os.getenv("MONGO_HOST", "localhost")
            mongo_port = int(os.getenv("MONGO_PORT", "27017"))
            mongo_username = os.getenv("MONGO_USERNAME", "admin")
            mongo_password = os.getenv("MONGO_PASSWORD", "securepassword123")
            mongo_db_name = os.getenv("MONGO_DB_NAME", "phishing_detection")

            # Build connection URI with authentication
            mongo_uri = f"mongodb://{mongo_username}:{mongo_password}@{mongo_host}:{mongo_port}/"

            logger.info(f"Connecting to MongoDB at {mongo_host}:{mongo_port}...")

            # Create client with optimized connection pool settings
            self.client = AsyncIOMotorClient(
                mongo_uri,
                maxPoolSize=50,  # Maximum connections in pool
                minPoolSize=10,  # Minimum connections to maintain
                maxIdleTimeMS=45000,  # Close idle connections after 45s
                serverSelectionTimeoutMS=5000,  # 5s timeout for server selection
                connectTimeoutMS=10000,  # 10s connection timeout
                socketTimeoutMS=45000,  # 45s socket timeout
                retryWrites=True,  # Automatic retry for write operations
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
        if not self.is_connected or not self.db:
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
            logger.info(f"Prediction saved successfully with ID: {inserted_id}")
            return inserted_id

        except Exception as e:
            logger.error(f"Failed to save prediction: {e}", exc_info=True)
            return None

    async def get_all_reports(self) -> Optional[list]:
        """
        Retrieve all prediction reports from database.
        Returns list of reports or None on failure.
        """
        if not self.is_connected or not self.db:
            logger.error("Cannot fetch reports: Database not connected")
            return None

        try:
            # Fetch all documents, sorted by timestamp (newest first)
            cursor = self.db.predictions.find().sort("timestamp", -1)
            reports = await cursor.to_list(length=None)

            # Convert ObjectId to string for JSON serialization
            for report in reports:
                report["_id"] = str(report["_id"])

            logger.info(f"Retrieved {len(reports)} reports from database")
            return reports

        except Exception as e:
            logger.error(f"Failed to fetch reports: {e}", exc_info=True)
            return None

    async def get_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a single prediction report by ID.

        Args:
            report_id: String representation of MongoDB ObjectId

        Returns:
            Report document or None if not found/error
        """
        if not self.is_connected or not self.db:
            logger.error("Cannot fetch report: Database not connected")
            return None

        try:
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
                logger.info(f"Retrieved report with ID: {report_id}")
            else:
                logger.info(f"No report found with ID: {report_id}")

            return report

        except Exception as e:
            logger.error(f"Failed to fetch report by ID: {e}", exc_info=True)
            return None


# Global database manager instance
db_manager = DatabaseManager()
