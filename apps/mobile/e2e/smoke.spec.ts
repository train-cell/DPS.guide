import { test, expect } from '@playwright/test';
import fs from 'fs';
import { openTestVault } from './support/vault.js';

const XROMA_FONTO = 'rgb(11, 11, 12)';

test.beforeEach(async ({ page }) => {
  await openTestVault(page);
});

test('DPS.guide app renders the default screen', async ({ page }) => {
  await expect(page.getByTestId('proedri-ekran')).toBeVisible();
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

test('capture full-page screenshot at iPhone viewport', async ({ page }, testInfo) => {
  const screenshotPath = testInfo.outputPath('efarmogi-etoimi.png');
  const screenshotsDir = testInfo.outputPath('');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
});
