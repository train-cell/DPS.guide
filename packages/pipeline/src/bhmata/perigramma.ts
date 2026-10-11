/**
 * Βήμα 5 (§4): περίγραμμα αρχείου με το prompt P1 → `perigrammata/<arxeio_id>.json`.
 *
 * Το κείμενο κόβεται σε κομμάτια ΜΕ ΤΗ ΣΥΝΑΡΤΗΣΗ `kopse_se_kommatia` του `@dps/ai`
 * (όρια `MAX_SELIDES_ANA_KLISI` / `MAX_XARAKTIRES_ANA_KLISI` του §7.1) και τα μερικά
 * περιγράμματα ενώνονται με τη `synenose_merika_perigrammata` (δεν αντιγράφονται).
 * Η επικύρωση/επισκευή είναι η `epikyrose_perigramma` του frozen core (L03).
 *
 * Η κρυφή μνήμη ΔΕΝ γράφεται εδώ: η ροή καλεί το `LlmPyli` που έχει ήδη δοθεί, το
 * οποίο ο καλούν τυλίγει με το `me_cache` του `@dps/ai`.
 */

import type { Apotelesma, Perigramma, Selida } from '@dps/core';
import { kopse_se_kommatia, prompt_perigrammatos, synenose_merika_perigrammata } from '@dps/ai';
import { apotyxia, ok } from '@dps/core';
import { epikyrose_perigramma } from '@dps/core/src/epikyrosi/index.js';
import type { EisodosPipeline } from '../porte.js';
import { THERMOKRASIA_PERIGRAMMA, arxeio_perigrammatos, me_riza } from '../statheroi.js';
import { diavase_keimeno, grapse_json } from '../grammata/apothiki-json.js';
import { vres_mathima_apo_arxeio } from '../grammata/ves.js';
import type { IparastypotisProodou } from '../grammata/proodos.js';
import { proodos } from '../grammata/proodos.js';

/**
 * Βήμα 5: περίγραμμα ενός αρχείου (LLM, ανά αρχείο, με hash εισόδου από το cache).
 *
 * ΥΠΟΓΡΑΦΗ ΣΥΜΒΑΤΗ ΠΡΟΣ ΤΑ ΠΙΣΩ: `(p, arxeio_id)` — χωρίς κωδικό μαθήματος·
 * το μάθημα εντοπίζεται από το `mathimata.json` (`vres_mathima_apo_arxeio`).
 * Η επαναχρησιμοποιήσιμη παραλλαγή με ρητό κωδικό είναι `perigramma_mathimatos`.
 */
export async function perigramma(
  p: EisodosPipeline,
  arxeio_id: string,
  parastypotis?: IparastypotisProodou
): Promise<Apotelesma<Perigramma>> {
  const kodikos_mathimatos = await vres_mathima_apo_arxeio(p, arxeio_id);
  if (!kodikos_mathimatos.ok) {
    return kodikos_mathimatos;
  }
  return perigramma_mathimatos(p, kodikos_mathimatos.timi, arxeio_id, parastypotis);
}

