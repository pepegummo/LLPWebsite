import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD } from './helpers/auth';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Multi' })).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login tab is active by default', async ({ page }) => {
    await page.goto('/login');
    // The active login tab has border-primary style
    const loginTab = page.getByRole('button', { name: /เข้าสู่ระบบ/ }).first();
    await expect(loginTab).toHaveClass(/text-primary/);
  });

  test('register tab switch shows register form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /สมัครสมาชิก/ }).first().click();
    await expect(page.locator('#reg-name')).toBeVisible();
    await expect(page.locator('#reg-email')).toBeVisible();
    await expect(page.locator('#reg-password')).toBeVisible();
  });

  test('shows error toast on wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', TEST_EMAIL);
    await page.fill('#login-password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Sonner toast appears
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 8_000 });
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', TEST_EMAIL);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('unauthenticated access to /dashboard redirects to /login', async ({ page }) => {
    // Each test gets a fresh context so localStorage is already empty.
    // Navigate directly — the layout guard should redirect unauthenticated users.
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 8_000 });
    expect(page.url()).toContain('/login');
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the eye button
    await page.locator('button[tabindex="-1"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Toggle back
    await page.locator('button[tabindex="-1"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
