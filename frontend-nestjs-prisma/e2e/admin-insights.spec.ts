import { expect, test } from '@playwright/test';

test.describe('Admin Insights Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as admin
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('admin@gmail.com');
    await page.getByLabel('Mật khẩu').fill('Admin123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 });
  });

  test('audit logs page loads and shows header', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await expect(page.getByText('Audit Logs')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('price alerts page loads and shows header', async ({ page }) => {
    await page.goto('/admin/price-alerts');
    await expect(page.getByText('Price Alerts')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('recently viewed page loads and shows header', async ({ page }) => {
    await page.goto('/admin/recently-viewed');
    await expect(page.getByText('Recently Viewed')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('recommendations page loads and shows header', async ({ page }) => {
    await page.goto('/admin/recommendations');
    await expect(page.getByText('ML Recommendations')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('recommendations page shows engine info cards', async ({ page }) => {
    await page.goto('/admin/recommendations');
    await expect(page.getByText('Collaborative Filtering')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Content-Based Filtering')).toBeVisible();
    await expect(page.getByText('Co-occurrence Matrix')).toBeVisible();
    await expect(page.getByText('Trending Score')).toBeVisible();
  });

  test('sidebar has Insights section with new links', async ({ page }) => {
    await page.goto('/admin');
    const sidebar = page.locator('aside');
    await expect(sidebar.getByText('Insights')).toBeVisible({ timeout: 15000 });
  });
});
