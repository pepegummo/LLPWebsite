import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('dashboard loads with sidebar and topbar', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    // Sidebar nav link for dashboard should be visible
    await expect(page.getByRole('link', { name: /แดชบอร์ด/ })).toBeVisible();
    // TopBar sticky bar is rendered (has a sticky header at the top of content)
    await expect(page.locator('.sticky.top-0')).toBeVisible();
  });

  test('navigates to /workspace', async ({ page }) => {
    await page.getByRole('link', { name: 'Workspace' }).click();
    await page.waitForURL('**/workspace', { timeout: 8_000 });
    expect(page.url()).toContain('/workspace');
  });

  test('navigates to /profile', async ({ page }) => {
    await page.getByRole('link', { name: /ข้อมูลส่วนตัว/ }).click();
    await page.waitForURL('**/profile', { timeout: 8_000 });
    expect(page.url()).toContain('/profile');
  });

  test('navigates to /notifications', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/notifications/);
    // Page should render without crashing
    await expect(page.locator('main')).toBeVisible();
  });

  test('sidebar collapse toggle works on mobile', async ({ page }) => {
    // Switch to mobile viewport and reload so React initializes with mobile sidebar state
    // (the layout useEffect sets sidebarOpen=false when innerWidth < 768)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');

    // Hamburger is md:hidden — visible below 768px
    const hamburger = page.getByRole('button', { name: /toggle sidebar/i });
    await expect(hamburger).toBeVisible({ timeout: 5_000 });

    // Open the sidebar
    await hamburger.click();

    // X close button inside sidebar should now be visible
    const closeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-x') });
    await expect(closeBtn).toBeVisible({ timeout: 3_000 });

    // Close the sidebar — sidebar uses translate-x, not display:none, so
    // check the aside class rather than button visibility
    await closeBtn.click();
    await expect(page.locator('aside')).toHaveClass(/-translate-x-full/, { timeout: 3_000 });
  });

  test('all main routes render without 404', async ({ page }) => {
    const routes = ['/dashboard', '/workspace', '/profile', '/notifications'];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible({ timeout: 8_000 });
      // Should not show a Next.js 404
      await expect(page.getByText('404')).not.toBeVisible();
    }
  });
});
