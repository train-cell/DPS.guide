import type { Apotelesma } from '../contracts/apotelesma.js';
import { apotyxia, ok } from '../helpers.js';

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

const PATTERN_IMEROMINIAS = /^(\d{4})-(\d{2})-(\d{2})$/;
const MILLIS_ANA_IMERA = 86_400_000;

/** Ελέγχει `YYYY-MM-DD` με πραγματικό ημερολόγιο. */
function egkyri_imerominia(imerominia: string): boolean {
  const match = PATTERN_IMEROMINIAS.exec(imerominia);
  if (match === null) {
    return false;
  }
  const etos = Number.parseInt(match[1] ?? '', 10);
  const minas = Number.parseInt(match[2] ?? '', 10);
  const imera = Number.parseInt(match[3] ?? '', 10);
  const elegxos = new Date(Date.UTC(etos, minas - 1, imera));
  return (
    elegxos.getUTCFullYear() === etos &&
    elegxos.getUTCMonth() === minas - 1 &&
    elegxos.getUTCDate() === imera
  );
}

/** Προσθέτει ημέρες ημερολογιακά (απρόσβλητο από DST). */
function add_imeres(imerominia: string, imeres: number): string {
  const match = PATTERN_IMEROMINIAS.exec(imerominia) ?? [];
  const millis = Date.UTC(
    Number.parseInt(match[1] ?? '1970', 10),
    Number.parseInt(match[2] ?? '01', 10) - 1,
    Number.parseInt(match[3] ?? '01', 10)
  );
  return new Date(millis + imeres * MILLIS_ANA_IMERA).toISOString().slice(0, 10);
}

/**
 * Αρχικοποιεί την κατάσταση μάθησης: κάθε έννοια στο κουτί 1 με επανάληψη αύριο.
 */
export function arxikopoiisi_mathisis(
  ennoies: string[],
  simera: string
): Apotelesma<KatastasiMathisis[]> {
  if (!egkyri_imerominia(simera)) {
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
      epomeni_epanalipsi: add_imeres(simera, DIASTIMATA_LEITNER_IMERES[1]),
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
  if (!egkyri_imerominia(simera)) {
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
        epomeni_epanalipsi: add_imeres(simera, DIASTIMATA_LEITNER_IMERES[neo_kouti]),
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
