/**
 * ΚΟΙΝΟ ΣΥΜΒΟΛΑΙΟ — τα ports και οι τύποι εισόδου/εξόδου της ορχήστρωσης.
 *
 * ΔΕΝ ΑΛΛΑΖΕΙ χωρίς αίτημα στον integrator: το `src/index.ts` τα εξάγει από εδώ
 * ώστε οι υπογραφές να είναι αυτές που καταναλώνει το `apps/cli`.
 */

import type {
  ApothikiPyli,
  Apotelesma,
  EclassPyli,
  KatevasmaPyli,
  KatagrafiPyli,
  KleidiMystikou,
  LlmPyli,
  Mathima,
  MystikaPyli,
  OdigosMeta,
  Perigramma,
  RologiPyli,
  XartisMathimatos,
} from '@dps/core';

/** Optional on-device OCR port. It receives raw PDF bytes and returns text for one-based page. */
export interface OcrPyli {
  anagnorise_pdf_selida(bytes: Uint8Array, page: number): Promise<Apotelesma<string>>;
}

/** Όλα τα ports που χρειάζεται η ορχήστρωση, μαζί με τη ρίζα αποθήκευσης. */
export interface EisodosPipeline {
  readonly eclass: EclassPyli;
  readonly apothiki: ApothikiPyli;
  /** Download adapter. Pipeline owns download delta and metadata; adapter owns transport and atomic writes. */
  readonly katevasma: KatevasmaPyli;
  /** Local OCR is used only for PDF pages without an extractable text layer. */
  readonly ocr?: OcrPyli;
  readonly llm: LlmPyli;
  readonly mystika: MystikaPyli;
  readonly rologi: RologiPyli;
  readonly katagrafi: KatagrafiPyli;
  /** Ρίζα αποθήκευσης (§5.3)· κενό = ίδια με τη θύρα. */
  readonly riza: string;
}

/** Αποτέλεσμα βήματος που δεν επιστρέφει οντότητα (π.χ. συγχρονισμός). */
export interface Metriti {
  readonly megaliteres: number;
}

/** Συντομογραφίες των βημάτων που επιστρέφουν οντότητα, για τα `switch` των καλούντων. */
export type ApotelestesSyndesis = void;
export type ApotelestesAnakalypsis = Mathima[];
export type ApotelestesSygxronismou = Metriti;
export type ApotelestesExagogis = Metriti;
export type ApotelestesPerigrammatos = Perigramma;
export type ApotelestesXarti = XartisMathimatos;
export type ApotelestesMegethon = XartisMathimatos;
export type ApotelestesOdigou = OdigosMeta;

/** Τα κλειδιά μυστικών που χρησιμοποιεί η ορχήστρωση (για το CLI). */
export const KLEIDIA_PIPELINE: readonly KleidiMystikou[] = [
  'eclass_onoma_xristi',
  'eclass_kodikos',
  'llm_api_key',
];
