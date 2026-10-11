import type { Apotelesma } from '@dps/core';
import { apotyxia } from '@dps/core';
import {
  ARKIKO_MIKROS_SIMIOLOU,
  KODIKOS_LANTHASMENIS_EISODOU,
  ONOMA_SEMEIAS_JSON,
  ONOMA_SEMEIAS_MONTELO,
  ONOMA_SEMEIAS_RIZA,
  ONOMA_SEMEIAS_VOITHEIA,
  PROSFOLI_SIMIOLOU,
  RIZA_PROEDROPIA,
  SEMA_VOITHEIA,
  SEMA_VOITHEIA_MIKRI,
  SYMBOLO_ISTOTIMIAS,
  SYMBOLO_SIMIO,
  TELOS_ORIARGON,
} from './statheroi-argv.js';

/** Θέση του ονόματος της εντολής μέσα στη λίστα των θετικών ορισμάτων. */
const THESI_ONOMATOS_ENTOLIS = 0;
/** Πόσα θετικά ορίσματα αφαιρούνται γιατί ανήκουν στο όνομα της εντολής. */
const ARITHMOS_ONOMATOS_ENTOLIS = 1;

/** Πλήρης ανάλυση των ορισμάτων γραμμής εντολής, χωρίς περιβάλλον και χωρίς I/O. */
export interface GrammatikopoioArgv {
  /** Το πρώτο θετικό όρισμα· κενή συμβολοσειρά αν δεν δόθηκε εντολή. */
  readonly entoli: string;
  /** Τα υπόλοιπα θετικά ορίσματα, με τη σειρά που δόθηκαν. */
  readonly ori_arg: readonly string[];
  readonly riza: string;
  /** `null` = δεν δόθηκε σημαία· το μοντέλο τότε προκύπτει από τις ρυθμίσεις. */
  readonly montelo: string | null;
  readonly json: boolean;
  readonly voitheia: boolean;
}

/** Ποια σημαία αναμένει τιμή. */
function einai_semeia_me_timi(onoma: string): boolean {
  return onoma === ONOMA_SEMEIAS_RIZA || onoma === ONOMA_SEMEIAS_MONTELO;
}

/** Ποια σημαία είναι boolean (δεν δέχεται τιμή). */
function einai_boolean(onoma: string): boolean {
  return onoma === ONOMA_SEMEIAS_JSON || onoma === ONOMA_SEMEIAS_VOITHEIA;
}

function sfalma_eisodou(minima: string): Apotelesma<never> {
  return apotyxia(KODIKOS_LANTHASMENIS_EISODOU, minima);
}

/**
 * Αναλύει τα ορίσματα γραμμής εντολής.
 *
 * Οι σημαίες επιτρέπονται πριν ή μετά τα ορίσματα. Οι boolean δεν καταναλώνουν το
 * επόμενο token· όσες θέλουν τιμή την παίρνουν από το επόμενο token ή μετά το `=`.
 * Μετά το `--` τα tokens θεωρούνται πάντα ορίσματα.
 */
export function analizise_argv(argv: readonly string[]): Apotelesma<GrammatikopoioArgv> {
  const ori_arg: string[] = [];
  let riza = RIZA_PROEDROPIA;
  let montelo: string | null = null;
  let json = false;
  let voitheia = false;
  let telos_oriargon = false;

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    i += 1;
    if (arg === undefined) {
      break;
    }

    if (!telos_oriargon && arg === TELOS_ORIARGON) {
      telos_oriargon = true;
      continue;
    }

    const einai_prosfolio = arg.startsWith(PROSFOLI_SIMIOLOU) && arg.length > ARKIKO_MIKROS_SIMIOLOU;
    const einai_mikros_simio =
      !einai_prosfolio && arg.startsWith(SYMBOLO_SIMIO) && arg.length > ARKIKO_MIKROS_SIMIOLOU;

    if (telos_oriargon || (!einai_prosfolio && !einai_mikros_simio)) {
      ori_arg.push(arg);
      continue;
    }

    if (einai_mikros_simio) {
      if (arg === SEMA_VOITHEIA_MIKRI) {
        voitheia = true;
        continue;
      }
      return sfalma_eisodou(
        `Άγνωστη σημαία: ${arg}. Διαθέσιμες: ${SEMA_VOITHEIA}, ${SEMA_VOITHEIA_MIKRI}`
      );
    }

    const lexima = arg.slice(PROSFOLI_SIMIOLOU.length);
    const thesi_istotimias = lexima.indexOf(SYMBOLO_ISTOTIMIAS);
    const onoma = thesi_istotimias === -1 ? lexima : lexima.slice(0, thesi_istotimias);
    const imeresi_timi = thesi_istotimias === -1 ? null : lexima.slice(thesi_istotimias + 1);
    const onoma_plires = `${PROSFOLI_SIMIOLOU}${onoma}`;

    if (einai_boolean(onoma)) {
      if (imeresi_timi !== null) {
        return sfalma_eisodou(`Η σημαία ${onoma_plires} δεν δέχεται τιμή`);
      }
      if (onoma === ONOMA_SEMEIAS_JSON) {
        json = true;
      } else {
        voitheia = true;
      }
      continue;
    }

    if (!einai_semeia_me_timi(onoma)) {
      return sfalma_eisodou(
        `Άγνωστη σημαία: ${onoma_plires}. Χρήση: dps-guide <εντολή> [ορίσματα] [σημαίες]`
      );
    }

    let timi = imeresi_timi;
    if (timi === null) {
      const epomeno = argv[i];
      if (epomeno === undefined || epomeno.length === 0) {
        return sfalma_eisodou(`Η σημαία ${onoma_plires} χρειάζεται τιμή`);
      }
      timi = epomeno;
      i += 1;
    }
    if (timi.length === 0) {
      return sfalma_eisodou(`Η σημαία ${onoma_plires} χρειάζεται μη κενή τιμή`);
    }
    if (onoma === ONOMA_SEMEIAS_RIZA) {
      riza = timi;
    } else {
      montelo = timi;
    }
  }

  return {
    ok: true,
    timi: {
      entoli: ori_arg[THESI_ONOMATOS_ENTOLIS] ?? '',
      ori_arg: ori_arg.slice(ARITHMOS_ONOMATOS_ENTOLIS),
      riza,
      montelo,
      json,
      voitheia,
    },
  };
}
