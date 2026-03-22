"""
Redis cache service for performance optimization
"""
import json
import asyncio
from typing import Optional, Any, Dict, List
from datetime import timedelta
import redis.asyncio as aioredis
from app.config import settings
from app.utils.logger import logger


class CacheService:
    """Redis cache service with async operations"""
    
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.ttl = settings.redis_cache_ttl
    
    async def connect(self) -> None:
        """Establish Redis connection"""
        try:
            self.redis = await aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=settings.redis_max_connections
            )
            # Test connection
            await self.redis.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error("Failed to connect to Redis", extra={"error": str(e)})
            raise
    
    async def disconnect(self) -> None:
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            logger.info("Redis connection closed")
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        try:
            value = await self.redis.get(key)
            if value is not None:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error("Cache get failed", extra={"key": key, "error": str(e)})
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (uses default if None)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            serialized = json.dumps(value)
            await self.redis.setex(key, ttl or self.ttl, serialized)
            return True
        except Exception as e:
            logger.error("Cache set failed", extra={"key": key, "error": str(e)})
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete key from cache
        
        Args:
            key: Cache key
            
        Returns:
            True if successful, False otherwise
        """
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error("Cache delete failed", extra={"key": key, "error": str(e)})
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete keys matching pattern
        
        Args:
            pattern: Key pattern (e.g., "user:*")
            
        Returns:
            Number of keys deleted
        """
        try:
            keys = []
            async for key in self.redis.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                await self.redis.delete(*keys)
            
            return len(keys)
        except Exception as e:
            logger.error("Cache pattern delete failed", extra={"pattern": pattern, "error": str(e)})
            return 0
    
    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists, False otherwise
        """
        try:
            return await self.redis.exists(key) > 0
        except Exception as e:
            logger.error("Cache exists check failed", extra={"key": key, "error": str(e)})
            return False
    
    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """
        Get multiple values from cache
        
        Args:
            keys: List of cache keys
            
        Returns:
            Dictionary of key-value pairs for found keys
        """
        try:
            values = await self.redis.mget(keys)
            result = {}
            for key, value in zip(keys, values):
                if value is not None:
                    result[key] = json.loads(value)
            return result
        except Exception as e:
            logger.error("Cache get_many failed", extra={"keys": keys, "error": str(e)})
            return {}
    
    async def set_many(
        self,
        mapping: Dict[str, Any],
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set multiple values in cache
        
        Args:
            mapping: Dictionary of key-value pairs
            ttl: Time to live in seconds
            
        Returns:
            True if successful, False otherwise
        """
        try:
            pipe = self.redis.pipeline()
            for key, value in mapping.items():
                serialized = json.dumps(value)
                pipe.setex(key, ttl or self.ttl, serialized)
            await pipe.execute()
            return True
        except Exception as e:
            logger.error("Cache set_many failed", extra={"error": str(e)})
            return False
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """
        Increment numeric value in cache
        
        Args:
            key: Cache key
            amount: Amount to increment by
            
        Returns:
            New value after increment
        """
        try:
            return await self.redis.incrby(key, amount)
        except Exception as e:
            logger.error("Cache increment failed", extra={"key": key, "error": str(e)})
            return 0
    
    async def get_or_set(
        self,
        key: str,
        factory,
        ttl: Optional[int] = None
    ) -> Any:
        """
        Get value from cache or compute and set it
        
        Args:
            key: Cache key
            factory: Async function to compute value if not in cache
            ttl: Time to live in seconds
            
        Returns:
            Cached or computed value
        """
        value = await self.get(key)
        if value is not None:
            return value
        
        computed_value = await factory()
        await self.set(key, computed_value, ttl)
        return computed_value
    
    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache stats
        """
        try:
            info = await self.redis.info("stats")
            return {
                "total_keys": info.get("keyspace_hits", 0),
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "hit_rate": info.get("keyspace_hits", 0) / max(
                    info.get("keyspace_hits", 0) + info.get("keyspace_misses", 1),
                    1
                )
            }
        except Exception as e:
            logger.error("Failed to get cache stats", extra={"error": str(e)})
            return {}


# Global cache service instance
cache_service = CacheService()


def get_cache_key(prefix: str, *parts: str) -> str:
    """
    Generate standardized cache key
    
    Args:
        prefix: Key prefix (e.g., "user", "product")
        *parts: Additional key components
        
    Returns:
        Formatted cache key
    """
    return ":".join([prefix] + [str(p) for p in parts if p])


def get_user_recommendations_key(user_id: str) -> str:
    """Get cache key for user recommendations"""
    return get_cache_key("rec", "user", user_id)


def get_similar_products_key(product_id: str) -> str:
    """Get cache key for similar products"""
    return get_cache_key("rec", "similar", product_id)


def get_trending_products_key(category_id: Optional[str] = None) -> str:
    """Get cache key for trending products"""
    if category_id:
        return get_cache_key("rec", "trending", "category", category_id)
    return get_cache_key("rec", "trending")


def get_model_key(model_type: str) -> str:
    """Get cache key for model metadata"""
    return get_cache_key("model", model_type)
