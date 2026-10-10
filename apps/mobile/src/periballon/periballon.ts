import type {
  ApothikiPyli,
  HttpPyli,
  KatagrafiPyli,
  LlmPyli,
  MystikaPyli,
  RologiPyli,
} from '@dps/core';
import { FakeHttp, FakeMystika, FakeRologi, MockLlm, MnimiApothiki } from '@dps/core';
import { KatagrafiMnimis } from './katagrafi-mnimis.js';

/** Οι έξι πύλες που δέχεται κάθε οθόνη μέσω του περιβάλλοντος εξαρτήσεων. */
export type PylesPeriballontos = {
  mystika: MystikaPyli;
  apothiki: ApothikiPyli;
  http: HttpPyli;
  llm: LlmPyli;
  rologi: RologiPyli;
  katagrafi: KatagrafiPyli;
};

/** Ένα από τα έξι ονόματα πυλών, για τα σημεία κλήσης που ξέρουν μόνο όνομα σε χρόνο εκτέλεσης. */
export type KleidiPyli = keyof PylesPeriballontos;

/** Αμετάβλητο περιβάλλον πυλών: κάθε αντικατάσταση επιστρέφει νέο περιβάλλον και δεν πειράζει τον παραλήπτη. */
export interface Periballon extends PylesPeriballontos {
  readonly me_antikatastasi: <K extends KleidiPyli>(
    kleidi: K,
    timi: PylesPeriballontos[K]
  ) => Periballon;
  /** True όταν το περιβάλλον είναι το ψεύτικο· τότε επιτρέπεται μόνο το σπόρο δείγματος. */
  readonly deigma: boolean;
}

/** Πρότυπο προεπιλεγμένων κατασκευαστών πυλών, από το οποίο προκύπτει και ο κατάλογος κλειδιών. */
const PROEPILOGES_PYLON: { [K in KleidiPyli]: () => PylesPeriballontos[K] } = {
  mystika: () => new FakeMystika(),
  apothiki: () => new MnimiApothiki(),
  http: () => new FakeHttp(),
  llm: () => new MockLlm(),
  rologi: () => new FakeRologi(),
  katagrafi: () => new KatagrafiMnimis(),
};

/** Τα έξι κλειδιά πυλών με αλφαβητική σειρά, παγωμένα ώστε κανένας να μην τα αλλοιώσει. */
export const KLEIDIA_PYLON: readonly KleidiPyli[] = Object.freeze(
  (Object.keys(PROEPILOGES_PYLON) as KleidiPyli[]).sort()
);

/** Χτίζει το σύνολο των έξι πυλών από τα προεπιλεγμένα ψεύτικα προσαρμογείς. */
function dimiourgise_pyles(): PylesPeriballontos {
  return {
    mystika: PROEPILOGES_PYLON.mystika(),
    apothiki: PROEPILOGES_PYLON.apothiki(),
    http: PROEPILOGES_PYLON.http(),
    llm: PROEPILOGES_PYLON.llm(),
    rologi: PROEPILOGES_PYLON.rologi(),
    katagrafi: PROEPILOGES_PYLON.katagrafi(),
  };
}

/** Αντικαθιστά μία πύλη σε ένα νέο αντίγραφο των πυλών χωρίς να αγγίξει το πρωτότυπο. */
function antikatastise_pyli<K extends KleidiPyli>(
  pyles: PylesPeriballontos,
  kleidi: K,
  timi: PylesPeriballontos[K]
): PylesPeriballontos {
  const nees_pyles: PylesPeriballontos = { ...pyles };
  Object.assign(nees_pyles, { [kleidi]: timi });
  return nees_pyles;
}

/** Εφαρμόζει όλες τις δοσμένες αντικαταστάσεις πάνω στα υπάρχοντα πύλες, με τη σειρά του καταλόγου κλειδιών. */
function efarmose_antikatastaseis(
  pyles: PylesPeriballontos,
  antikatastaseis: Partial<PylesPeriballontos>
): PylesPeriballontos {
  return KLEIDIA_PYLON.reduce<PylesPeriballontos>((trexon, kleidi) => {
    const timi = antikatastaseis[kleidi];
    return timi === undefined ? trexon : antikatastise_pyli(trexon, kleidi, timi);
  }, pyles);
}

/** Φτιάχνει το αμετάβλητο περιβάλλον που κλείνει πάνω στο συγκεκριμένο σύνολο πυλών. */
function ftiaxe_apo_pyles(pyles: PylesPeriballontos, deigma: boolean): Periballon {
  return {
    ...pyles,
    deigma,
    me_antikatastasi: <K extends KleidiPyli>(
      kleidi: K,
      timi: PylesPeriballontos[K]
    ): Periballon => ftiaxe_apo_pyles(antikatastise_pyli(pyles, kleidi, timi), deigma),
  };
}

/** Φτιάχνει το περιβάλλον πυλών των οθονών, με προεπιλογή τα ψεύτικα προσαρμογείς και προαιρετικές αντικαταστάσεις. */
export function ftiaxe_periballon(
  antikatastaseis?: Partial<PylesPeriballontos>,
  epiloges?: { readonly deigma?: boolean }
): Periballon {
  const pyles = efarmose_antikatastaseis(dimiourgise_pyles(), antikatastaseis ?? {});
  return ftiaxe_apo_pyles(pyles, epiloges?.deigma ?? true);
}

/** Επιστρέφει την πύλη του περιβάλλοντος με τύπο αντίστοιχο του κλειδιού που δίνεται σε χρόνο εκτέλεσης. */
export function pare_pyli<K extends KleidiPyli>(
  periballon: Periballon,
  kleidi: K
): PylesPeriballontos[K] {
  return periballon[kleidi];
}
