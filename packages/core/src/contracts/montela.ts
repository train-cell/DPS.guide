import { z } from 'zod';

export const TyposTmimatosSchema = z.enum([
  'eisagogi',
  'orismoi',
  'theoria',
  'apodeixi',
  'algorithmos',
  'paradeigma',
  'askiseis',
  'anakefalaiosi',
]);
export type TyposTmimatos = z.infer<typeof TyposTmimatosSchema>;

export const MathimaSchema = z.object({
  kodikos: z.string(),
  titlos: z.string(),
  url: z.string(),
  epilegmeno: z.boolean(),
});
export type Mathima = z.infer<typeof MathimaSchema>;

export const ArxeioSchema = z.object({
  id: z.string(),
  kodikos_mathimatos: z.string(),
  diadromi: z.string(),
  url: z.string(),
  megethos: z.number().nullable(),
  imerominia: z.string().nullable(),
  etag: z.string().nullable(),
  sha256: z.string().nullable(),
  diplotypo_tou: z.string().nullable(),
});
export type Arxeio = z.infer<typeof ArxeioSchema>;

export const SelidaSchema = z.object({
  arxeio_id: z.string(),
  arithmos: z.number(),
  keimeno: z.string(),
  lekseis: z.number(),
  xoris_keimeno: z.boolean(),
});
export type Selida = z.infer<typeof SelidaSchema>;

export const PigiSchema = z.object({
  arxeio_id: z.string(),
  apo: z.number(),
  eos: z.number(),
});
export type Pigi = z.infer<typeof PigiSchema>;

export const TmimaSchema = z.object({
  titlos: z.string(),
  selides: z.object({ apo: z.number(), eos: z.number() }),
  typos: TyposTmimatosSchema,
  ennoies: z.array(z.string()),
  proapaitoumena: z.array(z.string()),
});
export type Tmima = z.infer<typeof TmimaSchema>;

export const PerigrammaSchema = z.object({
  arxeio_id: z.string(),
  titlos: z.string(),
  tmimata: z.array(TmimaSchema),
});
export type Perigramma = z.infer<typeof PerigrammaSchema>;

export const ProapaitoumenoSchema = z.object({
  enotita_id: z.string(),
  isxys: z.enum(['isxyri', 'asthenis']),
});
export type Proapaitoumeno = z.infer<typeof ProapaitoumenoSchema>;

export const EnotitaSchema = z.object({
  id: z.string(),
  titlos: z.string(),
  piges: z.array(PigiSchema),
  ennoies: z.array(z.string()),
  proapaitoumenes: z.array(ProapaitoumenoSchema),
  seira: z.number(),
  lepta_ektimisi: z.number().nullable(),
  apodosi_exetasis: z.number().nullable(),
});
export type Enotita = z.infer<typeof EnotitaSchema>;

export const XartisMathimatosSchema = z.object({
  kodikos_mathimatos: z.string(),
  enotites: z.array(EnotitaSchema),
  ekdosi_prompt: z.string(),
  dimiourgithike: z.string(),
});
export type XartisMathimatos = z.infer<typeof XartisMathimatosSchema>;

export const ParapompiSchema = z.object({
  arxeio_id: z.string(),
  selida: z.number(),
});
export type Parapompi = z.infer<typeof ParapompiSchema>;

export const OdigosMetaSchema = z.object({
  enotita_id: z.string(),
  parapompes: z.array(ParapompiSchema),
  montelo: z.string(),
  ekdosi_prompt: z.string(),
  hash_eisodou: z.string(),
  proeidopoiiseis: z.array(z.string()),
});
export type OdigosMeta = z.infer<typeof OdigosMetaSchema>;

export const TroposExetasisSchema = z.enum([
  'anoixta_vivlia',
  'kleista_vivlia',
  'polapli_epilogi_arnitiki',
  'ergasia',
]);
export type TroposExetasis = z.infer<typeof TroposExetasisSchema>;

export const ExetasiSchema = z.object({
  kodikos_mathimatos: z.string(),
  imerominia: z.string().nullable(),
  tropos: TroposExetasisSchema,
});
export type Exetasi = z.infer<typeof ExetasiSchema>;
