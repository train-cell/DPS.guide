import type { ApothikiPyli, Arxeio } from '@dps/core';
import { pseudos_mathimata, pseudos_xartis } from './pseudomata.js';
import { ftiaxe_synthetiko_pdf } from '../provoli-pdf/synthetiko-pdf.js';

/** Κωδικός μαθήματος του σετ δείγματος, όπως τον γνωρίζει και ο ψεύτικος χάρτης. */
export const KODIKOS_DEIGMATOS = 'ΠΛΗ201';

/** Σελίδες του συνθετικού arx-1: καλύπτει όλες τις παραπομπές των ψεύτικων οδηγών. */
export const SELIDES_ARX_1 = 30;

/** Σελίδες του συνθετικού arx-2: καλύπτει όλες τις παραπομπές των ψεύτικων οδηγών. */
export const SELIDES_ARX_2 = 36;

/** Διαδρομή του αρχείου ρυθμίσεων στο layout §5.3. */
const DIADROMI_RYTHMISEON = 'rythmiseis.json';

/** Διαδρομή της λίστας μαθημάτων στο layout §5.3. */
const DIADROMI_MATHIMATON = 'mathimata.json';

/** Διαδρομή του χάρτη ενοτήτων στο κρυφό φάκελο του μαθήματος. */
const DIADROMI_XARTI = `${KODIKOS_DEIGMATOS}/.spoudes/xartis.json`;

/** Διαδρομή του ευρετηρίου αρχείων στο κρυφό φάκελο του μαθήματος. */
const DIADROMI_EURETHRIOU = `${KODIKOS_DEIGMATOS}/.spoudes/eurethrio-arxeion.json`;

/** Διαδρομή του συνθετικού πρώτου αρχείου μέσα στον φάκελο arxeia/. */
const DIADROMI_ARX_1 = `${KODIKOS_DEIGMATOS}/arxeia/syntheta/arx-1.pdf`;

/** Διαδρομή του συνθετικού δεύτερου αρχείου μέσα στον φάκελο arxeia/. */
const DIADROMI_ARX_2 = `${KODIKOS_DEIGMATOS}/arxeia/syntheta/arx-2.pdf`;

/** Το ευρετήριο του σετ δείγματος, με τα ίδια πεδία του συμβολαίου Arxeio. */
function eurethrio_deigmatos(): Arxeio[] {
  const kodikos = KODIKOS_DEIGMATOS;
  return [DIADROMI_ARX_1, DIADROMI_ARX_2].map((diadromi, i) => ({
    id: `arx-${i + 1}`,
    kodikos_mathimatos: kodikos,
    diadromi,
    url: `https://thales.cs.unipi.gr/courses/${kodikos}/${diadromi.split('/').pop()}`,
    megethos: null,
    imerominia: null,
    etag: null,
    sha256: null,
    diplotypo_tou: 'pdf',
  }));
}

/** Γράφει ένα αρχείο κειμένου μόνο όταν δεν υπάρχει ήδη, ώστε ο σπόρος να μην σβήνει προοδική δουλειά. */
async function grapse_an_leipei(
  apothiki: ApothikiPyli,
  diadromi: string,
  periexomeno: string
): Promise<void> {
  if (await apothiki.yparxei(diadromi)) {
    return;
  }
  await apothiki.grapse_keimeno(diadromi, periexomeno);
}

/** Γράφει δυαδικό αρχείο μόνο όταν δεν υπάρχει ήδη, με τον ίδιο κανόνα προστασίας. */
async function grapse_dyadiko_an_leipei(
  apothiki: ApothikiPyli,
  diadromi: string,
  dedomena: Uint8Array
): Promise<void> {
  if (await apothiki.yparxei(diadromi)) {
    return;
  }
  await apothiki.grapse_dyadiko(diadromi, dedomena);
}

/**
 * Σπέρνει το σετ δείγματος στη θύρα αποθήκευσης, ακολουθώντας το layout §5.3:
 * ρυθμίσεις, λίστα μαθημάτων, ψεύτικος χάρτης, ευρετήριο αρχείων και δύο συνθετικά PDF.
 * Καλείται ΜΟΝΟ από ψεύτικο περιβάλλον (periballon.deigma), ώστε πραγματική αποθήκευση
 * συσκευής να μην δεχτεί ποτέ ψεύτικα αρχεία. Οι υπάρχουσες εγγραφές δεν αγγίζονται.
 */
export async function sporse_deigma(apothiki: ApothikiPyli): Promise<void> {
  await grapse_an_leipei(apothiki, DIADROMI_RYTHMISEON, JSON.stringify({
    baseUrl: 'https://thales.cs.unipi.gr',
    mathimataSynch: [KODIKOS_DEIGMATOS],
    onomaMontelou: 'gemini-2.5-flash',
    exeiKleidiLlm: false,
    onomasApothikefsis: 'Documents/DPS.guide',
    einaiEidopoieseis: true,
  }, null, 2));
  await grapse_an_leipei(apothiki, DIADROMI_MATHIMATON, JSON.stringify(pseudos_mathimata(), null, 2));
  await grapse_an_leipei(apothiki, DIADROMI_XARTI, JSON.stringify(pseudos_xartis(), null, 2));
  await grapse_an_leipei(apothiki, DIADROMI_EURETHRIOU, JSON.stringify(eurethrio_deigmatos(), null, 2));
  await grapse_dyadiko_an_leipei(apothiki, DIADROMI_ARX_1, ftiaxe_synthetiko_pdf(SELIDES_ARX_1));
  await grapse_dyadiko_an_leipei(apothiki, DIADROMI_ARX_2, ftiaxe_synthetiko_pdf(SELIDES_ARX_2));
}
