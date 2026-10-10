import type { Apotelesma } from '../contracts/apotelesma.js';
import { apotyxia, ok } from '../helpers.js';
import { add_imeres, parse_meri } from '../imeres/index.js';

/** Κουτί Leitner: 1 (νέα/άγνωστη) έως 5 (κατοχυρωμένη). */
export type KoutiLeitner = 1 | 2 | 3 | 4 | 5;

/** Κατάσταση μάθησης μίας έννοιας. */
export interface KatastasiMathisis {
  ennoia: string;
  kouti: KoutiLeitner;
  epomeni_epanalipsi: string;
  sosta_seiri: number;
}

/** Διάστημα επανάληψης ανά κουτί σε ημέρες (υπόθεση εκκίνησης). */
const DIASTIMATA_LEITNER_IMERES: Record<KoutiLeitner, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

/** Μέγιστο κουτί: η κατοχυρωμένη έννοια δεν ανεβαίνει άλλο. */
const MEGISTO_KOUTI: KoutiLeitner = 5;

/** Κουτιά αδύναμων εννοιών (ο tutor εστιάζει εδώ). */
const ORIO_ASTHENOUS_KOUTIOU = 2;

/**
 * Αρχικοποιεί την κατάσταση μάθησης: κάθε έννοια στο κουτί 1 με επανάληψη αύριο.
 */
export function arxikopoiisi_mathisis(
  ennoies: string[],
  simera: string
): Apotelesma<KatastasiMathisis[]> {
  const meri = parse_meri(simera);
  if (meri === null) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρη ημερομηνία.');
  }
  const eidele = new Set<string>();
  for (const ennoia of ennoies) {
    if (ennoia.trim() === '' || eidele.has(ennoia)) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Κενή ή διπλότυπη έννοια.');
    }
    eidele.add(ennoia);
  }
  return ok(
    ennoies.map((ennoia) => ({
      ennoia,
      kouti: 1 as KoutiLeitner,
      epomeni_epanalipsi: add_imeres(meri, DIASTIMATA_LEITNER_IMERES[1]),
      sosta_seiri: 0,
    }))
  );
}

/**
 * Καταγράφει απάντηση ερώτησης: σωστή → κουτί +1 (cap 5)· λάθος → κουτί 1.
 *
 * Επιστρέφει νέα λίστα (χωρίς μετάλλαξη εισόδου) με ενημερωμένη την έννοια και
 * την επόμενη επανάληψη από το διάστημα του νέου κουτιού. Pure & deterministic.
 */
export function katagrafe_apotelesma(
  katastaseis: KatastasiMathisis[],
  ennoia: string,
  sosto: boolean,
  simera: string
): Apotelesma<KatastasiMathisis[]> {
  const meri = parse_meri(simera);
  if (meri === null) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρη ημερομηνία.');
  }
  if (!katastaseis.some((k) => k.ennoia === ennoia)) {
    return apotyxia('DEN_VRETHIKE', `Άγνωστη έννοια «${ennoia}».`);
  }
  return ok(
    katastaseis.map((katastasi) => {
      if (katastasi.ennoia !== ennoia) {
        return katastasi;
      }
      const neo_kouti: KoutiLeitner = sosto
        ? ((Math.min(MEGISTO_KOUTI, katastasi.kouti + 1) as KoutiLeitner))
        : (1 as KoutiLeitner);
      return {
        ennoia: katastasi.ennoia,
        kouti: neo_kouti,
        epomeni_epanalipsi: add_imeres(meri, DIASTIMATA_LEITNER_IMERES[neo_kouti]),
        sosta_seiri: sosto ? katastasi.sosta_seiri + 1 : 0,
      };
    })
  );
}

/**
 * Επιστρέφει τις αδύναμες έννοιες (κουτιά 1–2), ταξινομημένες, για τον tutor.
 */
export function asthenis_ennoies(katastaseis: KatastasiMathisis[]): string[] {
  return katastaseis
    .filter((k) => k.kouti <= ORIO_ASTHENOUS_KOUTIOU)
    .map((k) => k.ennoia)
    .sort((a, b) => a.localeCompare(b));
}
