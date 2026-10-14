import { expect, type Page } from '@playwright/test';

const TEST_MASTER_PASSWORD = 'dps-guide-e2e-master-password';

/** Creates a real, ephemeral encrypted vault through the same first-run UI as the user. */
export async function openTestVault(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες').fill(TEST_MASTER_PASSWORD);
  await page.getByLabel('Επιβεβαίωση κύριου κωδικού').fill(TEST_MASTER_PASSWORD);
  await page.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }).click();
  await page.getByRole('button', { name: 'Το αποθήκευσα — άνοιγμα εφαρμογής' }).click();
  await expect(page.getByTestId('proedri-ekran')).toBeVisible();
}

/** Changes routes without reloading the page, which correctly exercises in-app navigation. */
export async function navigateWithinApp(page: Page, route: string): Promise<void> {
  await page.evaluate((destination) => {
    window.history.pushState(null, '', destination);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
}
