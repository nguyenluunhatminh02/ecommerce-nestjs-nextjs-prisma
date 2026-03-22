"""
Data extraction service from PostgreSQL
"""
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncpg
import pandas as pd
from app.config import settings
from app.utils.logger import logger


class DataService:
    """Service for extracting and processing data from PostgreSQL"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self) -> None:
        """Establish database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                settings.database_url,
                min_size=5,
                max_size=settings.database_pool_size,
                command_timeout=60
            )
            logger.info("Database connection pool established")
        except Exception as e:
            logger.error("Failed to connect to database", extra={"error": str(e)})
            raise
    
    async def disconnect(self) -> None:
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    async def execute_query(self, query: str, *args) -> List[dict]:
        """
        Execute SQL query and return results as list of dicts
        
        Args:
            query: SQL query string
            *args: Query parameters
            
        Returns:
            List of result rows as dictionaries
        """
        async with self.pool.acquire() as conn:
            try:
                rows = await conn.fetch(query, *args)
                return [dict(row) for row in rows]
            except Exception as e:
                logger.error("Query execution failed", extra={"query": query, "error": str(e)})
                raise
    
    async def get_user_interactions(
        self,
        days: int = settings.training_data_days
    ) -> pd.DataFrame:
        """
        Extract user-product interactions from database
        
        Args:
            days: Number of days of historical data to extract
            
        Returns:
            DataFrame with user-product interactions
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = """
        -- Get purchase interactions
        SELECT 
            o.user_id,
            oi.product_id,
            'purchase' as interaction_type,
            oi.quantity as count,
            o.created_at as interaction_date
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status != 'CANCELLED'
        AND o.created_at >= $1
        
        UNION ALL
        
        -- Get review interactions
        SELECT 
            r.user_id,
            r.product_id,
            'review' as interaction_type,
            1 as count,
            r.created_at as interaction_date
        FROM reviews r
        WHERE r.approved = true
        AND r.created_at >= $1
        
        UNION ALL
        
        -- Get cart interactions
        SELECT 
            c.user_id,
            ci.product_id,
            'cart' as interaction_type,
            ci.quantity as count,
            ci.updated_at as interaction_date
        FROM carts c
        INNER JOIN cart_items ci ON c.id = ci.cart_id
        WHERE ci.updated_at >= $1
        
        UNION ALL
        
        -- Get wishlist interactions
        SELECT 
            w.user_id,
            w.product_id,
            'wishlist' as interaction_type,
            1 as count,
            w.created_at as interaction_date
        FROM wishlists w
        WHERE w.created_at >= $1
        
        UNION ALL
        
        -- Get product view interactions
        SELECT 
            rv.user_id,
            rv.product_id,
            'view' as interaction_type,
            1 as count,
            rv.viewed_at as interaction_date
        FROM recently_viewed rv
        WHERE rv.viewed_at >= $1
        
        ORDER BY interaction_date DESC
        """
        
        try:
            rows = await self.execute_query(query, cutoff_date)
            df = pd.DataFrame(rows)
            
            if df.empty:
                logger.warning("No interactions found in database")
                return df
            
            logger.info(
                f"Extracted {len(df)} interactions",
                extra={
                    "users": df['user_id'].nunique(),
                    "products": df['product_id'].nunique(),
                    "date_range": f"{df['interaction_date'].min()} to {df['interaction_date'].max()}"
                }
            )
            
            return df
        except Exception as e:
            logger.error("Failed to extract interactions", extra={"error": str(e)})
            raise
    
    async def get_product_details(self, product_ids: List[str]) -> Dict[str, Any]:
        """
        Get product details for a list of product IDs
        
        Args:
            product_ids: List of product IDs
            
        Returns:
            Dictionary mapping product_id to product details
        """
        if not product_ids:
            return {}
        
        query = """
        SELECT 
            p.id as product_id,
            p.name,
            p.slug,
            p.price,
            p.average_rating,
            p.review_count,
            p.sales_count,
            p.view_count,
            p.status,
            p.stock_quantity,
            c.id as category_id,
            c.name as category_name,
            b.id as brand_id,
            b.name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.id = ANY($1)
        AND p.deleted = false
        AND p.status = 'ACTIVE'
        """
        
        try:
            rows = await self.execute_query(query, product_ids)
            return {row['product_id']: row for row in rows}
        except Exception as e:
            logger.error("Failed to get product details", extra={"error": str(e)})
            raise
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user profile information
        
        Args:
            user_id: User ID
            
        Returns:
            User profile dictionary or None
        """
        query = """
        SELECT 
            u.id,
            u.email,
            u.created_at,
            u.last_login_at,
            COUNT(DISTINCT o.id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_spent,
            COUNT(DISTINCT r.id) as total_reviews
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'CANCELLED'
        LEFT JOIN reviews r ON u.id = r.user_id AND r.approved = true
        WHERE u.id = $1
        AND u.is_deleted = false
        AND u.is_active = true
        GROUP BY u.id, u.email, u.created_at, u.last_login_at
        """
        
        try:
            rows = await self.execute_query(query, user_id)
            return rows[0] if rows else None
        except Exception as e:
            logger.error("Failed to get user profile", extra={"user_id": user_id, "error": str(e)})
            raise
    
    async def get_active_users(self, days: int = 30) -> List[str]:
        """
        Get list of active users (users with recent interactions)
        
        Args:
            days: Number of days to consider for activity
            
        Returns:
            List of active user IDs
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = """
        SELECT DISTINCT user_id
        FROM (
            SELECT user_id FROM orders WHERE created_at >= $1 AND status != 'CANCELLED'
            UNION
            SELECT user_id FROM reviews WHERE created_at >= $1 AND approved = true
            UNION
            SELECT user_id FROM recently_viewed WHERE viewed_at >= $1
        ) active_users
        """
        
        try:
            rows = await self.execute_query(query, cutoff_date)
            user_ids = [row['user_id'] for row in rows]
            logger.info(f"Found {len(user_ids)} active users in last {days} days")
            return user_ids
        except Exception as e:
            logger.error("Failed to get active users", extra={"error": str(e)})
            raise
    
    async def get_active_products(
        self,
        min_interactions: int = settings.min_product_interactions
    ) -> List[str]:
        """
        Get list of active products (products with sufficient interactions)
        
        Args:
            min_interactions: Minimum number of interactions required
            
        Returns:
            List of active product IDs
        """
        query = """
        SELECT product_id
        FROM (
            SELECT product_id, COUNT(*) as interaction_count
            FROM (
                SELECT product_id FROM order_items
                UNION ALL
                SELECT product_id FROM reviews WHERE approved = true
                UNION ALL
                SELECT product_id FROM wishlists
                UNION ALL
                SELECT product_id FROM cart_items
                UNION ALL
                SELECT product_id FROM wishlists
                UNION ALL
                SELECT product_id FROM recently_viewed
            ) all_interactions
            GROUP BY product_id
        ) product_stats
        WHERE interaction_count >= $1
        """
        
        try:
            rows = await self.execute_query(query, min_interactions)
            product_ids = [row['product_id'] for row in rows]
            logger.info(f"Found {len(product_ids)} active products with >= {min_interactions} interactions")
            return product_ids
        except Exception as e:
            logger.error("Failed to get active products", extra={"error": str(e)})
            raise
    
    async def get_trending_products(
        self,
        days: int = 7,
        category_id: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get trending products based on recent activity
        
        Args:
            days: Number of days to consider
            category_id: Filter by category (optional)
            limit: Maximum number of products to return
            
        Returns:
            List of trending products with scores
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        params = [cutoff_date]
        if category_id:
            category_filter = f"AND p.category_id = ${len(params) + 1}"
            params.append(category_id)
        else:
            category_filter = ""
        
        limit_param = f"${len(params) + 1}"
        
        query = f"""
        SELECT 
            p.id as product_id,
            p.name,
            p.price,
            p.average_rating,
            p.review_count,
            p.sales_count,
            p.view_count,
            COALESCE(SUM(oi.quantity), 0) as recent_purchases,
            COALESCE(COUNT(DISTINCT o.user_id), 0) as unique_buyers,
            COALESCE(COUNT(DISTINCT rv.user_id), 0) as unique_viewers
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id 
            AND o.status != 'CANCELLED' 
            AND o.created_at >= $1
        LEFT JOIN recently_viewed rv ON p.id = rv.product_id 
            AND rv.viewed_at >= $1
        WHERE p.deleted = false 
        AND p.status = 'ACTIVE'
        {category_filter}
        GROUP BY p.id, p.name, p.price, p.average_rating, p.review_count, p.sales_count, p.view_count
        ORDER BY 
            (COALESCE(SUM(oi.quantity), 0) * 5.0 + COALESCE(COUNT(DISTINCT o.user_id), 0) * 3.0 + COALESCE(COUNT(DISTINCT rv.user_id), 0) * 1.0) DESC
        LIMIT {limit_param}
        """
        
        params.append(limit)
        
        try:
            rows = await self.execute_query(query, *params)
            return rows
        except Exception as e:
            logger.error("Failed to get trending products", extra={"error": str(e)})
            raise


# Global data service instance
data_service = DataService()
