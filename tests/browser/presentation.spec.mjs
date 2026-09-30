import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
test('presentation has nine usable slides, local figures and no horizontal overflow', async ({
  page,
}) => {
  await page.goto(pathToFileURL(resolve('docs/presentation.html')).href);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('img').first()).toBeVisible();
  expect(
    await page
      .locator('img')
      .first()
      .evaluate((img) => img.complete && img.naturalWidth > 0),
  ).toBe(true);
  for (let i = 0; i < 9; i++) {
    await expect(page.locator('.slide.active')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (i < 8) await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Next slide', exact: true })).toBeDisabled();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#counter')).toContainText('8 / 9');
});
