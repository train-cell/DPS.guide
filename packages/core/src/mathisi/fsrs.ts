import { add_imeres, parse_meri } from '../imeres/index.js';

/**
 * Κατάσταση μνήμης FSRS-4 (Free Spaced Repetition Scheduler v4).
 */
export interface FsrsKatastasi {
  readonly stability: number;
  readonly difficulty: number;
  readonly reps: number;
  readonly lapses: number;
  readonly lastReview: string;
}

/**
 * Βαθμολογία αξιολόγησης επανάληψης:
 * 1 / 'xana' = Again (αποτυχία ανάκλησης / lapse)
 * 2 / 'diskolo' = Hard (δύσκολη ανάκληση)
 * 3 / 'kalo' = Good (επιτυχής κανονική ανάκληση)
 * 4 / 'efkolo' = Easy (εύκολη ανάκληση)
 */
export type FsrsVathmologiaArithmos = 1 | 2 | 3 | 4;
export type FsrsVathmologiaEtiketa = 'xana' | 'diskolo' | 'kalo' | 'efkolo';
export type FsrsVathmologia = FsrsVathmologiaArithmos | FsrsVathmologiaEtiketa;

/**
 * Αποτέλεσμα υπολογισμού FSRS για την επόμενη επανάληψη.
 */
export interface FsrsApotelesma {
  readonly epomeni_imerominia: string;
  readonly nea_katastasi: FsrsKatastasi;
  readonly diastima_imeron: number;
}

/** Προεπιλεγμένες παράμετροι FSRS-4 (17 συντελεστές βαρών W). */
export const PROEPILOGMENA_VARH_FSRS: readonly number[] = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
];

/** Επιστρέφει με ασφάλεια τύπων τον συντελεστή βάρους w[index]. */
function pare_baros(index: number): number {
  return PROEPILOGMENA_VARH_FSRS[index] ?? 1.0;
}

/** Ελάχιστη επιτρεπόμενη δυσκολία (D_min). */
export const ELAXISTI_DYSKOLIA = 1.0;

/** Μέγιστη επιτρεπόμενη δυσκολία (D_max). */
export const MEGISTI_DYSKOLIA = 10.0;

/** Ελάχιστη επιτρεπόμενη σταθερότητα (S_min). */
export const ELAXISTI_STATHEROTITA = 0.1;

/**
 * Μετατρέπει είτε αριθμητική είτε λεκτική βαθμολογία σε FsrsVathmologiaArithmos (1..4).
 */
export function metatropi_vathmologias(vathmos: FsrsVathmologia): FsrsVathmologiaArithmos {
  if (typeof vathmos === 'number') {
    if (vathmos >= 1 && vathmos <= 4) {
      return vathmos as FsrsVathmologiaArithmos;
    }
    return 3;
  }
  switch (vathmos) {
    case 'xana':
      return 1;
    case 'diskolo':
      return 2;
    case 'kalo':
      return 3;
    case 'efkolo':
      return 4;
    default:
      return 3;
  }
}

/**
 * Περιορίζει τη δυσκολία στο διάστημα [1.0, 10.0].
 */
function periorise_dyskolia(d: number): number {
  return Math.max(ELAXISTI_DYSKOLIA, Math.min(MEGISTI_DYSKOLIA, d));
}

/**
 * Δημιουργεί την αρχική κατάσταση FSRS για μία νέα έννοια ή κάρτα.
 */
export function arxiki_katastasi_fsrs(tora?: Date): FsrsKatastasi {
  const imerominia = (tora ?? new Date()).toISOString().slice(0, 10);
  return {
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    lastReview: imerominia,
  };
}

/**
 * Υπολογίζει την ανακλησιμότητα (retrievability R) με βάση το νόμο δύναμης (Power Law) του FSRS-4:
 * R(t, S) = (1 + t / (9 * S))^(-1)
 *
 * Όταν t = S, τότε R = (1 + 1/9)^(-1) = 0.9 (90% επιθυμητή διατήρηση).
 */
export function ypologise_retrievability(katastasi: FsrsKatastasi, imeres_apo_teleftea: number): number {
  const s = katastasi.stability;
  const t = Math.max(0, imeres_apo_teleftea);
  if (s <= 0) {
    return t === 0 ? 1.0 : 0.0;
  }
  const r = 1 / (1 + t / (9 * s));
  return Math.max(0, Math.min(1, r));
}

