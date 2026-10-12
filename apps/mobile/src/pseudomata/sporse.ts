import type { ApothikiPyli, Arxeio, Parapompi } from '@dps/core';
import { pare_xarti_mathimatos, pseudos_mathimata, pseudos_xartis } from './pseudomata.js';
import { pseudos_odigos_md, pseudos_synomilia_jsonl } from './odigos-md.js';
import { analise_parapompi } from '../provoli-pdf/parapompi.js';
import { PROEDAFO_TEMPLATE } from '../programma/programma-vohthia.js';
import { LEKIKIA_TMIMATON } from '../ypiresies/odigos.js';
import { ftiaxe_synthetiko_pdf } from '../provoli-pdf/synthetiko-pdf.js';

/** Κωδικός μαθήματος του σετ δείγματος, όπως τον γνωρίζει και ο ψεύτικος χάρτης. */
export const KODIKOS_DEIGMATOS = 'ΠΛΗ201';

/** Όλα τα μαθήματα του δείγματος (§5.3). */
export const MATHIMATA_DEIGMATOS = ['ΠΛΗ201', 'ΠΛΗ101', 'ΠΛΗ302', 'ΠΛΗ204'] as const;

/** Σελίδες του συνθετικού arx-1: καλύπτει όλες τις παραπομπές των ψεύτικων οδηγών. */
export const SELIDES_ARX_1 = 30;

/** Σελίδες του συνθετικού arx-2: καλύπτει όλες τις παραπομπές των ψεύτικων οδηγών. */
export const SELIDES_ARX_2 = 36;

/** Έκδοση prompt του σετ δείγματος, ώστε το cache να έχει αυθεντική τιμή και όχι κενό. */
export const EKDOSI_PROMPT_DEIGMATOS = 'deigma-v1';

/** Όνομα μοντέλου που γράφεται στα μεταδεδομένα των ψεύτικων οδηγών. */
export const MONTELO_DEIGMATOS = 'deigma-topiko';

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

/** Το ευρετήριο ενός μαθήματος δείγματος, με τα ίδια πεδία του συμβολαίου Arxeio. */
function eurethrio_deigmatos(kodikos: string = KODIKOS_DEIGMATOS): Arxeio[] {
  const diadromi_1 = `${kodikos}/arxeia/syntheta/arx-1.pdf`;
  const diadromi_2 = `${kodikos}/arxeia/syntheta/arx-2.pdf`;
  return [diadromi_1, diadromi_2].map((diadromi, i) => ({
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

/** Συγκεντρώνει τις παραπομπές όλων των τμημάτων ενός ψεύτικου οδηγού, χωρίς διπλότυπα. */
function parapompes_deigmatos(enotita_id: string, kodikos?: string): Parapompi[] {
  const md = pseudos_odigos_md(enotita_id, kodikos);
  if (md === null) {
    return [];
  }
  const parapompes: Parapompi[] = [];
  for (const grammi of md.split(/\r?\n/)) {
    const analise = analise_parapompi(grammi);
    if (analise === null || parapompes.some((p) => p.arxeio_id === analise.arxeio_id && p.selida === analise.apo)) {
      continue;
    }
    parapompes.push({ arxeio_id: analise.arxeio_id, selida: analise.apo });
  }
  return parapompes;
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
 * ρυθμίσεις, λίστα μαθημάτων, ψεύτικος χάρτης, οδηγοί (md + meta), ιστορικά tutor,
 * ευρετήριο αρχείων και συνθετικά PDF για ΟΛΑ τα 4 μαθήματα. Καλείται ΜΟΝΟ από ψεύτικο περιβάλλον
 * (periballon.deigma), ώστε πραγματική αποθήκευση συσκευής να μην δεχτεί ποτέ
 * ψεύτικα αρχεία. Οι υπάρχουσες εγγραφές δεν αγγίζονται.
 */
export async function sporse_deigma(apothiki: ApothikiPyli): Promise<void> {
  await grapse_an_leipei(apothiki, DIADROMI_RYTHMISEON, JSON.stringify({
    baseUrl: 'https://thales.cs.unipi.gr',
    mathimataSynch: ['ΠΛΗ201', 'ΠΛΗ101', 'ΠΛΗ204'],
    onomaMontelou: 'gemini-2.5-flash',
    exeiKleidiLlm: false,
    onomasApothikefsis: 'Documents/DPS.guide',
    einaiEidopoieseis: true,
    exetaseis: [
      { kodikos_mathimatos: KODIKOS_DEIGMATOS, imerominia: '2027-01-18', tropos: 'kleista_vivlia' },
    ],
    arxiExetastikis: '2027-01-11',
    templateLepton: PROEDAFO_TEMPLATE,
    overridesLepton: [{ imerominia: '2027-01-09', lepta: 45 }],
  }, null, 2));
  await grapse_an_leipei(apothiki, DIADROMI_MATHIMATON, JSON.stringify(pseudos_mathimata(), null, 2));

  for (const kodikos of MATHIMATA_DEIGMATOS) {
    const xartis = pare_xarti_mathimatos(kodikos);
    await grapse_an_leipei(apothiki, `${kodikos}/.spoudes/xartis.json`, JSON.stringify(xartis, null, 2));

    for (const enotita of xartis.enotites) {
      const md = pseudos_odigos_md(enotita.id, kodikos);
      if (md !== null) {
        await grapse_an_leipei(
          apothiki,
          `${kodikos}/.spoudes/odigoi/${enotita.id}.md`,
          md
        );
        await grapse_an_leipei(
          apothiki,
          `${kodikos}/.spoudes/odigoi/${enotita.id}.meta.json`,
          JSON.stringify(
            {
              enotita_id: enotita.id,
              parapompes: parapompes_deigmatos(enotita.id, kodikos),
              montelo: MONTELO_DEIGMATOS,
              ekdosi_prompt: EKDOSI_PROMPT_DEIGMATOS,
              hash_eisodou: `deigma-${enotita.id}`,
              proeidopoiiseis: [],
            },
            null,
            2
          )
        );
      }
      const synomilia = pseudos_synomilia_jsonl(enotita.id, kodikos);
      if (synomilia !== null) {
        await grapse_an_leipei(
          apothiki,
          `${kodikos}/.spoudes/synomilies/${enotita.id}.jsonl`,
          synomilia
        );
      }
    }

    await grapse_an_leipei(apothiki, `${kodikos}/.spoudes/eurethrio-arxeion.json`, JSON.stringify(eurethrio_deigmatos(kodikos), null, 2));
    await grapse_dyadiko_an_leipei(apothiki, `${kodikos}/arxeia/syntheta/arx-1.pdf`, ftiaxe_synthetiko_pdf(SELIDES_ARX_1));
    await grapse_dyadiko_an_leipei(apothiki, `${kodikos}/arxeia/syntheta/arx-2.pdf`, ftiaxe_synthetiko_pdf(SELIDES_ARX_2));
  }
}

/** Οι κωδικοί των τμημάτων που γράφονται σε κάθε ψεύτικο οδηγό, για τους ελέγχους του σπόρου. */
export const KLIDIA_TMIMATON_DEIGMATOS = LEKIKIA_TMIMATON;
