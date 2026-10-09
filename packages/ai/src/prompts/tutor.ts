import { ParapompiSchema } from '@dps/core';
import type { Enotita } from '@dps/core';
import { z } from 'zod';
import { EKDOSI_PROMPT_P4 } from './ekdoseis.js';
import type { AitisiPrompt } from './koines.js';
import { enotita_se_keimeno } from './koines.js';

export const LEITOURGIES_TUTOR = ['exigisi', 'exetasi_me', 'kathodigisi_askisis'] as const;
export type LeitourgiaTutor = (typeof LEITOURGIES_TUTOR)[number];

export const TutorApotelesmaSchema = z.object({
  apantisi: z.string(),
  parapompes: z.array(ParapompiSchema),
});
export type TutorApotelesma = z.infer<typeof TutorApotelesmaSchema>;

const SISTIMA_P4 =
  enotita_se_keimeno('Ρόλος', [
    'Είσαι ο δάσκαλος της ενότητας. Απαντάς μόνο με βάση τον οδηγό και το υλικό που σου δίνεται.',
  ]) +
  enotita_se_keimeno('Λειτουργίες', [
    '- exigisi: εξηγείς με απλή γλώσσα και δίνεις παραδείγματα από τον οδηγό.',
    '- exetasi_me: κάνεις ΜΙΑ ερώτηση τη φορά και περιμένεις την απάντηση του μαθητή. Αφού απαντήσει, την αξιολογείς με παραπομπή.',
    '- kathodigisi_askisis: δίνεις υποδείξεις και βήματα, όχι πλήρη λύση, ώσπου να το ζητήσει ρητά ο μαθητής.',
  ]) +
  enotita_se_keimeno('Κανόνες', [
    '- Κάθε απάντηση που δεν τεκμηριώνεται από τον οδηγό ή το υλικό είναι ακριβώς: Δεν υπάρχει στο υλικό',
    '- ΔΕΝ βαθμολογείς αριθμητικές απαντήσεις. Η deterministic σύγκριση με την αναμενόμενη τιμή γίνεται έξω από σένα.',
    '- Όταν η αναμενόμενη τιμή δεν υπάρχει αυτούσια στο υλικό, απαντάς ακριβώς: δεν μπορώ να επαληθεύσω',
    '- Αναφέρεις πάντα παραπομπές στον οδηγό ή στο υλικό, με τη μορφή [[arxeio_id:σελίδα]].',
    '- Δεν μεταφράζεις ορολογία και δεν επινοείς ορισμούς, παραδείγματα ή αριθμούς.',
  ]);

export interface EisodosTutor {
  enotita: Enotita;
  odigos: string;
  istorico: { rolos: 'xristis' | 'montelo'; keimeno: string }[];
  leitourgia: LeitourgiaTutor;
  erotisi: string;
}

export function prompt_tutor(eisodos: EisodosTutor): AitisiPrompt<TutorApotelesma> {
  const istoriko = eisodos.istorico
    .map((m) => `- ${m.rolos}: ${m.keimeno}`)
    .join('\n');

  return {
    sistima: SISTIMA_P4,
    xristis:
      enotita_se_keimeno('Ενότητα', [
        `id: ${eisodos.enotita.id}`,
        `τίτλος: ${eisodos.enotita.titlos}`,
        `έννοιες: ${eisodos.enotita.ennoies.join(', ')}`,
      ]) +
      enotita_se_keimeno('Λειτουργία', [`leitourgia: ${eisodos.leitourgia}`]) +
      enotita_se_keimeno('Οδηγός ενότητας', [eisodos.odigos]) +
      enotita_se_keimeno('Ιστορικό συζήτησης', [istoriko]) +
      enotita_se_keimeno('Τρέχουσα ερώτηση μαθητή', [eisodos.erotisi]),
    sisma: TutorApotelesmaSchema,
    ekdosi_prompt: EKDOSI_PROMPT_P4,
  };
}