/**
 * Υπολογίζει την επόμενη επανάληψη και την ενημερωμένη κατάσταση FSRS-4.
 * 100% pure deterministic math (50/50 boundary).
 */
export function ypologise_epomeni_epanalipsi_fsrs(
  katastasi: FsrsKatastasi,
  vathmos: FsrsVathmologia,
  tora?: Date
): FsrsApotelesma {
  const g = metatropi_vathmologias(vathmos);
  const simeraDate = tora ?? new Date();
  const simeraStr = simeraDate.toISOString().slice(0, 10);

  let nea_stability: number;
  let nea_difficulty: number;
  let nea_reps: number;
  let nea_lapses: number;

  if (katastasi.reps === 0) {
    // Πρώτη αξιολόγηση (First Review)
    nea_stability = Math.max(ELAXISTI_STATHEROTITA, pare_baros(g - 1));
    nea_difficulty = periorise_dyskolia(pare_baros(4) - (g - 3) * pare_baros(5));
    nea_reps = 1;
    nea_lapses = g === 1 ? 1 : 0;
  } else {
    // Επαναληπτική αξιολόγηση (Subsequent Review)
    let imeres_perasan = 0;
    const proigoumeno = parse_meri(katastasi.lastReview);
    const simera = parse_meri(simeraStr);
    if (proigoumeno !== null && simera !== null) {
      const millisProig = Date.UTC(proigoumeno.etos, proigoumeno.minas - 1, proigoumeno.imera);
      const millisSimera = Date.UTC(simera.etos, simera.minas - 1, simera.imera);
      imeres_perasan = Math.max(0, Math.round((millisSimera - millisProig) / 86_400_000));
    }

    const d = katastasi.difficulty;
    const s = Math.max(ELAXISTI_STATHEROTITA, katastasi.stability);
    const r = ypologise_retrievability(katastasi, imeres_perasan);

    // Ενημέρωση δυσκολίας με μέση επαναφορά (mean reversion προς w[4])
    const w4 = pare_baros(4);
    const w6 = pare_baros(6);
    const w7 = pare_baros(7);
    nea_difficulty = periorise_dyskolia(w7 * w4 + (1 - w7) * (d - w6 * (g - 3)));
    nea_reps = katastasi.reps + 1;

    if (g === 1) {
      // Lapse (Αποτυχία / Again)
      nea_lapses = katastasi.lapses + 1;
      const w11 = pare_baros(11);
      const w12 = pare_baros(12);
      const w13 = pare_baros(13);
      const w14 = pare_baros(14);
      const s_lapse = w11 * Math.pow(nea_difficulty, -w12) * (Math.pow(s + 1, w13) - 1) * Math.exp(w14 * (1 - r));
      nea_stability = Math.max(ELAXISTI_STATHEROTITA, Math.min(s, s_lapse));
    } else {
      // Recall Success (Hard = 2, Good = 3, Easy = 4)
      nea_lapses = katastasi.lapses;
      let bonus = 1.0;
      if (g === 2) {
        bonus = pare_baros(15); // hard penalty
      } else if (g === 4) {
        bonus = pare_baros(16); // easy bonus
      }
      const w8 = pare_baros(8);
      const w9 = pare_baros(9);
      const w10 = pare_baros(10);
      const parontis = Math.exp(w8) * (11 - nea_difficulty) * Math.pow(s, -w9) * (Math.exp((1 - r) * w10) - 1) * bonus;
      nea_stability = Math.max(s, s * (1 + parontis));
    }
  }

  // Υπολογισμός διαστήματος ημερών (για επιθυμητή διατήρηση 90%, interval = S)
  let diastima_imeron: number;
  if (g === 1) {
    diastima_imeron = 1;
  } else {
    diastima_imeron = Math.max(1, Math.round(nea_stability));
  }

  const meriSimera = parse_meri(simeraStr) ?? {
    etos: simeraDate.getUTCFullYear(),
    minas: simeraDate.getUTCMonth() + 1,
    imera: simeraDate.getUTCDate(),
  };
  const epomeni_imerominia = add_imeres(meriSimera, diastima_imeron);

  const nea_katastasi: FsrsKatastasi = {
    stability: Number(nea_stability.toFixed(4)),
    difficulty: Number(nea_difficulty.toFixed(4)),
    reps: nea_reps,
    lapses: nea_lapses,
    lastReview: simeraStr,
  };

  return {
    epomeni_imerominia,
    nea_katastasi,
    diastima_imeron,
  };
}
