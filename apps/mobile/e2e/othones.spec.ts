import { test, expect } from '@playwright/test';
import { navigateWithinApp, openTestVault } from './support/vault.js';

test.beforeEach(async ({ page }) => {
  await openTestVault(page);
});

/** Μία οθόνη της εφαρμογής με τη διαδρομή της και τα testid του συμβολαίου της. */
interface Othoni {
  readonly onoma: string;
  readonly ruta: string;
  /** Το testid της ίδιας της οθόνης. */
  readonly ekran: string;
  /** Αν η οθόνη είναι καρτέλα και φέρει την κάψουλα πλοήγησης. */
  readonly kapsouli: boolean;
}

/** Οι επτά βασικές οθόνες της εφαρμογής, με τα testid συμβόλαιά τους. */
const OTHONES: readonly Othoni[] = [
  {
    onoma: 'simera',
    ruta: '/simera',
    ekran: 'simera-ekran',
    kapsouli: true,
  },
  {
    onoma: 'mathimata',
    ruta: '/mathimata',
    ekran: 'mathimata-ekran',
    kapsouli: true,
  },
  {
    onoma: 'xartis',
    ruta: '/xartis',
    ekran: 'xartis-ekran',
    kapsouli: true,
  },
  {
    onoma: 'odigos',
    ruta: '/odigos/en-2',
    ekran: 'odigos-ekran',
    kapsouli: false,
  },
  {
    onoma: 'tutor',
    ruta: '/tutor',
    ekran: 'tutor-ekran',
    kapsouli: true,
  },
  {
    onoma: 'rythisies',
    ruta: '/rythisies',
    ekran: 'rythisies-ekran',
    kapsouli: true,
  },
  {
    onoma: 'proedri',
    ruta: '/proedri',
    ekran: 'proedri-ekran',
    kapsouli: false,
  },
];

const KAPSOULI_OTHONES = OTHONES.filter((othoni) => othoni.kapsouli);

/** Περιμένει να φορτωθεί η οθόνη: το κατάσταση φόρτωσης εξαφανίζεται και τα δεδομένα εμφανίζονται. */
async function perimene_na_fortothei(page: import('@playwright/test').Page, ekran: string) {
  await expect(page.getByTestId(ekran)).toBeVisible();
  await expect(page.getByTestId('katastasi-fortosi')).toBeHidden({ timeout: 10_000 });
}

for (const othoni of OTHONES) {
  test(`η οθόνη ${othoni.onoma} αποδίδεται`, async ({ page }) => {
    await navigateWithinApp(page, othoni.ruta);
    await perimene_na_fortothei(page, othoni.ekran);
  });
}

test('η κάψουλα πλοήγησης περιλαμβάνει τις βασικές καρτέλες', async ({ page }) => {
  const tab = KAPSOULI_OTHONES[0];
  if (tab === undefined) throw new Error('Δεν υπάρχουν καρτέλες πλοήγησης για έλεγχο.');
  await navigateWithinApp(page, tab.ruta);
  const capsule = page.getByTestId('kapsouli-navigisis').first();
  await expect(capsule).toBeVisible();
  for (const label of ['Σήμερα', 'Μαθήματα', 'Πρόγραμμα', 'Χάρτης', 'Tutor', 'Ρυθμίσεις']) {
    await expect(capsule.getByRole('link', { name: label })).toBeVisible();
  }
});
