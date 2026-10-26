import type { Enotita } from '../contracts/montela.js';
import type { KatastasiMathisis } from '../mathisi/index.js';
import type { Checkin } from '../programma/index.js';

/**
 * Συνοπτική εικόνα προόδου του χρήστη για υπολογισμό δεικτών επάρκειας (mastery).
 */
export interface ProodhosXristi {
  readonly aristeiesEnotiton?: readonly string[];
  readonly katastasiMathisis?: readonly KatastasiMathisis[];
  readonly checkins?: readonly Checkin[];
}

/** Προεπιλεγμένη διάρκεια ενότητας αν δεν ορίζεται εκτίμηση. */
const PROEPILOGI_LEPTON_EKTIMISIS = 30;

/**
 * Υπολογίζει το ποσοστό ετοιμότητας/επάρκειας (mastery score) [0-100] ανά ενότητα.
 *
 * Συνδυάζει:
 * 1. Χρόνο μελέτης και κατάσταση ολοκλήρωσης από τα check-ins και τις καταγεγραμμένες αριστείες.
 * 2. Επίπεδο κατανόησης εννοιών από το κουτί Leitner/FSRS (1: 20% έως 5: 100%).
 *
 * 100% pure deterministic συνάρτηση (50/50 boundary).
 */
export function ypologise_katastasi_mastery(
  enotites: Enotita[],
  checkins: Checkin[],
  proodos: ProodhosXristi
): Record<string, number> {
  const apotelesma: Record<string, number> = {};

  const aristeies = new Set(proodos.aristeiesEnotiton ?? []);
  const olaCheckins = [...checkins, ...(proodos.checkins ?? [])];

  const katastaseisMathisisMap = new Map<string, KatastasiMathisis>();
  for (const km of proodos.katastasiMathisis ?? []) {
    katastaseisMathisisMap.set(km.ennoia, km);
  }

  for (const enotita of enotites) {
    const enotitaCheckins = olaCheckins.filter((c) => c.enotita_id === enotita.id);
    const synolikaLepta = enotitaCheckins.reduce(
      (athr, c) => athr + (Number.isFinite(c.pragmatika_lepta) && c.pragmatika_lepta > 0 ? c.pragmatika_lepta : 0),
      0
    );

    const einaiOlokliromeni =
      aristeies.has(enotita.id) || enotitaCheckins.some((c) => c.oloklirothike);

    const ektimisi =
      enotita.lepta_ektimisi !== null &&
      Number.isFinite(enotita.lepta_ektimisi) &&
      enotita.lepta_ektimisi > 0
        ? enotita.lepta_ektimisi
        : PROEPILOGI_LEPTON_EKTIMISIS;

    const posostoXronou = einaiOlokliromeni
      ? 1.0
      : Math.min(1.0, synolikaLepta / ektimisi);

    let posostoLeitner = posostoXronou;
    if (enotita.ennoies && enotita.ennoies.length > 0) {
      let athroismaEnnoion = 0;
      for (const ennoia of enotita.ennoies) {
        const kat = katastaseisMathisisMap.get(ennoia);
        if (kat) {
          // Κουτί 1 -> 0.2, Κουτί 2 -> 0.4, ..., Κουτί 5 -> 1.0
          const koutiKlasma = Math.max(1, Math.min(5, kat.kouti)) / 5;
          athroismaEnnoion += koutiKlasma;
        } else {
          // Η έννοια δεν έχει μελετηθεί ακόμη σε quiz
          athroismaEnnoion += einaiOlokliromeni ? 0.2 : 0;
        }
      }
      posostoLeitner = athroismaEnnoion / enotita.ennoies.length;
    }

    const telikoKlasma =
      enotita.ennoies && enotita.ennoies.length > 0
        ? 0.5 * posostoXronou + 0.5 * posostoLeitner
        : posostoXronou;

    const vathmos = Math.max(0, Math.min(100, Math.round(telikoKlasma * 100)));
    apotelesma[enotita.id] = vathmos;
  }

  return apotelesma;
}
