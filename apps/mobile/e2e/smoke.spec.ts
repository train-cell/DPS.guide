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

test('locks the vault when the browser app goes to the background', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  const credential = page.getByLabel('Κύριος κωδικός ή recovery key');
  await expect(credential).toBeVisible();
  await expect(page.getByTestId('proedri-ekran')).toHaveCount(0);

  await credential.fill('dps-guide-e2e-master-password');
  await page.getByRole('button', { name: 'Ξεκλείδωμα' }).click();
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

test('capture full-page screenshot at the browser viewport', async ({ page }, testInfo) => {
  const screenshotPath = testInfo.outputPath('efarmogi-etoimi.png');
  const screenshotsDir = testInfo.outputPath('');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
});
