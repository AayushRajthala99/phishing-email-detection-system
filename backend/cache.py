"""
Caching Layer
Implements in-memory caching for frequent database queries and ML predictions.
"""

from typing import Optional, Any
from datetime import datetime, timedelta
import hashlib
import json


class SimpleCache:
    """Thread-safe in-memory cache with TTL support"""
    
    def __init__(self, default_ttl: int = 300):
        self._cache: dict = {}
        self._expiry: dict = {}
        self.default_ttl = default_ttl
    
    def _is_expired(self, key: str) -> bool:
        """Check if cache entry is expired"""
        if key not in self._expiry:
            return True
        return datetime.utcnow() > self._expiry[key]
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key in self._cache and not self._is_expired(key):
            return self._cache[key]
        # Clean up expired entry
        if key in self._cache:
            del self._cache[key]
            del self._expiry[key]
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with TTL"""
        self._cache[key] = value
        ttl = ttl or self.default_ttl
        self._expiry[key] = datetime.utcnow() + timedelta(seconds=ttl)
    
    def delete(self, key: str) -> None:
        """Delete key from cache"""
        if key in self._cache:
            del self._cache[key]
        if key in self._expiry:
            del self._expiry[key]
    
    def clear(self) -> None:
        """Clear all cache"""
        self._cache.clear()
        self._expiry.clear()
    
    def cleanup_expired(self) -> int:
        """Remove all expired entries, return count"""
        expired_keys = [
            key for key in self._cache.keys()
            if self._is_expired(key)
        ]
        for key in expired_keys:
            self.delete(key)
        return len(expired_keys)
    
    @staticmethod
    def generate_key(*args, **kwargs) -> str:
        """Generate cache key from arguments"""
        key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
        return hashlib.md5(key_data.encode()).hexdigest()


# Global cache instance
cache = SimpleCache(default_ttl=300)
