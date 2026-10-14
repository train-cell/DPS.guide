import { expect, test } from '@playwright/test';
import { openTestVault } from './support/vault.js';

test('desktop PWA reopens its encrypted vault while offline', async ({ page, context }) => {
  await openTestVault(page);

  const details = await page.evaluate(async () => {
    const manifest = await fetch('/manifest.webmanifest').then((response) => response.json()) as {
      name?: string;
      display?: string;
      icons?: Array<{ src?: string; sizes?: string; type?: string; purpose?: string }>;
    };
    const registration = await navigator.serviceWorker.ready;
    const icons = await Promise.all(['/icon-192.png', '/icon-512.png'].map(async (path) => {
      const response = await fetch(path);
      const imageData = await response.arrayBuffer();
      const bytes = new DataView(imageData);
      const bitmap = await createImageBitmap(new Blob([imageData], { type: 'image/png' }));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const drawing = canvas.getContext('2d');
      if (!drawing) throw new Error('Canvas is not available to inspect the PWA icon.');
      drawing.drawImage(bitmap, 0, 0);
      const corner = Array.from(drawing.getImageData(0, 0, 1, 1).data);
      bitmap.close();
      return {
        status: response.status,
        type: response.headers.get('content-type'),
        width: bytes.getUint32(16),
        height: bytes.getUint32(20),
        corner,
      };
    }));
    return {
      name: manifest.name,
      display: manifest.display,
      manifestIcons: manifest.icons?.filter((icon) => icon.type === 'image/png'),
      icons,
      workerPath: registration.active === null ? '' : new URL(registration.active.scriptURL).pathname,
    };
  });
  expect(details).toEqual({
    name: 'DPS.guide',
    display: 'standalone',
    manifestIcons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    icons: [
      { status: 200, type: 'image/png', width: 192, height: 192, corner: [11, 11, 12, 255] },
      { status: 200, type: 'image/png', width: 512, height: 512, corner: [11, 11, 12, 255] },
    ],
    workerPath: '/sw.js',
  });

  // A controlled online reload lets the worker cache the built application assets before going offline.
  await page.reload();
  await expect(page.getByLabel('Κύριος κωδικός ή recovery key')).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null))
    .toContain('/sw.js');

  await context.setOffline(true);
  const offlineIcons = await page.evaluate(async () => Promise.all(
    ['/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'].map(async (path) =>
      (await fetch(path)).status),
  ));
  expect(offlineIcons).toEqual([200, 200, 200]);
  await page.reload();
  await page.getByLabel('Κύριος κωδικός ή recovery key').fill('dps-guide-e2e-master-password');
  await page.getByRole('button', { name: 'Ξεκλείδωμα' }).click();
  await expect(page.getByTestId('proedri-ekran')).toBeVisible();
});