/** Παραλλαγή με ρητό κωδικό μαθήματος (αποφεύγει τον εντοπισμό όταν ήδηξέρουμε). */
export async function perigramma_mathimatos(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  arxeio_id: string,
  parastypotis?: IparastypotisProodou
): Promise<Apotelesma<Perigramma>> {
  const selides = await diavase_keimeno(p.apothiki, p.riza, kodikos_mathimatos, arxeio_id);
  if (!selides.ok) {
    p.katagrafi.sfalma('perigramma: το εξαγόμενο κείμενο δεν διαβάστηκε', {
      kodikos: selides.sfalma.kodikos,
      kodikos_mathimatos,
      arxeio_id,
    });
    return selides;
  }
  if (selides.timi.length === 0) {
    p.katagrafi.proeidopoiisi('perigramma: το αρχείο δεν έχει σελίδες', {
      kodikos_mathimatos,
      arxeio_id,
    });
    return apotyxia('DEN_VRETHIKE', `Το αρχείο ${arxeio_id} δεν έχει σελίδες για περίγραμμα`);
  }

  const report = proodos(p, parastypotis, 'perigramma', selides.timi.length);
  const merkika: Perigramma[] = [];
  const kommatia = kopse_se_kommatia(selides.timi);

  for (let i = 0; i < kommatia.length; i += 1) {
    const kommati = kommatia[i] as Selida[];
    const arithmos = i + 1;
    const apotelesma = await perigramma_kommatiou(
      p,
      kodikos_mathimatos,
      arxeio_id,
      kommati,
      arithmos,
      kommatia.length,
      selides.timi.length
    );
    if (!apotelesma.ok) {
      report(arithmos, `απέτυχε το κομμάτι ${arithmos} από ${kommatia.length}`, false);
      return apotelesma;
    }
    merkika.push(apotelesma.timi);
    report(arithmos, `ολοκληρώθηκε το κομμάτι ${arithmos} από ${kommatia.length}`);
  }

  const synenomeno = synenose_merika_perigrammata(merkika);
  if (!synenomeno.ok) {
    report(kommatia.length, synenomeno.sfalma.minima, false);
    return synenomeno;
  }

  const diadromi = me_riza(p.riza, arxeio_perigrammatos(kodikos_mathimatos, arxeio_id));
  const grapse = await grapse_json(p.apothiki, diadromi, synenomeno.timi);
  if (!grapse.ok) {
    p.katagrafi.sfalma('perigramma: απέτυχε η εγγραφή', {
      kodikos: grapse.sfalma.kodikos,
      kodikos_mathimatos,
      arxeio_id,
    });
    return grapse;
  }
  return ok(synenomeno.timi);
}

/** Καλεί το P1 για ΕΝΑ κομμάτι σελίδων και το επικυρώνει με το frozen core (L03). */
async function perigramma_kommatiou(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  arxeio_id: string,
  kommati: Selida[],
  arithmos: number,
  synolo: number,
  arithmos_selidon: number
): Promise<Apotelesma<Perigramma>> {
  const aitisi = prompt_perigrammatos({
    arxeio_id,
    titlos: kodikos_mathimatos,
    selides: kommati,
    kommati: { arithmos, synolo },
  });
  const apantisi = await p.llm.parage_json({
    systima: aitisi.sistima,
    xristis: aitisi.xristis,
    sxima: aitisi.sisma,
    ekdosi_prompt: aitisi.ekdosi_prompt,
    thermokrasia: THERMOKRASIA_PERIGRAMMA,
  });
  if (!apantisi.ok) {
    p.katagrafi.sfalma('perigramma: το μοντέλο απέτυχε', {
      kodikos: apantisi.sfalma.kodikos,
      kodikos_mathimatos,
      arxeio_id,
    });
    return apantisi;
  }

  const epikyrommeno = epikyrose_perigramma(apantisi.timi, arithmos_selidon);
  if (!epikyrommeno.ok) {
    p.katagrafi.sfalma('perigramma: το περίγραμμα δεν πέρασε την επικύρωση', {
      kodikos_mathimatos,
      arxeio_id,
      minima: epikyrommeno.sfalma.minima,
    });
    return epikyrommeno;
  }

  for (const proeidopoiisi of epikyrommeno.timi.proeidopoiiseis) {
    p.katagrafi.proeidopoiisi(`perigramma: ${proeidopoiisi}`, { kodikos_mathimatos, arxeio_id });
  }

  // Το μοντέλο μπορεί να αλλάξει το `arxeio_id`· το κλειδί αποθήκευσης είναι δικό μας.
  return ok({ ...epikyrommeno.timi.perigramma, arxeio_id });
}

/** Αναγνώζει τα `keimeno/<arxeio_id>.json` ενός μαθήματος για ένα συγκεκριμένο αρχείο. */
export async function fere_keimeno_arxeiou(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  arxeio_id: string
): Promise<Apotelesma<Selida[]>> {
  return diavase_keimeno(p.apothiki, p.riza, kodikos_mathimatos, arxeio_id);
}