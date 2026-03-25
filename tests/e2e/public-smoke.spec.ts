import { expect, test } from '@playwright/test';

test('landing page loads core public sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Crystalline Max', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: /services/i }).or(page.getByRole('button', { name: /services/i }))).toBeVisible();
});
