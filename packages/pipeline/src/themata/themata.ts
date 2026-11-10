/**
 * Βήμα T3 (§4): ανάλυση θεμάτων (παλιά θέματα) → `apodosi.json`.
 *
 * Το `<KODIKOS>/themata/` είναι ο φάκελος που ρίχνει ο χρήστης τα PDF των
 * παλιών θεμάτων (§5.3). Η ροή:
 *
 * 1. `ftiaxe_analysi_thematon`: διαβάζει τα PDF του φακέλου, εξάγει το κείμενο
 *    (εξαγωγή ή OCR) και καλεί το LLM για την αντιστοίχιση κάθε ερώτησης.
 * 2. `antistoihisi_tematices_eotisis`: καλεί το LLM με το P5 και δέχεται
 *    `AntistoixisiThematos[]` (ενότητα + μονάδες).
 * 3. `ypologise_apodosi` (frozen core, T3): αθροίζει τις μονάδες ανά ενότητα.
 *
 * Η αντιστοίχιση (NLP) είναι το LLM· ο υπολογισμός είναι 100% deterministic
 * (50/50 boundary, §2 D4).
 */

import type {
  Apotelesma,
  AntistoixisiThematos,
  Enotita,
} from '@dps/core';
import { apotyxia, ok, ypologise_apodosi } from '@dps/core';
import { z } from 'zod';
import type { AitisiPrompt } from '@dps/ai';
import { enotita_se_keimeno, perivale_dedomena } from '@dps/ai';
import type { EisodosPipeline } from '../porte.js';
import { arxeio_apodosis, diadromi_thematon, me_riza, THERMOKRASIA_ODIGOU } from '../statheroi.js';
import { ektekseven_arxeio } from '../grammata/diadromes.js';
import { diavase_xarti, grapse_json } from '../grammata/apothiki-json.js';

/** Έκδοση του prompt P5 (αντιστοίχιση θεμάτων, αυξάνει σε κάθε αλλαγή κειμένου). */
export const EKDOSI_PROMPT_P5 = 'p5@1';

/** Ελάχιστος αριθμός μονάδων που δέχεται η LLM ανά ερώτηση. */
export const ELAXISTES_MONADES = 0;
/** Μέγιστος αριθμός μονάδων που δέχεται η LLM ανά ερώτηση. */
export const MEGISTES_MONADES = 20;

/**
 * Είσοδος για την αντιστοίχιση ερωτήσεων παλιού θέματος σε ενότητες.
 *
 * Το κείμενο είναι ολόκληρου του PDF (όλες οι σελίδες), με τις ερωτήσεις
 * να έχουν αριθμηθεί από την εξαγωγή κειμένου.
 */
export interface EisodosAntistoihisis {
  /** Κείμενο του θέματος (PDF), αθροισμένο από όλες τις σελίδες. */
  keimeno: string;
  /** Λίστα ενοτήτων του μαθήματος (id + τίτλος) για την αντιστοίχιση. */
  enotites: { id: string; titlos: string }[];
}

/** Σχήμα εξόδου της αντιστοίχισης: ερώτηση → ενότητα με μονάδες. */
export const AntistoixisiThematosSchema = z.array(
  z.object({
    enotita_id: z.string(),
    monades: z.number(),
  })
);
export type AntistoixisiThematosApotelesma = z.infer<typeof AntistoixisiThematosSchema>;

/**
 * Πλαίσιο του P5: πώς ταιριάζει κάθε ερώτηση σε ενότητα μονάδων.
 *
 * Το LLM πρέπει να βασίζεται ΜΟΝΟ στο κείμενο του θέματος (κανόνας 9:
 * ποτέ επινοημένο περιεχόμενο) και να χρησιμοποιεί ids ενοτήτων του
 * χάρτη, ποτέ επινοημένα ids.
 */
export function prompt_antistoihisis_thematos(aitisi: EisodosAntistoihisis): AitisiPrompt<AntistoixisiThematos[]> {
  const sistima =
    enotita_se_keimeno('Ρόλος', [
      'Είσαι βοηθός βαθμολόγησης. Αποδίδεις κάθε ερώτηση παλιού θέματος σε μια ενότητα του χάρτη μελέτης και της δίνεις μονάδες.',
      'Μόνο το κείμενο που σου δίνεται είναι αλήθεια. Αν δεν βρεις αντιστοίχιση, αγνοείς την ερώτηση.',
      'Χρησιμοποιείς μόνο ids ενοτήτων από τον πίνακα «Ενότητες του μαθήματος». Ποτέ επινοημένα ids.',
      'Οι μονάδες είναι ολόκληρος αριθμός ή ημίση (π.χ. 2.5), μέσα στο εύρος 0–20.',
    ]) +
    enotita_se_keimeno('Ενότητες του μαθήματος', [
      ...aitisi.enotites.map((e) => `- id: ${e.id}, τίτλος: ${e.titlos}`),
    ]);

  const xristis = enotita_se_keimeno('Κείμενο θέματος', [perivale_dedomena(aitisi.keimeno)]);

  return {
    sistima,
    xristis,
    sisma: AntistoixisiThematosSchema,
    ekdosi_prompt: EKDOSI_PROMPT_P5,
  };
}

