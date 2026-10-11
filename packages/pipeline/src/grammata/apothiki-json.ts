/**
 * Πρόσβαση στα ports του `@dps/core`: μοναδικό σημείο που ξέρει πώς
 * διαβάζει/γράφει JSON στο `ApothikiPyli` και πώς υπολογίζει το `arxeio_id`.
 *
 * Κανόνας §5.3: `arxeio_id = sha256(kodikos_mathimatos + diadromi)`. Ο υπολογισμός
 * γίνεται ΜΕ ΤΗ ΣΥΝΑΡΤΗΣΗ `sha256_heks` του `@dps/ai` (ίδια σειρά κανονικοποίησης
 * με το `kleidi.ts`)· δεν αντιγράφεται.
 *
 * Δεν γίνεται import του `zod` εδώ: το `@dps/pipeline` δεν έχει το zod ως άμεση
 * εξάρτηση (απαγορεύεται να πειχθεί το `package.json`). Χρησιμοποιούνται ΜΟΝΟ τα
 * ήδη εξαγόμενα σχήματα του frozen `@dps/core`.
 */

import type {
  ApothikiPyli,
  Apotelesma,
  Arxeio,
  Mathima,
  Perigramma,
  Selida,
  XartisMathimatos,
} from '@dps/core';
import {
  ArxeioSchema,
  MathimaSchema,
  PerigrammaSchema,
  SelidaSchema,
  XartisMathimatosSchema,
  apotyxia,
  ok,
} from '@dps/core';
import { katharise_arxi, sha256_heks } from '@dps/ai';
import {
  ARXEIO_MATHIMATON,
  arxeio_eurethriou,
  arxeio_keimenou,
  arxeio_perigrammatos,
  arxeio_xarti,
  me_riza,
} from '../statheroi.js';

/** Το τμήμα επικύρωσης ενός στοιχείου JSON (ένα από τα frozen schemas του core). */
export interface SximaJSON<T> {
  safeParse(timi: unknown): { success: true; data: T } | { success: false; error: unknown };
}

/**
 * Αναγνωριστικό αρχείου: sha256 του κανονικοποιημένου `kodikos_mathimatos + diadromi`
 * (§5.3). Σταθερό, ανεξάρτητο από το περιεχόμενο.
 */
export function ftiaxe_arxeio_id(kodikos_mathimatos: string, kanonikopiemeni_diadromi: string): string {
  return sha256_heks(katharise_arxi(kodikos_mathimatos + kanonikopiemeni_diadromi));
}

/** Γράφει JSON σε σταθερή, επιθεωρήσιμη μορφή (2 κενά + τελική νεαγράμμη). */
export function parade_json(timi: unknown): string {
  return `${JSON.stringify(timi, null, 2)}\n`;
}

/**
 * Γράφει JSON στο `ApothikiPyli` (η `grapse_keimeno` του port είναι atomic).
 * Επιστρέφει το σφάλμα του port, χωρίς εξαίρεση.
 */
export async function grapse_json(
  apothiki: ApothikiPyli,
  diadromi: string,
  timi: unknown
): Promise<Apotelesma<void>> {
  return apothiki.grapse_keimeno(diadromi, parade_json(timi));
}

/** Γενικός αναγνώστης JSON με επικύρωση, χωρίς διάχυση εξαιρέσεων. */
export async function diavase_json<T>(
  apothiki: ApothikiPyli,
  diadromi: string,
  sxima: SximaJSON<T>,
  etiketa: string
): Promise<Apotelesma<T>> {
  const gram = await apothiki.diavase_keimeno(diadromi);
  if (!gram.ok) {
    return gram;
  }
  const anagnosmeno = analysise_json(gram.timi, etiketa);
  if (!anagnosmeno.ok) {
    return anagnosmeno;
  }
  const checked = sxima.safeParse(anagnosmeno.timi);
  if (!checked.success) {
    return apotyxia('MI_EGKYRO_SXIMA', `Το αρχείο ${etiketa} δεν ταιριάζει με το σχήμα του`, checked.error);
  }
  return ok(checked.data);
}

