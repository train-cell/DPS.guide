import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/** Η πρώτη παραπομπή του οδηγού «en-1» οδηγεί στο arx-1, σελίδα 3. */
const PROTI_PARAPOMPI_SELIDA = 3;

test('το tap σε παραπομπή ανοίγει το PDF στη σωστή σελίδα', async ({ page }) => {
  await page.goto('/odigos/en-1');
  const parapompi = page.getByTestId('odigos-parapompi').first();
  await expect(parapompi).toBeVisible();
  await parapompi.click();

  await expect(page).toHaveURL(new RegExp(`/provoli/arx-1/${PROTI_PARAPOMPI_SELIDA}$`));
  await expect(page.getByTestId('provoli-ekran')).toBeVisible();
  await expect(page.getByTestId('provoli-selida')).toHaveText(
    `Σελίδα ${PROTI_PARAPOMPI_SELIDA} από 30`
  );
});

test('ο καμβάς αποδίδει τη σελίδα με μη μηδενικό μέγεθος', async ({ page }) => {
  await page.goto('/provoli/arx-2/12');
  await expect(page.getByTestId('provoli-selida')).toHaveText('Σελίδα 12 από 36', {
    timeout: 15_000,
  });
  const diastaseis = await page.getByTestId('provoli-kanvas').evaluate((stoixeio) => {
    const kanvas = stoixeio as HTMLCanvasElement;
    return { platos: kanvas.width, ypsos: kanvas.height };
  });
  expect(diastaseis.platos).toBeGreaterThan(0);
  expect(diastaseis.ypsos).toBeGreaterThan(0);
  await expect(page.getByTestId('provoli-sfalma-apostolis')).toBeHidden();
});

test('η πλοήγηση σελίδων σέβεται τα όρια του εγγράφου', async ({ page }) => {
  await page.goto('/provoli/arx-2/1');
  await expect(page.getByTestId('provoli-selida')).toHaveText('Σελίδα 1 από 36');

  await expect(page.getByTestId('provoli-proigoumeno')).toHaveAttribute('aria-disabled', 'true');
  await page.getByTestId('provoli-epomeno').click();
  await expect(page.getByTestId('provoli-selida')).toHaveText('Σελίδα 2 από 36');
  await expect(page.getByTestId('provoli-proigoumeno')).not.toHaveAttribute('aria-disabled', 'true');

  await page.goto('/provoli/arx-2/36');
  await expect(page.getByTestId('provoli-selida')).toHaveText('Σελίδα 36 από 36');
  await expect(page.getByTestId('provoli-epomeno')).toHaveAttribute('aria-disabled', 'true');
});

test('ζητούμενη σελίδα εκτός ορίων σφηνώνεται στο υπάρχον εύρος', async ({ page }) => {
  await page.goto('/provoli/arx-1/999');
  await expect(page.getByTestId('provoli-selida')).toHaveText('Σελίδα 30 από 30');
});

test('άγνωστο αρχείο δίνει κατάσταση σφάλματος, όχι λευκή οθόνη', async ({ page }) => {
  await page.goto('/provoli/den-yparxei/1');
  await expect(page.getByTestId('katastasi-sfalma')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('katastasi-sfalma')).toContainText('DEN_VRETHIKE');
});

test('αποθηκεύει εικόνα της προβολής', async ({ page }) => {
  await page.goto('/provoli/arx-1/3');
  await expect(page.getByTestId('provoli-selida')).toHaveText('Σελίδα 3 από 30');
  const oires_eikones = path.resolve(import.meta.dirname, 'screenshots');
  fs.mkdirSync(oires_eikones, { recursive: true });
  await page.screenshot({
    path: path.join(oires_eikones, 'provoli.png'),
    fullPage: true,
  });
});
