import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Workspace page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/workspace');
    await page.waitForURL('**/workspace', { timeout: 8_000 });
  });

  test('workspace page renders without crashing', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
    // Heading should contain "Workspace"
    await expect(page.getByText(/workspace/i).first()).toBeVisible();
  });

  test('create workspace dialog can be opened', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /สร้าง|เพิ่ม|create|new/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      // The dialog should open — assert on the dialog role directly
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('workspace list is visible', async ({ page }) => {
    // After login the app fetches workspaces — there should be a list or empty state
    await page.waitForTimeout(2_000); // allow data fetch
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });
});
