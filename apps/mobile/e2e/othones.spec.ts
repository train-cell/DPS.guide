import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/** Μία οθόνη της εφαρμογής με τη διαδρομή της και τα testid του συμβολαίου της. */
interface Othoni {
  /** Όνομα οθόνης, που γίνεται και όνομα αρχείου εικόνας. */
  readonly onoma: string;
  readonly ruta: string;
  /** Το testid της ίδιας της οθόνης. */
  readonly ekran: string;
  /** Προαιρετικό testid περιεχομένου που εμφανίζεται μόνο μετά τη φόρτωση. */
  readonly peraisia?: string;
  /** Αν η οθόνη είναι καρτέλα και φέρει την κάψουλα πλοήγησης. */
  readonly kapsouli: boolean;
}

/** Οι επτά οθόνες της εφαρμογής, με τα testid συμβόλαιά τους. */
const OTHONES: readonly Othoni[] = [
  {
    onoma: 'simera',
    ruta: '/simera',
    ekran: 'simera-ekran',
    peraisia: 'simera-stochos',
    kapsouli: true,
  },
  {
    onoma: 'mathimata',
    ruta: '/mathimata',
    ekran: 'mathimata-ekran',
    peraisia: 'mathimata-karta',
    kapsouli: true,
  },
  {
    onoma: 'xartis',
    ruta: '/xartis',
    ekran: 'xartis-ekran',
    peraisia: 'xartis-enotita',
    kapsouli: true,
  },
  {
    onoma: 'odigos',
    ruta: '/odigos/en-2',
    ekran: 'odigos-ekran',
    peraisia: 'odigos-epikefalida',
    kapsouli: false,
  },
  {
    onoma: 'tutor',
    ruta: '/tutor',
    ekran: 'tutor-ekran',
    peraisia: 'tutor-imerologia',
    kapsouli: true,
  },
  {
    onoma: 'rythisies',
    ruta: '/rythisies',
    ekran: 'rythisies-ekran',
    peraisia: 'rythisies-seira-montelo',
    kapsouli: true,
  },
  {
    onoma: 'proedri',
    ruta: '/proedri',
    ekran: 'proedri-ekran',
    peraisia: 'proediri-syndeon',
    kapsouli: false,
  },
];

const KAPSOULI_OTHONES = OTHONES.filter((othoni) => othoni.kapsouli);

/** Περιμένει να φορτωθεί η οθόνη: το κατάσταση φόρτωσης εξαφανίζεται και τα δεδομένα εμφανίζονται. */
async function perimene_na_fortothei(page: import('@playwright/test').Page, ekran: string, peraisia?: string) {
  await expect(page.getByTestId(ekran)).toBeVisible();
  await expect(page.getByTestId('katastasi-fortosi')).toBeHidden({ timeout: 10_000 });
  if (peraisia !== undefined) {
    await expect(page.getByTestId(peraisia).first()).toBeVisible();
  }
}

for (const othoni of OTHONES) {
  test(`η οθόνη ${othoni.onoma} αποδίδεται`, async ({ page }) => {
    await page.goto(othoni.ruta);
    await perimene_na_fortothei(page, othoni.ekran, othoni.peraisia);
  });
}

test('η κάψουλα πλοήγησης εμφανίζεται σε κάθε καρτέλα', async ({ page }) => {
  for (const othoni of KAPSOULI_OTHONES) {
    await page.goto(othoni.ruta);
    await expect(page.getByTestId('kapsouli-navigisis')).toBeVisible();
  }
});

test('αποθηκεύει μία εικόνα για κάθε οθόνη', async ({ page }) => {
  const oires_eikones = path.resolve(import.meta.dirname, 'screenshots');
  fs.mkdirSync(oires_eikones, { recursive: true });

  for (const othoni of OTHONES) {
    await page.goto(othoni.ruta);
    await perimene_na_fortothei(page, othoni.ekran, othoni.peraisia);
    await page.screenshot({
      path: path.join(oires_eikones, `${othoni.onoma}.png`),
      fullPage: true,
    });
  }
});