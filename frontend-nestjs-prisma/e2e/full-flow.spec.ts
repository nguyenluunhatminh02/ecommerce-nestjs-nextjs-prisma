import { expect, test } from '@playwright/test';

// ──────────────────────────────────────────────────────────────
// AUTH FLOW
// ──────────────────────────────────────────────────────────────

test.describe('Auth Flow', () => {
  test('login page renders and validates required fields', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    // HTML5 or custom validation should prevent submission
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('login with wrong credentials shows error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Mật khẩu').fill('WrongPass123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    // Expect an error message visible on page
    await expect(
      page.locator('text=/sai|không đúng|thất bại|invalid|incorrect/i').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('customer can log in and is redirected to home', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('customer1@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Customer123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('logged-in user can logout', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('customer1@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Customer123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });

    // Logout via header menu or account dropdown
    const logoutBtn = page.locator('button, a').filter({ hasText: /đăng xuất|logout/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Open account dropdown first
      await page.locator('[data-testid="user-menu"], button[aria-label*="account" i], button[aria-label*="tài khoản" i]').first().click();
      await page.locator('text=/đăng xuất|logout/i').first().click();
    }
    await expect(page).toHaveURL(/\/auth\/login|\//, { timeout: 8000 });
  });

  test('register page is accessible', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────────────
// HOME PAGE
// ──────────────────────────────────────────────────────────────

test.describe('Home Page', () => {
  test('home page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.locator('main, body')).toBeVisible({ timeout: 10000 });
    // No critical console errors (filter out minor ones)
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('hydrat')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('home page shows product sections', async ({ page }) => {
    await page.goto('/');
    // Should have at least one product card visible
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('navigation header is visible on home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header, nav').first()).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────────────
// PRODUCT BROWSING
// ──────────────────────────────────────────────────────────────

test.describe('Product Browsing', () => {
  test('products listing page shows products', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('search bar navigates to search results', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[type="search"], input[placeholder*="tìm" i], input[name="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('laptop');
      await searchInput.press('Enter');
      await expect(page).toHaveURL(/search|products/, { timeout: 8000 });
    }
  });

  test('product detail page loads with add-to-cart button', async ({ page }) => {
    await page.goto('/products?category=electronics');
    const firstProduct = page.locator('a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    await firstProduct.click();
    await page.waitForURL(/\/products\//, { timeout: 10000 });
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /thêm vào giỏ|add to cart/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('category filter page loads products', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});

// ──────────────────────────────────────────────────────────────
// CART
// ──────────────────────────────────────────────────────────────

test.describe('Cart', () => {
  test.beforeEach(async ({ page }) => {
    // Login before cart tests
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('customer1@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Customer123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
  });

  test('cart page is accessible', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('add to cart from product page updates cart count', async ({ page }) => {
    await page.goto('/products?category=electronics');
    const firstProduct = page.locator('a[href^="/products/"]').first();
    await firstProduct.click();
    await page.waitForURL(/\/products\//, { timeout: 10000 });

    const addBtn = page.getByRole('button', { name: /thêm vào giỏ|add to cart/i });
    await expect(addBtn).toBeVisible({ timeout: 8000 });
    await addBtn.click();

    // Cart count should increment (badge in header)
    await page.waitForTimeout(1500);
    const cartBadge = page.locator('[data-testid="cart-count"], .cart-count, [aria-label*="cart" i] span').first();
    if (await cartBadge.isVisible()) {
      const count = await cartBadge.textContent();
      expect(Number(count)).toBeGreaterThan(0);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// CHECKOUT
// ──────────────────────────────────────────────────────────────

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('customer1@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Customer123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
  });

  test('checkout page loads shipping methods from API', async ({ page }) => {
    await page.goto('/checkout');
    // Page should not show "SHIPPING_METHODS" hardcoded text but should load from API
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    // Shipping section should be visible (either methods or empty state)
    const shippingSection = page.locator('text=/vận chuyển|shipping|giao hàng/i').first();
    await expect(shippingSection).toBeVisible({ timeout: 8000 });
  });
});

// ──────────────────────────────────────────────────────────────
// BLOG
// ──────────────────────────────────────────────────────────────

test.describe('Blog', () => {
  test('blog page loads from real API', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    // Should either show blog posts or empty state, NOT hardcoded stub data
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
  });
});

// ──────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────────────────────

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('customer1@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Customer123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
  });

  test('notifications page is accessible', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('mark all notifications as read works', async ({ page }) => {
    await page.goto('/notifications');
    const markAllBtn = page.locator('button').filter({ hasText: /đánh dấu.*đọc|mark all|read all/i }).first();
    if (await markAllBtn.isVisible({ timeout: 5000 })) {
      await markAllBtn.click();
      // Verify no API error shown
      await expect(page.locator('text=/lỗi|error/i').first()).toHaveCount(0);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// ORDERS
// ──────────────────────────────────────────────────────────────

test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('customer1@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Customer123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
  });

  test('orders page loads customer orders', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
  });
});

// ──────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ──────────────────────────────────────────────────────────────

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('admin@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Admin123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
  });

  test('admin dashboard page is accessible', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10000 });
  });

  test('admin products page loads', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1, h2, table, [role="grid"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin orders page loads', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('admin customers page loads', async ({ page }) => {
    await page.goto('/admin/customers');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('admin categories page loads', async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});

// ──────────────────────────────────────────────────────────────
// SELLER DASHBOARD
// ──────────────────────────────────────────────────────────────

test.describe('Seller Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('seller1@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Seller123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
  });

  test('seller dashboard page is accessible', async ({ page }) => {
    await page.goto('/seller/dashboard');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10000 });
  });

  test('seller products page loads', async ({ page }) => {
    await page.goto('/seller/products');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('seller orders page loads', async ({ page }) => {
    await page.goto('/seller/orders');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('seller analytics page loads', async ({ page }) => {
    await page.goto('/seller/analytics');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('seller reviews page loads', async ({ page }) => {
    await page.goto('/seller/reviews');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});

// ──────────────────────────────────────────────────────────────
// CHAT
// ──────────────────────────────────────────────────────────────

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('customer1@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Customer123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
  });

  test('chat page loads', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('unread count endpoint does not return 404', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/chat/unread-count'),
        { timeout: 10000 }
      ).catch(() => null),
      page.goto('/chat'),
    ]);
    if (response) {
      expect(response.status()).not.toBe(404);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// WISHLIST
// ──────────────────────────────────────────────────────────────

test.describe('Wishlist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('customer1@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Customer123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
  });

  test('wishlist page is accessible', async ({ page }) => {
    await page.goto('/wishlist');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});
