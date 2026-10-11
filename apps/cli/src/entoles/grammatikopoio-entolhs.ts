import type { Apotelesma } from '@dps/core';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ExodosEn } from '../eksodos/exodos-en.js';

/** Ένα θετικό όρισμα μιας εντολής. */
export interface ArgoEntolhs {
  /** Ονομασία για τα μηνύματα χρήσης (π.χ. `KODIKOS`). */
  readonly onoma: string;
  readonly upoxreitai: boolean;
  readonly perigrafh: string;
}

/** Μια εντολή του CLI: μεταδεδομένα + η εκτέλεσή της. */
export interface GrammatikopoioEntolhs {
  readonly onoma: string;
  readonly perigrafh: string;
  readonly argia: readonly ArgoEntolhs[];
  /** `true` όταν η εντολή παράγει LLM κλήσεις· τότε απαιτείται ορισμένο μοντέλο. */
  readonly xreiazetai_llm: boolean;
  trexe(
    eisodos: EisodosPipeline,
    parastates: ParastatesEntolhs,
    ori_arg: readonly string[]
  ): Promise<Apotelesma<ExodosEn>>;
}

/** Ρυθμίσεις που προκύπτουν από τις σημαίες και απαιτούνται για τη στήνιση των ports. */
export interface ParastatesEntolhs {
  /** Ρίζα αποθήκευσης (§5.3). */
  readonly riza: string;
  /** Μοντέλο από `--montelo` ή `null` για ανάγνωση από `<riza>/rythmiseis.json`. */
  readonly montelo: string | null;
  readonly xreiazetai_llm: boolean;
}

/** Κατασκευή της `EisodosPipeline` από τις παραστάτες της εντολής. */
export type DimiourgiseEisodos = (
  parastates: ParastatesEntolhs
) => Promise<Apotelesma<EisodosPipeline>>;
