import { expect, test } from '@playwright/test';

test('landing page loads core public sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('heading', { name: /automotive excellence/i })).toBeVisible();
  await expect(page.locator('section').first().getByRole('button', { name: /book now/i }).first()).toBeVisible();
  await expect(page.locator('section').first().getByRole('button', { name: /view services/i }).first()).toBeVisible();
});