/** Λίστα JSON με επικύρωση κάθε στοιχείου (π.χ. `Mathima[]`). */
export async function diavase_json_lista<T>(
  apothiki: ApothikiPyli,
  diadromi: string,
  sxima: SximaJSON<T>,
  etiketa: string
): Promise<Apotelesma<T[]>> {
  const gram = await apothiki.diavase_keimeno(diadromi);
  if (!gram.ok) {
    return gram;
  }
  const anagnosmeno = analysise_json(gram.timi, etiketa);
  if (!anagnosmeno.ok) {
    return anagnosmeno;
  }
  if (!Array.isArray(anagnosmeno.timi)) {
    return apotyxia('MI_EGKYRO_SXIMA', `Το αρχείο ${etiketa} δεν είναι λίστα`);
  }
  const apotelesmata: T[] = [];
  for (const stoixeio of anagnosmeno.timi) {
    const checked = sxima.safeParse(stoixeio);
    if (!checked.success) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Στοιχείο της λίστας ${etiketa} δεν ταιριάζει με το σχήμα`,
        checked.error
      );
    }
    apotelesmata.push(checked.data);
  }
  return ok(apotelesmata);
}

/** Ανάγνωση JSON με μετατροπή εξαίρεσης σε `MI_EGKYRO_SXIMA` (ποτέ δεν διαφεύγει). */
export function analysise_json(periexomeno: string, etiketa: string): Apotelesma<unknown> {
  try {
    return ok(JSON.parse(periexomeno) as unknown);
  } catch (aitia) {
    return apotyxia('MI_EGKYRO_SXIMA', `Το αρχείο ${etiketa} δεν είναι έγκυρο JSON`, aitia);
  }
}

/** Αναγνώζει `mathimata.json` της ρίζας (§5.3). */
export function diavase_mathimata(apothiki: ApothikiPyli, riza: string): Promise<Apotelesma<Mathima[]>> {
  return diavase_json_lista(apothiki, me_riza(riza, ARXEIO_MATHIMATON), MathimaSchema, ARXEIO_MATHIMATON);
}

/** Αναγνώζει `eurethrio-arxeion.json` ενός μαθήματος (§5.3). */
export function diavase_arxeia(
  apothiki: ApothikiPyli,
  riza: string,
  kodikos_mathimatos: string
): Promise<Apotelesma<Arxeio[]>> {
  return diavase_json_lista(
    apothiki,
    me_riza(riza, arxeio_eurethriou(kodikos_mathimatos)),
    ArxeioSchema,
    'eurethrio-arxeion.json'
  );
}

/** Γράφει `eurethrio-arxeion.json` ενός μαθήματος (§5.3). */
export function grapse_arxeia(
  apothiki: ApothikiPyli,
  riza: string,
  kodikos_mathimatos: string,
  arxeia: Arxeio[]
): Promise<Apotelesma<void>> {
  return grapse_json(apothiki, me_riza(riza, arxeio_eurethriou(kodikos_mathimatos)), arxeia);
}

/** Αναγνώζει `keimeno/<arxeio_id>.json` (`Selida[]`, §5.3). */
export function diavase_keimeno(
  apothiki: ApothikiPyli,
  riza: string,
  kodikos_mathimatos: string,
  arxeio_id: string
): Promise<Apotelesma<Selida[]>> {
  return diavase_json(
    apothiki,
    me_riza(riza, arxeio_keimenou(kodikos_mathimatos, arxeio_id)),
    SelidaSchema.array(),
    `keimeno/${arxeio_id}.json`
  );
}

/** Αναγνώζει `perigrammata/<arxeio_id>.json` (§5.3). */
export function diavase_perigramma(
  apothiki: ApothikiPyli,
  riza: string,
  kodikos_mathimatos: string,
  arxeio_id: string
): Promise<Apotelesma<Perigramma>> {
  return diavase_json(
    apothiki,
    me_riza(riza, arxeio_perigrammatos(kodikos_mathimatos, arxeio_id)),
    PerigrammaSchema,
    `perigrammata/${arxeio_id}.json`
  );
}

/** Αναγνώζει `xartis.json` ενός μαθήματος (§5.3). */
export function diavase_xarti(
  apothiki: ApothikiPyli,
  riza: string,
  kodikos_mathimatos: string
): Promise<Apotelesma<XartisMathimatos>> {
  return diavase_json(
    apothiki,
    me_riza(riza, arxeio_xarti(kodikos_mathimatos)),
    XartisMathimatosSchema,
    'xartis.json'
  );
}