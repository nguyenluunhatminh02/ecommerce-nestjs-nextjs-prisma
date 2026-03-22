"""
Comprehensive API Test Script for E-Commerce ML Integration
Tests both FastAPI ML Service (port 8000) and NestJS Backend (port 8081)
"""
import requests
import json
import time
import sys

FASTAPI_URL = "http://localhost:8000"
NESTJS_URL = "http://localhost:8081/api/v1"

results = {"passed": 0, "failed": 0, "tests": []}

def test(name, method, url, expected_status=200, body=None, headers=None):
    """Run a single API test"""
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=15)
        elif method == "POST":
            r = requests.post(url, json=body, headers=headers, timeout=15)
        elif method == "PUT":
            r = requests.put(url, json=body, headers=headers, timeout=15)
        elif method == "DELETE":
            r = requests.delete(url, headers=headers, timeout=15)
        
        status = "PASS" if r.status_code == expected_status else "FAIL"
        if status == "PASS":
            results["passed"] += 1
        else:
            results["failed"] += 1
        
        try:
            data = r.json()
        except:
            data = r.text[:200]
        
        result = {
            "name": name,
            "status": status,
            "http_status": r.status_code,
            "expected": expected_status,
            "response_preview": str(data)[:300]
        }
        results["tests"].append(result)
        
        icon = "✓" if status == "PASS" else "✗"
        print(f"  {icon} {name} [{r.status_code}]")
        if status == "FAIL":
            print(f"    Expected: {expected_status}, Got: {r.status_code}")
            print(f"    Response: {str(data)[:200]}")
        return data
        
    except Exception as e:
        results["failed"] += 1
        result = {"name": name, "status": "ERROR", "error": str(e)}
        results["tests"].append(result)
        print(f"  ✗ {name} [ERROR: {str(e)[:100]}]")
        return None


# ==============================================================
# SECTION 1: FastAPI ML Service Tests
# ==============================================================
print("\n" + "="*60)
print("SECTION 1: FastAPI ML Service (port 8000)")
print("="*60)

print("\n--- 1.1 Core Endpoints ---")
test("FastAPI Root", "GET", f"{FASTAPI_URL}/")
test("FastAPI Health", "GET", f"{FASTAPI_URL}/health")
test("FastAPI Readiness", "GET", f"{FASTAPI_URL}/ready")
test("FastAPI OpenAPI Schema", "GET", f"{FASTAPI_URL}/openapi.json")

print("\n--- 1.2 Recommendation Endpoints ---")
test("User Recommendations", "GET", f"{FASTAPI_URL}/api/v1/recommendations/users/user-1?limit=5")
test("Similar Products", "GET", f"{FASTAPI_URL}/api/v1/recommendations/products/product-1/similar?limit=5")
test("Trending Products", "GET", f"{FASTAPI_URL}/api/v1/recommendations/trending?limit=10")

print("\n--- 1.3 Training Endpoints ---")
data = test("Start SVD Training", "POST", f"{FASTAPI_URL}/api/v1/training/train", body={"algorithm": "svd", "force_retrain": True})
training_id = data.get("training_id") if data else None
if training_id:
    time.sleep(5)  # Wait for training
    test("Check Training Status", "GET", f"{FASTAPI_URL}/api/v1/training/status/{training_id}")

test("Get Model Metrics", "GET", f"{FASTAPI_URL}/api/v1/training/metrics")

print("\n--- 1.4 Validation ---")
test("Invalid Algorithm", "GET", f"{FASTAPI_URL}/api/v1/recommendations/users/user-1?algorithm=invalid", expected_status=422)


# ==============================================================
# SECTION 2: NestJS Backend Tests - Auth
# ==============================================================
print("\n" + "="*60)
print("SECTION 2: NestJS Backend - Auth (port 8081)")
print("="*60)

# Register + Login to get token
print("\n--- 2.1 Auth ---")
register_data = {
    "fullName": "ML Test User",
    "email": f"mltest_{int(time.time())}@test.com",
    "password": "TestPassword123!"
}
reg = test("Register User", "POST", f"{NESTJS_URL}/auth/register", body=register_data, expected_status=201)

login_data = {"email": register_data["email"], "password": register_data["password"]}
login = test("Login User", "POST", f"{NESTJS_URL}/auth/login", body=login_data)
token = None
user_id = None
if login and login.get("data"):
    token = login["data"].get("accessToken") or login["data"].get("access_token")
    user_id = login["data"].get("user", {}).get("id")
    print(f"    Token obtained: {'Yes' if token else 'No'}")
    print(f"    User ID: {user_id}")

auth_headers = {"Authorization": f"Bearer {token}"} if token else {}


# ==============================================================
# SECTION 3: NestJS Products API Tests
# ==============================================================
print("\n" + "="*60)
print("SECTION 3: NestJS Backend - Products API")
print("="*60)

print("\n--- 3.1 Product Browsing ---")
products = test("Get Products (filter)", "GET", f"{NESTJS_URL}/products/filter?page=1&limit=10")
product_id = None
product_slug = None
if products and products.get("data"):
    content = products["data"].get("content", products["data"])
    if isinstance(content, list) and len(content) > 0:
        product_id = content[0].get("id")
        product_slug = content[0].get("slug")
        print(f"    First product ID: {product_id}")
        print(f"    First product slug: {product_slug}")

