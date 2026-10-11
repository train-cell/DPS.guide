import type { KodikosSfalmatos, Sfalma } from '@dps/core';
import { analizise_argv } from './argv/analizis-argv.js';
import type { GrammatikopoioArgv } from './argv/analizis-argv.js';
import { keimako_xeysisimaton } from './argv/epikefalia.js';
import { KODIKOS_EXODOU_OK, KODIKOS_EXODOU_SFALMA, KODIKOS_LANTHASMENIS_EISODOU } from './argv/statheroi-argv.js';
import type { Eksodosi } from './eksodos/eksodosi.js';
import { grapse_apotychias, grapse_epityxies } from './eksodos/eksodosi.js';
import type { DimiourgiseEisodos, GrammatikopoioEntolhs, ParastatesEntolhs } from './entoles/grammatikopoio-entolhs.js';
import { onomata_entolon, pire_entoli } from './entoles/entoles.js';

/** Οι εξαρτήσεις του dispatcher — όλες μπαίνουν από έξω, ώστε να δοκιμάζονται. */
export interface EksodikesParastates {
  readonly dimiourgise_eisodos: DimiourgiseEisodos;
  readonly eksodosi: Eksodosi;
}

/** Όλοι οι νόμιμοι κωδικοί σφάλματος του contracts (ποτέ αυθαίρετος). */
const KODIKOI_SFALMATON: readonly KodikosSfalmatos[] = [
  'AUTH_APOTYXIA',
  'SESSION_LIXI',
  'DIKTYO',
  'TIMEOUT',
  'RATE_LIMIT',
  'MI_EGKYRO_SXIMA',
  'DEN_VRETHIKE',
  'MI_YPOSTIRIZOMENO',
  'PROYPOLOGISMOS',
  'AKYROTHIKE',
  'AGNOSTO',
];

function einai_kodikos_sfalmatos(timi: unknown): timi is KodikosSfalmatos {
  return typeof timi === 'string' && (KODIKOI_SFALMATON as readonly string[]).includes(timi);
}

function einai_sfalma(timi: unknown): timi is Sfalma {
  return (
    typeof timi === 'object' &&
    timi !== null &&
    einai_kodikos_sfalmatos((timi as { kodikos: unknown }).kodikos) &&
    typeof (timi as { minima: unknown }).minima === 'string'
  );
}

/**
 * Κανονικοποιεί οποιαδήποτε «σφαλματική» τιμή σε έγκυρο `Sfalma`.
 *
 * Τα adapters πετάχνουν μερικές φορές raw `{ sfalma: {...} }` αντί για να
 * επιστρέψουν `Apotelesma`. Εδώ κανονικοποιείται ώστε το CLI να μην πετάξει ποτέ
 * προς τα έξω — πάντα επιστρέφει κανονικό `Sfalma` (§3.9).
 */
export function epikyrose_sfalma(timi: unknown): Sfalma {
  if (einai_sfalma(timi)) {
    return timi;
  }
  if (typeof timi === 'object' && timi !== null && 'sfalma' in timi) {
    const inner = (timi as { sfalma: unknown }).sfalma;
    if (einai_sfalma(inner)) {
      return inner;
    }
  }
  return {
    kodikos: 'AGNOSTO',
    minima: 'Απροσδόκητο σφάλμα κατά την εκτέλεση της εντολής (μη αναγνωρίσιμη δομή σφάλματος)',
  };
}

/** Ελέγχει τον αριθμό των θετικών ορισμάτων σύμφωνα με τη δήλωση της εντολής. */
export function epikyrose_oria(
  entoli: GrammatikopoioEntolhs,
  ori_arg: readonly string[]
): Sfalma | null {
  const upoxreitoumena = entoli.argia.filter((argo) => argo.upoxreitai);
  if (ori_arg.length < upoxreitoumena.length) {
    const leipa = upoxreitoumena.slice(ori_arg.length).map((argo) => argo.onoma);
    return sfalma_eisodou(`Λείπει το υποχρεωτικό όρισμα: ${leipa.join(', ')}`);
  }
  if (ori_arg.length > entoli.argia.length) {
    return sfalma_eisodou(
      `Παραπάνω ορίσματα για την εντολή «${entoli.onoma}»: περιμένονται το πολύ ${entoli.argia.length}`
    );
  }
  return null;
}

