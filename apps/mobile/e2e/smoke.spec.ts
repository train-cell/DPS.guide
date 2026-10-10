import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const XROMA_FONTO = 'rgb(11, 11, 12)';

test('DPS.guide app renders and is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('efarmogi-etoimi')).toBeVisible();
  await expect(page.getByTestId('efarmogi-etoimi')).toHaveText('DPS.guide');
});

test('the app paints the dark background of the design system', async ({ page }) => {
  await page.goto('/');
  const xromaFonTou = await page.evaluate(() =>
    getComputedStyle(document.documentElement).backgroundColor
  );
  expect(xromaFonTou).toBe(XROMA_FONTO);

  const xromaKeimenou = await page.evaluate(() => getComputedStyle(document.body).color);
  expect(xromaKeimenou).toMatch(/^rgba?\(255,\s*255,\s*255/);
});

test('capture full-page screenshot at iPhone viewport', async ({ page }) => {
  await page.goto('/');

  const screenshotsDir = path.resolve(import.meta.dirname, 'screenshots');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  await page.screenshot({
    path: path.join(screenshotsDir, 'efarmogi-etoimi.png'),
    fullPage: true,
  });
});
