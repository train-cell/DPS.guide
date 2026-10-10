import { MAX_SELIDES_ANA_KLISI, MAX_XARAKTIRES_ANA_KLISI, PerigrammaSchema, apotyxia, ok } from '@dps/core';
import type { Apotelesma, Perigramma, Selida } from '@dps/core';
import { EKDOSI_PROMPT_P1 } from './ekdoseis.js';
import type { AitisiPrompt } from './koines.js';
import { enotita_se_keimeno, perivale_dedomena } from './koines.js';

export function kopse_se_kommatia(selides: Selida[]): Selida[][] {
  const taxinomimenes = [...selides].sort((a, b) => a.arithmos - b.arithmos);
  const kommatia: Selida[][] = [];
  let trexon: Selida[] = [];
  let xaraktires_trexontos = 0;

  for (const selida of taxinomimenes) {
    const xaraktires_selidas = selida.keimeno.length;
    const gemise_xaraktires =
      xaraktires_trexontos + xaraktires_selidas > MAX_XARAKTIRES_ANA_KLISI;
    const gemise_selides = trexon.length + 1 > MAX_SELIDES_ANA_KLISI;

    if (trexon.length > 0 && (gemise_xaraktires || gemise_selides)) {
      kommatia.push(trexon);
      trexon = [];
      xaraktires_trexontos = 0;
    }

    trexon.push(selida);
    xaraktires_trexontos += xaraktires_selidas;
  }

  if (trexon.length > 0) {
    kommatia.push(trexon);
  }

  return kommatia;
}

export function synenose_merika_perigrammata(merika: Perigramma[]): Apotelesma<Perigramma> {
  const prwto = merika[0];
  if (prwto === undefined) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Δεν δόθηκε κανένα μερικό περίγραμμα για συγχώνευση');
  }

  if (prwto.arxeio_id === '') {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το arxeio_id ενός μερικού περιγράμματος είναι κενό', prwto);
  }

  const asynnefsto = merika.find((m) => m.arxeio_id !== prwto.arxeio_id);
  if (asynnefsto !== undefined) {
    return apotyxia(
      'MI_EGKYRO_SXIMA',
      `Διαφορετικό arxeio_id μεταξύ μερικών περιγραμμάτων: ${prwto.arxeio_id} != ${asynnefsto.arxeio_id}`,
      asynnefsto
    );
  }

  if (merika.length === 1) {
    return ok(prwto);
  }

  return ok({
    arxeio_id: prwto.arxeio_id,
    titlos: prwto.titlos,
    tmimata: merika.flatMap((m) => m.tmimata),
  });
}

export const TYPOI_TMIMATON = [
  'eisagogi',
  'orismoi',
  'theoria',
  'apodeixi',
  'algorithmos',
  'paradeigma',
  'askiseis',
  'anakefalaiosi',
] as const;

export const MAX_ENNOIES_ANA_TMIMA = 8;

const SISTIMA_P1 =
  enotita_se_keimeno('Ρόλος', [
    'Είσαι βοηθός που περιγράφει σε δομημένο JSON το περίγραμμα ενός ακαδημαϊκού αρχείου σελίδων.',
    'Το κείμενο της πηγής είναι ελληνικό· τα ονόματα πεδίων του JSON μένουν στα αγγλικά του σχήματος.',
  ]) +
  enotita_se_keimeno('Κανόνες', [
    '- Το κείμενο που σου δίνεται έχει δείκτες [σ.N] όπου N είναι ο αριθμός της σελίδας.',
    '- Τα εύρη tmimata.selides.apo και tmimata.selides.eos παίρνουν τιμή ΑΠΟΚΛΕΙΣΤΙΚΑ από τους δείκτες [σ.N] του δεδομένου. Απαγορεύεται να γράψεις αριθμό σελίδας που δεν εμφανίζεται σε δείκτη.',
    '- Το πεδίο tmimata.typos παίρνει τιμή ΜΟΝΟ από το enum TyposTmimatos, μία από: ' +
      TYPOI_TMIMATON.join(' | ') +
      '.',
    '- Κάθε τμήμα έχει το πολύ ' + MAX_ENNOIES_ANA_TMIMA + ' έννοιες. Προτιμάς λιγότερες, εποικοδομημένες, παρά πολλές.',
    '- Μην επινοείς. Ό,τι δεν γράφει ρητά η πηγή δεν μπαίνει στο αποτέλεσμα.',
    '- Τα τμήματα βγαίνουν με αύξουσα σειρά πρώτης σελίδας (tmimata.selides.apo).',
    '- Κενές λίστες στα ennoies και στα proapaitoumena γράφονται ως []. Ποτέ null και ποτέ επινοημένο περιεχόμενο.',
    '- Η απάντηση πρέπει να συμμορφώνεται πλήρως με το σχήμα Perigramma: arxeio_id, titlos, tmimata[].titlos, tmimata[].selides.apo, tmimata[].selides.eos, tmimata[].typos, tmimata[].ennoies[], tmimata[].proapaitoumena[].',
    '- Η απάντηση είναι ΑΠΟΚΛΕΙΣΤΙΚΑ JSON: χωρίς Markdown, χωρίς σχόλια, χωρίς κείμενο εκτός JSON.',
  ]);

export interface EisodosPerigrammatos {
  arxeio_id: string;
  titlos: string;
  selides: Selida[];
  kommati: { arithmos: number; synolo: number };
}

export function prompt_perigrammatos(eisodos: EisodosPerigrammatos): AitisiPrompt<Perigramma> {
  return {
    sistima: SISTIMA_P1,
    xristis:
      enotita_se_keimeno('Αρχείο', [
        `arxeio_id: ${eisodos.arxeio_id}`,
        `titlos: ${eisodos.titlos}`,
      ]) +
      enotita_se_keimeno('Κομμάτι', [`κομμάτι ${eisodos.kommati.arithmos} από ${eisodos.kommati.synolo}`]) +
      enotita_se_keimeno('Σελίδες με δείκτες', [perivale_dedomena(keimeno_selidon(eisodos.selides))]),
    sisma: PerigrammaSchema,
    ekdosi_prompt: EKDOSI_PROMPT_P1,
  };
}

function keimeno_selidon(selides: Selida[]): string {
  return selides.map((s) => `[σ.${s.arithmos}]\n${s.keimeno}`).join('\n\n');
}