/**
 * Καλεί το LLM για την αντιστοίχιση του θέματος σε ενότητες (P5).
 *
 * Επιστρέφει `AntistoixisiThematos[]`· σε σφάλμα επιστρέφεται `Apotelesma`
 * με `Sfalma` — ποτέ ψεύτικο περιεχόμενο.
 */
export async function antistoihisi_tematices_eotisis(
  p: EisodosPipeline,
  aitisi: EisodosAntistoihisis
): Promise<Apotelesma<AntistoixisiThematos[]>> {
  const aitisi_prompt = prompt_antistoihisis_thematos(aitisi);

  const apantisi = await p.llm.parage_json({
    systima: aitisi_prompt.sistima,
    xristis: aitisi_prompt.xristis,
    sxima: aitisi_prompt.sisma,
    ekdosi_prompt: aitisi_prompt.ekdosi_prompt,
    thermokrasia: THERMOKRASIA_ODIGOU,
  });
  if (!apantisi.ok) {
    return apotyxia(apantisi.sfalma.kodikos, `Η αντιστοίχιση του θέματος απέτυχε: ${apantisi.sfalma.minima}`);
  }

  const antistoixiseis = apantisi.timi;
  for (const antistoixisi of antistoixiseis) {
    const exists = aitisi.enotites.some((e) => e.id === antistoixisi.enotita_id);
    if (!exists) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Η αντιστοίχιση περιέχει άγνωστο id ενότητας «${antistoixisi.enotita_id}»`
      );
    }
    if (antistoixisi.monades < ELAXISTES_MONADES || antistoixisi.monades > MEGISTES_MONADES) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Οι μονάδες ${antistoixisi.monades} είναι εκτός εύρους ${ELAXISTES_MONADES}–${MEGISTES_MONADES}`
      );
    }
  }
  return ok(antistoixiseis);
}

/**
 * Εξάγει το κείμενο ενός PDF του φακέλου `themata/` — εξαγωγή κειμένου με
 * επιφύλαξη OCR για σελίδες χωρίς στρώμα κειμένου.
 */
async function exagage_keimeno_thematos(
  p: EisodosPipeline,
  diadromi: string,
  onoma_arxeiou: string
): Promise<Apotelesma<string>> {
  const dedomena = await p.apothiki.diavase_dyadiko(diadromi);
  if (!dedomena.ok) {
    return dedomena;
  }

  const { exagage_pdf } = await import('@dps/extract');
  const selides = await exagage_pdf(dedomena.timi, onoma_arxeiou);
  if (!selides.ok) {
    return selides;
  }

  if (p.ocr === undefined) {
    const keimeno = selides.timi.map((s) => s.keimeno).join('\n');
    return ok(keimeno.trim());
  }

  // Επιφύλαξη OCR: μόνο σελίδες χωρίς κείμενο.
  const keimeno: string[] = [];
  for (const selida of selides.timi) {
    if (!selida.xoris_keimeno) {
      keimeno.push(selida.keimeno);
      continue;
    }
    const recognized = await p.ocr.anagnorise_pdf_selida(dedomena.timi, selida.arithmos);
    if (!recognized.ok) {
      return apotyxia(recognized.sfalma.kodikos, `Το τοπικό OCR απέτυχε: ${recognized.sfalma.minima}`);
    }
    const text = recognized.timi.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (text.length === 0) continue;
    keimeno.push(text);
  }
  return ok(keimeno.join('\n').trim());
}

/**
 * Βήμα T3: αναλύει όλα τα θέματα (PDF) ενός μαθήματος και γράφει το
 * `apodosi.json` — αθροιστική απόδοση ανά ενότητα.
 *
 * Idempotent: αν το `apodosi.json` υπάρχει ήδη, το βήμα το επιστρέφει χωρίς
 * νέα κλήση LLM.
 */
