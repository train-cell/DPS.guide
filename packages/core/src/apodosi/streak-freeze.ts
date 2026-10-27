/**
 * Μονάδα Streak Freeze & Micro-Habit Vault.
 *
 * Παρέχει καθαρό μαθηματικό υπολογισμό streak, αυτόματη αναγνώριση κινδύνου διακοπής,
 * διαχείριση παγωμάτων (freeze tokens) και μηχανισμό 2-minute rapid blitz quiz διάσωσης.
 */

export interface KatastasiStreak {
  readonly trexwnStreak: number;
  readonly megistoStreak: number;
  readonly xrisimopoihmenaTokens: number;
  readonly diathesimaTokens: number;
  readonly kindynosDiakopis: boolean;
  readonly pagwmenesHmerominies: readonly string[];
  readonly teleutaiaImeraMeletis?: string;
}

export type EidosEnergeiasStreak = 'pagwma_hmeras' | 'rapid_blitz_diasosi';

export interface EnergeiaStreakFreeze {
  readonly eidos: EidosEnergeiasStreak;
  readonly hmerominiaIso: string;
  readonly epityxia?: boolean;
}

export interface ApotelesmaYpologismouStreak {
  readonly trexwnStreak: number;
  readonly megistoStreak: number;
  readonly xrisimopoihmenaTokens: number;
  readonly kindynosDiakopis: boolean;
}

const MILLIS_ANA_IMERA = 86_400_000;

/**
 * Μετατρέπει ημερομηνία YYYY-MM-DD σε UTC milliseconds.
 */
function iso_se_utc_millis(iso: string): number {
  const parts = iso.split('-').map(Number);
  const etos = parts[0] ?? 1970;
  const minas = parts[1] ?? 1;
  const imera = parts[2] ?? 1;
  return Date.UTC(etos, minas - 1, imera);
}

/**
 * Προσθέτει (ή αφαιρεί αν είναι αρνητικό) ημέρες σε ISO ημερομηνία.
 */
function prosthesi_imeron(iso: string, imeres: number): string {
  const millis = iso_se_utc_millis(iso);
  return new Date(millis + imeres * MILLIS_ANA_IMERA).toISOString().slice(0, 10);
}

/**
 * Υπολογίζει το τρέχον streak, το μέγιστο ιστορικό streak, την κατανάλωση freeze tokens
 * και αν υφίσταται άμεσος κίνδυνος διακοπής του streak.
 */
export function ypologise_streak_me_pagwma(
  hmerominiesMeletis: readonly string[],
  pagwmata: readonly string[],
  simeraIso: string,
  diathesimaTokens: number
): ApotelesmaYpologismouStreak {
  const meletiSet = new Set(hmerominiesMeletis);
  const pagwmaSet = new Set(pagwmata);

  if (meletiSet.size === 0 && pagwmaSet.size === 0) {
    return {
      trexwnStreak: 0,
      megistoStreak: 0,
      xrisimopoihmenaTokens: 0,
      kindynosDiakopis: false,
    };
  }

  let kindynosDiakopis = false;
  let toraIso: string | null = null;
  let xrisimopoihmenaTokens = 0;

  const meletiseSimera = meletiSet.has(simeraIso);
  const pagwseSimera = pagwmaSet.has(simeraIso);

  if (meletiseSimera || pagwseSimera) {
    toraIso = simeraIso;
    kindynosDiakopis = false;
  } else {
    // Σήμερα δεν έχει καταγραφεί μελέτη ή πάγωμα
    const xthesIso = prosthesi_imeron(simeraIso, -1);
    const meletiseXthes = meletiSet.has(xthesIso);
    const pagwseXthes = pagwmaSet.has(xthesIso);

    if (meletiseXthes || pagwseXthes) {
      toraIso = xthesIso;
      kindynosDiakopis = true;
    } else if (diathesimaTokens > 0) {
      // Ελέγχουμε αν υπάρχει προηγούμενη μελέτη για να σωθεί με freeze token για το χθες
      const proxxthesIso = prosthesi_imeron(simeraIso, -2);
      if (meletiSet.has(proxxthesIso) || pagwmaSet.has(proxxthesIso)) {
        toraIso = xthesIso;
        xrisimopoihmenaTokens = 1;
        kindynosDiakopis = true;
      }
    }
  }

  const olesOiImeres = Array.from(new Set([...hmerominiesMeletis, ...pagwmata])).sort();
  const elaxisthImeraMillis =
    olesOiImeres.length > 0 && olesOiImeres[0] !== undefined
      ? iso_se_utc_millis(olesOiImeres[0])
      : null;

  let trexwnStreak = 0;

  if (toraIso !== null && elaxisthImeraMillis !== null) {
    let cur = toraIso;
    // Αν το χθες παγώθηκε αυτόματα με token
    if (xrisimopoihmenaTokens > 0) {
      trexwnStreak = 1;
      cur = prosthesi_imeron(cur, -1);
    }

    const megistoOrioElegxou = 3650;
    let bima = 0;

    while (bima < megistoOrioElegxou) {
      bima++;
      const curMillis = iso_se_utc_millis(cur);
      if (curMillis < elaxisthImeraMillis) {
        break;
      }

      const einaiMeleti = meletiSet.has(cur);
      const einaiPagwma = pagwmaSet.has(cur);

      if (einaiMeleti || einaiPagwma) {
        trexwnStreak++;
      } else {
        if (xrisimopoihmenaTokens < diathesimaTokens) {
          xrisimopoihmenaTokens++;
          trexwnStreak++;
        } else {
          break;
        }
      }

      cur = prosthesi_imeron(cur, -1);
    }
  }
  let megistoStreak = trexwnStreak;
  let trexonHistoriko = 0;
  let proigoumeniImera: string | null = null;

  for (const imera of olesOiImeres) {
    if (proigoumeniImera === null) {
      trexonHistoriko = 1;
    } else {
      const epomeniExpected = prosthesi_imeron(proigoumeniImera, 1);
      if (imera === epomeniExpected) {
        trexonHistoriko++;
      } else {
        trexonHistoriko = 1;
      }
    }
    proigoumeniImera = imera;
    if (trexonHistoriko > megistoStreak) {
      megistoStreak = trexonHistoriko;
    }
  }

  return {
    trexwnStreak,
    megistoStreak: Math.max(megistoStreak, trexwnStreak),
    xrisimopoihmenaTokens,
    kindynosDiakopis,
  };
}

/**
 * Υπολογίζει την αναπροσαρμογή κατάστασης streak μετά από 2-minute rapid blitz quiz.
 */
export function ypologise_diasosi_streak_blitz(
  epityxiaQuiz: boolean,
  simeraIso: string,
  trexousaKatastasi: KatastasiStreak
): KatastasiStreak {
  if (!epityxiaQuiz) {
    return {
      ...trexousaKatastasi,
      kindynosDiakopis: true,
    };
  }

  const neoStreak =
    trexousaKatastasi.teleutaiaImeraMeletis === simeraIso
      ? trexousaKatastasi.trexwnStreak
      : trexousaKatastasi.trexwnStreak + 1;

  return {
    ...trexousaKatastasi,
    trexwnStreak: neoStreak,
    megistoStreak: Math.max(trexousaKatastasi.megistoStreak, neoStreak),
    kindynosDiakopis: false,
    teleutaiaImeraMeletis: simeraIso,
  };
}