test("Featured Products", "GET", f"{NESTJS_URL}/products/featured")
test("New Arrivals", "GET", f"{NESTJS_URL}/products/new-arrivals")
test("Best Sellers", "GET", f"{NESTJS_URL}/products/best-sellers")
test("Deals", "GET", f"{NESTJS_URL}/products/deals")

if product_slug:
    test("Get Product by Slug", "GET", f"{NESTJS_URL}/products/slug/{product_slug}")

if product_id:
    test("Related Products", "GET", f"{NESTJS_URL}/products/{product_id}/related")


# ==============================================================
# SECTION 4: NestJS ML Recommendation Endpoints
# ==============================================================
print("\n" + "="*60)
print("SECTION 4: NestJS Backend - ML Recommendations")
print("="*60)

print("\n--- 4.1 Recommendation Retrieval ---")
test("Personalized Recommendations", "GET", f"{NESTJS_URL}/products/recommendations/personalized", headers=auth_headers)
if product_id:
    test("Similar Products (ML)", "GET", f"{NESTJS_URL}/products/recommendations/similar/{product_id}", headers=auth_headers)
    test("Frequently Bought Together", "GET", f"{NESTJS_URL}/products/recommendations/frequently-bought/{product_id}", headers=auth_headers)
test("Trending Products (ML)", "GET", f"{NESTJS_URL}/products/recommendations/trending")
test("Popular Products", "GET", f"{NESTJS_URL}/products/recommendations/popular")

print("\n--- 4.2 Tracking ---")
if product_id and token:
    test("Track Product View", "POST", f"{NESTJS_URL}/products/recommendations/track/view", 
         body={"productId": product_id}, headers=auth_headers, expected_status=201)
    test("Track Add to Cart", "POST", f"{NESTJS_URL}/products/recommendations/track/cart",
         body={"productId": product_id}, headers=auth_headers, expected_status=201)
    test("Track Purchase", "POST", f"{NESTJS_URL}/products/recommendations/track/purchase",
         body={"productId": product_id, "quantity": 1}, headers=auth_headers, expected_status=201)

print("\n--- 4.3 ML Management ---")
test("Recommendation Stats", "GET", f"{NESTJS_URL}/products/recommendations/stats", headers=auth_headers)
test("ML Health", "GET", f"{NESTJS_URL}/products/recommendations/ml/health", headers=auth_headers)
test("ML Metrics", "GET", f"{NESTJS_URL}/products/recommendations/ml/metrics", headers=auth_headers)

data = test("Trigger ML Training", "POST", f"{NESTJS_URL}/products/recommendations/ml/train",
     body={"algorithm": "svd"}, headers=auth_headers, expected_status=201)
if data and data.get("data") and data["data"].get("training_id"):
    tid = data["data"]["training_id"]
    time.sleep(3)
    test("ML Training Status", "GET", f"{NESTJS_URL}/products/recommendations/ml/training-status/{tid}", headers=auth_headers)


# ==============================================================
# SECTION 5: NestJS Other Core APIs
# ==============================================================
print("\n" + "="*60)
print("SECTION 5: NestJS Backend - Other Core APIs")
print("="*60)

print("\n--- 5.1 Categories & Brands ---")
cats = test("List Categories", "GET", f"{NESTJS_URL}/categories")
category_id = None
if cats and cats.get("data") and isinstance(cats["data"], list) and len(cats["data"]) > 0:
    category_id = cats["data"][0].get("id")
    print(f"    First category ID: {category_id}")

brands = test("List Brands", "GET", f"{NESTJS_URL}/brands")
brand_id = None
if brands and brands.get("data") and isinstance(brands["data"], list) and len(brands["data"]) > 0:
    brand_id = brands["data"][0].get("id")

print("\n--- 5.2 Cart ---")
if token and product_id:
    test("Add to Cart", "POST", f"{NESTJS_URL}/cart/items", body={"productId": product_id, "quantity": 1}, headers=auth_headers, expected_status=201)
    test("Get Cart", "GET", f"{NESTJS_URL}/cart", headers=auth_headers)

print("\n--- 5.3 Wishlist ---")
if token and product_id:
    test("Add to Wishlist", "POST", f"{NESTJS_URL}/wishlist/{product_id}", body=None, headers=auth_headers, expected_status=201)
    test("Get Wishlist", "GET", f"{NESTJS_URL}/wishlist", headers=auth_headers)

print("\n--- 5.4 Reviews ---")
test("Get Product Reviews", "GET", f"{NESTJS_URL}/reviews/product/{product_id}" if product_id else f"{NESTJS_URL}/reviews")

print("\n--- 5.5 Banners ---")
test("List Banners (active)", "GET", f"{NESTJS_URL}/banners/active")

print("\n--- 5.6 Blog ---")
test("List Blog Posts", "GET", f"{NESTJS_URL}/blog/posts")

