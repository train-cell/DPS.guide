import { test, expect } from '@playwright/test';
import { navigateWithinApp, openTestVault } from './support/vault.js';

test.beforeEach(async ({ page }) => {
  await openTestVault(page);
});

test('άγνωστο PDF δίνει σαφές σφάλμα αντί για λευκή οθόνη', async ({ page }) => {
  await navigateWithinApp(page, '/provoli/den-yparxei/1');

  await expect(page.getByTestId('provoli-ekran')).toBeVisible();
  await expect(page.getByTestId('provoli-epistrofi')).toBeVisible();
  await expect(page.getByTestId('katastasi-sfalma')).toBeVisible();
  await expect(page.getByTestId('katastasi-sfalma')).toContainText('DEN_VRETHIKE');
});
