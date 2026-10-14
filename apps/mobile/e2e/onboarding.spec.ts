import { test, expect } from '@playwright/test';
import { openTestVault } from './support/vault.js';

test('το κάτω κουμπί ολοκληρώνει το onboarding και ανοίγει την εφαρμογή', async ({ page }) => {
  await openTestVault(page);

  const next = page.getByTestId('onboarding-epomeno-koumpi');
  await next.click();
  await expect(page.getByText('Βήμα 2 από 4 • Επιλογή Ιδρύματος')).toBeVisible();
  await next.click();
  await expect(page.getByText('Βήμα 3 από 4 • Σύνδεση & Διαπιστευτήρια')).toBeVisible();
  await next.click();
  await expect(page.getByText('Βήμα 4 από 4 • Ολοκλήρωση & Επισκόπηση')).toBeVisible();
  await next.click();

  await expect(page).toHaveURL(/\/simera$/);
  await expect(page.getByTestId('simera-ekran')).toBeVisible();
});
