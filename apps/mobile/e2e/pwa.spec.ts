import { expect, test } from '@playwright/test';
import { openTestVault } from './support/vault.js';

test('desktop PWA reopens its encrypted vault while offline', async ({ page, context }) => {
  await openTestVault(page);

  const details = await page.evaluate(async () => {
    const manifest = await fetch('/manifest.webmanifest').then((response) => response.json()) as {
      name?: string;
      display?: string;
    };
    const registration = await navigator.serviceWorker.ready;
    return {
      name: manifest.name,
      display: manifest.display,
      workerPath: registration.active === null ? '' : new URL(registration.active.scriptURL).pathname,
    };
  });
  expect(details).toEqual({ name: 'DPS.guide', display: 'standalone', workerPath: '/sw.js' });

  // A controlled online reload lets the worker cache the built application assets before going offline.
  await page.reload();
  await expect(page.getByLabel('Κύριος κωδικός ή recovery key')).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null))
    .toContain('/sw.js');

  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Κύριος κωδικός ή recovery key').fill('dps-guide-e2e-master-password');
  await page.getByRole('button', { name: 'Ξεκλείδωμα' }).click();
  await expect(page.getByTestId('proedri-ekran')).toBeVisible();
});
