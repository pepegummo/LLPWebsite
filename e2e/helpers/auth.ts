import { Page } from '@playwright/test';

/**
 * Credentials for the shared E2E test account.
 * Create this user once in your Supabase project and set the env vars:
 *   E2E_USER_EMAIL=...
 *   E2E_USER_PASSWORD=...
 * Or it will fall back to the defaults below (which must also exist in Supabase).
 */
export const TEST_EMAIL = process.env.E2E_USER_EMAIL ?? 'e2e@llp-test.local';
export const TEST_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'Test1234!';

/** Logs in via the /login page and waits for the dashboard. */
export async function loginAs(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}