export async function ftiaxe_analysi_thematon(
  p: EisodosPipeline,
  kodikos_mathimatos: string
): Promise<Apotelesma<Record<string, number>>> {
  const diadromi_apodosis = me_riza(p.riza, arxeio_apodosis(kodikos_mathimatos));
  const uparxei_apodosi = await p.apothiki.yparxei(diadromi_apodosis);
  if (uparxei_apodosi) {
    const keimeno = await p.apothiki.diavase_keimeno(diadromi_apodosis);
    if (!keimeno.ok) {
      p.katagrafi.sfalma('analysi_thematon: το υπάρχον apodosi.json δεν διαβάστηκε', {
        kodikos_mathimatos,
      });
      return keimeno;
    }
    const anagnos = keimeno.timi.trim() === '' ? null : JSON.parse(keimeno.timi);
    if (anagnos === null || typeof anagnos !== 'object' || Array.isArray(anagnos)) {
      p.katagrafi.sfalma('analysi_thematon: το υπάρχον apodosi.json δεν είναι έγκυρο JSON', {
        kodikos_mathimatos,
      });
      return apotyxia('MI_EGKYRO_SXIMA', 'Το υπάρχον apodosi.json δεν είναι έγκυρο JSON.');
    }
    return ok(anagnos as Record<string, number>);
  }

  const themata = await p.apothiki.lista(diadromi_thematon(kodikos_mathimatos));
  if (!themata.ok) {
    p.katagrafi.sfalma('analysi_thematon: ο φάκελος themata/ δεν διαβάστηκε', {
      kodikos_mathimatos,
    });
    return themata;
  }

  const pdf_onomata: string[] = [];
  for (const diadromi of themata.timi) {
    if (ektekseven_arxeio(diadromi) === 'pdf') {
      pdf_onomata.push(diadromi);
    }
  }
  if (pdf_onomata.length === 0) {
    p.katagrafi.proeidopoiisi('analysi_thematon: δεν υπάρχουν PDF στον φάκελο themata/', {
      kodikos_mathimatos,
    });
    return ok({});
  }

  const xartis = await diavase_xarti(p.apothiki, p.riza, kodikos_mathimatos);
  if (!xartis.ok) {
    p.katagrafi.sfalma('analysi_thematon: ο χάρτης δεν διαβάστηκε', {
      kodikos_mathimatos,
    });
    return xartis;
  }
  const enotites: { id: string; titlos: string }[] = xartis.timi.enotites.map(
    (e: Enotita) => ({ id: e.id, titlos: e.titlos })
  );

  const all_antistoixiseis: AntistoixisiThematos[] = [];

  for (const diadromi of pdf_onomata) {
    // Το `lista` επιστρέφει πλήρεις διαδρομές (κλειδιά αποθήκης)· μόνο το όνομα
    // του αρχείου χρησιμοποιείται ως `arxeio_id` για την εξαγωγή.
    const onoma = diadromi.slice(diadromi.lastIndexOf('/') + 1);
    const keimeno = await exagage_keimeno_thematos(p, diadromi, onoma);
    if (!keimeno.ok) {
      p.katagrafi.sfalma('analysi_thematon: απέτυχε η εξαγωγή κειμένου του θέματος', {
        kodikos_mathimatos,
        onoma_arxeiou: onoma,
      });
      return keimeno;
    }
    if (keimeno.timi.length === 0) {
      p.katagrafi.proeidopoiisi('analysi_thematon: το θέμα είναι άδειο', {
        kodikos_mathimatos,
        onoma_arxeiou: onoma,
      });
      continue;
    }

    const antistoixisi = await antistoihisi_tematices_eotisis(p, {
      keimeno: keimeno.timi,
      enotites,
    });
    if (!antistoixisi.ok) {
      p.katagrafi.sfalma('analysi_thematon: απέτυχε η αντιστοίχιση του θέματος', {
        kodikos_mathimatos,
        onoma_arxeiou: onoma,
      });
      return antistoixisi;
    }
    all_antistoixiseis.push(...antistoixisi.timi);
    p.katagrafi.pliroforia('analysi_thematon: αντιστοιχίστηκε το θέμα', {
      kodikos_mathimatos,
      onoma_arxeiou: onoma,
      monades: antistoixisi.timi.length,
    });
  }

  const apodosi = ypologise_apodosi(all_antistoixiseis);
  if (!apodosi.ok) {
    p.katagrafi.sfalma('analysi_thematon: απέτυχε ο υπολογισμός της απόδοσης', {
      kodikos_mathimatos,
    });
    return apodosi;
  }

  const grapse = await grapse_json(p.apothiki, diadromi_apodosis, apodosi.timi);
  if (!grapse.ok) {
    p.katagrafi.sfalma('analysi_thematon: απέτυχε η εγγραφή της απόδοσης', {
      kodikos_mathimatos,
    });
    return grapse;
  }

  p.katagrafi.pliroforia('analysi_thematon: η ανάλυση θεμάτων ολοκληρώθηκε', {
    kodikos_mathimatos,
    themata: pdf_onomata.length,
    antistoixiseis: all_antistoixiseis.length,
  });
  return ok(apodosi.timi);
}
