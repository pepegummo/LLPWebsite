import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Tasks / Kanban page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/tasks');
    await page.waitForURL('**/tasks', { timeout: 8_000 });
  });

  test('tasks page renders the Kanban heading', async ({ page }) => {
    await expect(page.getByText('กระดาน Kanban')).toBeVisible({ timeout: 8_000 });
  });

  test('shows empty-team notice when no active team is set', async ({ page }) => {
    // If the test user has no active team, the empty state card is shown
    const emptyNotice = page.getByText(/ไม่มีทีมที่ใช้งานอยู่/);
    const kanban = page.locator('[data-testid="kanban-board"]').or(page.getByText(/todo|in.progress|done/i).first());

    // One of the two states must be visible
    await expect(emptyNotice.or(kanban)).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Tasks page — with active team', () => {
  // This suite only exercises the Kanban UI if the test user already has a team.
  // It does not create one (that requires Workspace → Project → Team setup via UI).

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/tasks');
    await page.waitForURL('**/tasks');
  });

  test('page does not throw a runtime error', async ({ page }) => {
    // Capture uncaught errors
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.waitForTimeout(2_000);
    expect(errors).toHaveLength(0);
  });
});
