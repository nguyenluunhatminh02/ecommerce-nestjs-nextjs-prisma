import { expect, test } from '@playwright/test';

test('root category filter shows product cards', async ({ page }) => {
  await page.goto('/products?category=electronics');

  await expect(page.locator('main')).toContainText('Thêm vào giỏ', { timeout: 15000 });
  await expect(page.getByText('Không tìm thấy sản phẩm')).toHaveCount(0);
});

test('previously empty roots now show seeded inventory', async ({ page }) => {
  await page.goto('/products?category=books-stationery');

  await expect(page.locator('main')).toContainText('Thêm vào giỏ', { timeout: 15000 });
  await expect(page.getByText('Không tìm thấy sản phẩm')).toHaveCount(0);
});

test('customer can log in from the real backend', async ({ page }) => {
  await page.goto('/auth/login');

  await page.getByLabel('Email').fill('customer1@gmail.com');
  await page.getByLabel('Mật khẩu').fill('Customer123!');
  await page.getByRole('button', { name: /đăng nhập/i }).click();

  await page.waitForURL((url) => !url.pathname.includes('/auth/login'));
  await expect(page.getByText(/kênh người bán|blog|hỗ trợ/i).first()).toBeVisible();
});

test('customer can open a product detail page from category listing', async ({ page }) => {
  await page.goto('/products?category=electronics');

  const firstProductLink = page.locator('a[href^="/products/"]').first();
  await expect(firstProductLink).toBeVisible();
  await firstProductLink.click();

  await page.waitForURL(/\/products\//);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('button', { name: /^thêm vào giỏ hàng$/i })).toBeVisible();
});