function sfalma_eisodou(minima: string): Sfalma {
  return { kodikos: KODIKOS_LANTHASMENIS_EISODOU, minima };
}

function sfalma_agneos_entoli(onoma: string): Sfalma {
  return sfalma_eisodou(
    `Άγνωστη εντολή: ${onoma}. Διαθέσιμες: ${onomata_entolon().join(', ')}`
  );
}

/** Εγγραφή της βοήθειας στην κανονική έξοδο. */
function grapse_voitheias(eksodosi: Eksodosi): void {
  for (const grammi of keimako_xeysisimaton()) {
    eksodosi.grapse_grammi(grammi);
  }
}

/**
 * Ο dispatcher του CLI: ανάλυση argv → επιλογή εντολής → στήνιση ports → βήμα → έξοδος.
 *
 * Επιστρέφει ΠΟΤΕ δεν απορρίπτει: κάθε αστοχία (άγνωστη εντολή, λείπον όρισμα,
 * σφάλμα βήματος, εξαίρεση adapter) μετατρέπεται σε `Sfalma` και σε κωδικό εξόδου 1.
 * Η εκτέλεση του βήματος γίνεται μέσα σε `try/catch`, ώστε καμία rejected promise
 * να μην φύγει ως unhandled rejection.
 */
export async function trexe_entoles(
  argv: readonly string[],
  parastates: EksodikesParastates
): Promise<number> {
  const analizis = analizise_argv(argv);
  if (!analizis.ok) {
    grapse_apotychias(parastates.eksodosi, analizis.sfalma, false);
    return KODIKOS_EXODOU_SFALMA;
  }
  const grammatikopoio: GrammatikopoioArgv = analizis.timi;

  if (grammatikopoio.voitheia) {
    grapse_voitheias(parastates.eksodosi);
    return KODIKOS_EXODOU_OK;
  }

  if (grammatikopoio.entoli.length === 0) {
    grapse_apotychias(
      parastates.eksodosi,
      sfalma_eisodou(
        'Δεν δόθηκε εντολή. Χρήση: dps-guide <εντολή> [ορίσματα] [σημαίες] — δες το --help'
      ),
      grammatikopoio.json
    );
    return KODIKOS_EXODOU_SFALMA;
  }

  const entoli = pire_entoli(grammatikopoio.entoli);
  if (entoli === undefined) {
    grapse_apotychias(parastates.eksodosi, sfalma_agneos_entoli(grammatikopoio.entoli), grammatikopoio.json);
    return KODIKOS_EXODOU_SFALMA;
  }

  const sfalma_oriargon = epikyrose_oria(entoli, grammatikopoio.ori_arg);
  if (sfalma_oriargon !== null) {
    grapse_apotychias(parastates.eksodosi, sfalma_oriargon, grammatikopoio.json);
    return KODIKOS_EXODOU_SFALMA;
  }

  const stathmoi: ParastatesEntolhs = {
    riza: grammatikopoio.riza,
    montelo: grammatikopoio.montelo,
    xreiazetai_llm: entoli.xreiazetai_llm,
  };

  try {
    const eisodos = await parastates.dimiourgise_eisodos(stathmoi);
    if (!eisodos.ok) {
      grapse_apotychias(parastates.eksodosi, eisodos.sfalma, grammatikopoio.json);
      return KODIKOS_EXODOU_SFALMA;
    }
    const apotelesma = await entoli.trexe(eisodos.timi, stathmoi, grammatikopoio.ori_arg);
    if (!apotelesma.ok) {
      grapse_apotychias(parastates.eksodosi, epikyrose_sfalma(apotelesma.sfalma), grammatikopoio.json);
      return KODIKOS_EXODOU_SFALMA;
    }
    grapse_epityxies(parastates.eksodosi, apotelesma.timi, grammatikopoio.json);
    return KODIKOS_EXODOU_OK;
  } catch (sfalma: unknown) {
    grapse_apotychias(parastates.eksodosi, epikyrose_sfalma(sfalma), grammatikopoio.json);
    return KODIKOS_EXODOU_SFALMA;
  }
}
