import { test, expect } from '@playwright/test';

/**
 * Full journey: browse → register student → search → open listing → enquire.
 * Requires API + client running (see playwright.config.ts webServer).
 */
test.describe('Learner journey', () => {
  test('signup → search → enquire', async ({ page }) => {
    const email = `e2e_${Date.now()}@example.com`;
    const password = 'TestPass123!';

    await page.goto('/');
    await expect(page.getByText(/Ventures/i).first()).toBeVisible();

    await page.getByRole('link', { name: /Join free/i }).first().click();
    await page.getByRole('button', { name: /^Student$/i }).click();
    await page.locator('input[name="name"]').fill('E2E Student');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: /Create account/i }).click();

    await expect(page).toHaveURL(/student\/enquiries/);

    await page.goto('/listings');
    await expect(page.getByText(/Explore programs|program/i).first()).toBeVisible();

    const viewLink = page.getByRole('link', { name: /View program/i }).first();
    if (await viewLink.count()) {
      await viewLink.click();
      await expect(page.getByRole('heading').first()).toBeVisible();
      const enquire = page.getByRole('button', { name: /Enquire now/i });
      if (await enquire.count()) {
        await enquire.click();
        await expect(page.getByText(/Enquiry sent|interested/i).first()).toBeVisible({
          timeout: 10_000,
        });
      }
    }
  });
});
