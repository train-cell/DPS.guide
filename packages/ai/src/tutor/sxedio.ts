import { z } from 'zod';
import { LEITOURGIES_TUTOR, TutorApotelesmaSchema } from '../prompts/tutor.js';

export const ERGA_ALITHIA = ['anoixe_selida', 'vres_ennoia', 'ftiaxe_erotisi'] as const;
export type ErgoAlithio = (typeof ERGA_ALITHIA)[number];

export const PoreiesArithmetikis = ['sosto', 'lathos', 'den_epalythevomene'] as const;
export const PoreiaArithmetikisSchema = z.enum(PoreiesArithmetikis);
export type PoreiaArithmetikis = z.infer<typeof PoreiaArithmetikisSchema>;

export const ErgoAlithioSchema = z.object({
  onoma: z.string(),
  arguments: z.record(z.string(), z.unknown()),
});
export type ErgoAlithioZitisi = z.infer<typeof ErgoAlithioSchema>;

export const ApantisiTutorSchema = TutorApotelesmaSchema.extend({
  leitourgia: z.enum(LEITOURGIES_TUTOR),
  exexigmeni: z.boolean(),
  apantisi_teleia_lusi: z.boolean().optional(),
  symkrisi_arithmetikis: PoreiaArithmetikisSchema.nullable().optional(),
  ergaleio: ErgoAlithioSchema.optional(),
});
export type ApantisiTutor = z.infer<typeof ApantisiTutorSchema>;

export const AnoixeSelidaArgumentsSchema = z.object({
  arxeio_id: z.string().min(1),
  selida: z.number().int().positive(),
});

export const VresEnnoiaArgumentsSchema = z.object({
  ennoia: z.string().min(1),
});

export const FtiaxeErotisiArgumentsSchema = z.object({
  enotita_id: z.string().min(1),
});

export const ErgoAlithioAkrimaSchema = z.discriminatedUnion('onoma', [
  z.object({
    onoma: z.literal('anoixe_selida'),
    arguments: AnoixeSelidaArgumentsSchema,
  }),
  z.object({
    onoma: z.literal('vres_ennoia'),
    arguments: VresEnnoiaArgumentsSchema,
  }),
  z.object({
    onoma: z.literal('ftiaxe_erotisi'),
    arguments: FtiaxeErotisiArgumentsSchema,
  }),
]);
export type ErgoAlithioAkrima = z.infer<typeof ErgoAlithioAkrimaSchema>;