print("\n--- 5.7 Shops ---")
test("Top Shops", "GET", f"{NESTJS_URL}/shops/top")

print("\n--- 5.8 Collections ---")
test("List Collections", "GET", f"{NESTJS_URL}/collections")

print("\n--- 5.9 Flash Sales ---")
test("List Flash Sales", "GET", f"{NESTJS_URL}/flash-sales", headers=auth_headers)

print("\n--- 5.10 FAQs ---")
test("List FAQs", "GET", f"{NESTJS_URL}/faqs")

print("\n--- 5.11 CMS ---")
test("List CMS Pages", "GET", f"{NESTJS_URL}/cms/pages")

print("\n--- 5.12 Gift Cards ---")
test("List Gift Cards (user)", "GET", f"{NESTJS_URL}/gift-cards", headers=auth_headers)

print("\n--- 5.13 Coupons ---")
test("List Coupons", "GET", f"{NESTJS_URL}/coupons", headers=auth_headers)

print("\n--- 5.14 User Profile ---")
if token:
    test("Get Profile", "GET", f"{NESTJS_URL}/users/me", headers=auth_headers)

print("\n--- 5.15 Notifications ---")
if token:
    test("Get Notifications", "GET", f"{NESTJS_URL}/notifications", headers=auth_headers)

print("\n--- 5.16 Orders ---")
if token:
    test("Get My Orders", "GET", f"{NESTJS_URL}/orders/my", headers=auth_headers)

print("\n--- 5.17 Addresses ---")
if token:
    test("Get Addresses", "GET", f"{NESTJS_URL}/addresses", headers=auth_headers)

print("\n--- 5.18 Wallet ---")
if token:
    test("Get Wallet Balance", "GET", f"{NESTJS_URL}/wallet/balance", headers=auth_headers)

print("\n--- 5.19 Newsletter ---")
test("Subscribe Newsletter", "POST", f"{NESTJS_URL}/newsletter/subscribe", body={"email": f"newsletter_{int(time.time())}@test.com"}, expected_status=201)

print("\n--- 5.20 Shipping ---")
test("Get Shipping Methods (active)", "GET", f"{NESTJS_URL}/shipping/methods/active")

print("\n--- 5.21 Health ---")
test("Health Check", "GET", f"{NESTJS_URL}/health")

print("\n--- 5.22 Product Questions ---")
if product_id:
    test("Get Product Questions", "GET", f"{NESTJS_URL}/product-questions/product/{product_id}")

print("\n--- 5.23 Warehouses ---")
test("List Warehouses", "GET", f"{NESTJS_URL}/warehouses", headers=auth_headers)

print("\n--- 5.24 Support ---")
if token:
    test("Get Support Tickets", "GET", f"{NESTJS_URL}/support/tickets/my", headers=auth_headers)

print("\n--- 5.25 Loyalty ---")
if token:
    test("Get Loyalty Programs", "GET", f"{NESTJS_URL}/loyalty/programs")


# ==============================================================
# SECTION 6: Admin API Tests
# ==============================================================
print("\n" + "="*60)
print("SECTION 6: NestJS Backend - Admin APIs")
print("="*60)

# Login as admin
admin_login = test("Admin Login", "POST", f"{NESTJS_URL}/auth/login", body={"email": "admin@ecommerce.com", "password": "Admin@123"})
admin_token = None
if admin_login and admin_login.get("data"):
    admin_token = admin_login["data"].get("accessToken") or admin_login["data"].get("access_token")
    print(f"    Admin token: {'Yes' if admin_token else 'No'}")

admin_headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}

if admin_token:
    print("\n--- 6.1 Admin Dashboard ---")
    test("Admin Dashboard Stats", "GET", f"{NESTJS_URL}/admin/dashboard/stats", headers=admin_headers)
    test("Admin Users List", "GET", f"{NESTJS_URL}/admin/users?page=1&limit=5", headers=admin_headers)
    test("Admin Orders List", "GET", f"{NESTJS_URL}/admin/orders?page=1&limit=5", headers=admin_headers)
    test("Admin Products List", "GET", f"{NESTJS_URL}/admin/products?page=1&limit=5", headers=admin_headers)
    
    print("\n--- 6.2 Admin Analytics ---")
    test("Analytics Overview", "GET", f"{NESTJS_URL}/analytics/overview", headers=admin_headers)
    test("Analytics Revenue", "GET", f"{NESTJS_URL}/analytics/revenue", headers=admin_headers)


# ==============================================================
# SUMMARY
# ==============================================================
print("\n" + "="*60)
print("TEST RESULTS SUMMARY")
print("="*60)
total = results["passed"] + results["failed"]
print(f"\n  Total Tests: {total}")
print(f"  Passed: {results['passed']} ✓")
print(f"  Failed: {results['failed']} ✗")
print(f"  Success Rate: {results['passed']/total*100:.1f}%" if total > 0 else "  No tests ran")

if results["failed"] > 0:
    print(f"\n  Failed Tests:")
    for t in results["tests"]:
        if t["status"] != "PASS":
            print(f"    - {t['name']}: {t.get('http_status', 'N/A')} (expected {t.get('expected', 'N/A')})")

print()
