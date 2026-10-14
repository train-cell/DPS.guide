import type {
  ApothikiPyli,
  HttpPyli,
  KatagrafiPyli,
  LlmPyli,
  MystikaPyli,
  RologiPyli,
} from '@dps/core';

/** Οι έξι εξαρτήσεις που χρειάζεται η εφαρμογή. Η παραγωγή οφείλει να τις παρέχει ρητά. */
export type PylesPeriballontos = {
  mystika: MystikaPyli;
  apothiki: ApothikiPyli;
  http: HttpPyli;
  llm: LlmPyli;
  rologi: RologiPyli;
  katagrafi: KatagrafiPyli;
};

export type KleidiPyli = keyof PylesPeriballontos;

export interface Periballon extends PylesPeriballontos {
  readonly me_antikatastasi: <K extends KleidiPyli>(
    kleidi: K,
    timi: PylesPeriballontos[K],
  ) => Periballon;
  /** Μόνο τα test fixtures μπορούν να επισημάνουν ένα περιβάλλον ως δείγμα. */
  readonly deigma: boolean;
}

export const KLEIDIA_PYLON: readonly KleidiPyli[] = Object.freeze(
  ['mystika', 'apothiki', 'http', 'llm', 'rologi', 'katagrafi'].sort() as KleidiPyli[],
);

function create(pyles: PylesPeriballontos, deigma: boolean): Periballon {
  return {
    ...pyles,
    deigma,
    me_antikatastasi: <K extends KleidiPyli>(kleidi: K, timi: PylesPeriballontos[K]) =>
      create({ ...pyles, [kleidi]: timi }, deigma),
  };
}

/** Κατασκευάζει runtime μόνο από ρητά παρεχόμενα adapters· δεν υπάρχει production fallback. */
export function ftiaxe_periballon(
  pyles: PylesPeriballontos,
  epiloges?: { readonly deigma?: boolean },
): Periballon {
  return create(pyles, epiloges?.deigma ?? false);
}

export function pare_pyli<K extends KleidiPyli>(periballon: Periballon, kleidi: K): PylesPeriballontos[K] {
  return periballon[kleidi];
}
