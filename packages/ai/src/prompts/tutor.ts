import { ParapompiSchema } from '@dps/core';
import type { Enotita, TroposExetasis } from '@dps/core';
import { z } from 'zod';
import { EKDOSI_PROMPT_P4 } from './ekdoseis.js';
import type { AitisiPrompt } from './koines.js';
import type { YfosExigisis } from './tropos/yfos.js';
import { enotita_se_keimeno, perivale_dedomena } from './koines.js';
import {
  YFOS_EXIGISIS_PROEPILOGI,
  enotita_tropou_tis_xristis,
  enotita_yfos_tis_sistimatos,
} from './tropos/yfos.js';

export const LEITOURGIES_TUTOR = ['exigisi', 'exetasi_me', 'kathodigisi_askisis'] as const;
export type LeitourgiaTutor = (typeof LEITOURGIES_TUTOR)[number];

/** Ανώτατο πλήθος στροφών συζήτησης που περνά στο prompt (οι τελευταίες). */
export const MEGISTO_MIKOS_ISTORIKOU = 12;
export const KARTA_ROLON_SYZITISIS: Record<'xristis' | 'montelo', string> = {
  xristis: '[ΧΡΗΣΤΗΣ]',
  montelo: '[ΜΟΝΤΕΛΟΣ]',
};

export const TutorApotelesmaSchema = z.object({
  apantisi: z.string(),
  parapompes: z.array(ParapompiSchema),
});
export type TutorApotelesma = z.infer<typeof TutorApotelesmaSchema>;

/** Βασικό σύστημα P4, πριν το ύφος — σταθερό, δεν εξαρτάται από τις ρυθμίσεις. */
const SISTIMA_BASE_P4 =
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
  istoriko: { rolos: 'xristis' | 'montelo'; keimeno: string }[];
  leitourgia: LeitourgiaTutor;
  erotisi: string;
  /** Τρόπος εξέτασης του μαθήματος — αλλάζει τις οδηγίες ύφους του tutor (T4). */
  tropos?: TroposExetasis;
  /** Υψος απαιτήσεων ύφους — καθοδηγεί το συστηματικό ύφος (T4). */
  yfos_exigisis?: YfosExigisis;
}

export function prompt_tutor(eisodos: EisodosTutor): AitisiPrompt<TutorApotelesma> {
  const istoriko = eisodos.istoriko
    .slice(-MEGISTO_MIKOS_ISTORIKOU)
    .map((m) => `${KARTA_ROLON_SYZITISIS[m.rolos]}: ${m.keimeno}`)
    .join('\n');

  const yfos_exigisis = eisodos.yfos_exigisis ?? YFOS_EXIGISIS_PROEPILOGI;
  const tropos = enotita_tropou_tis_xristis(eisodos.tropos);
  if (!tropos.ok) {
    throw new Error(`P4: άγνωστος τρόπος εξέτασης «${String(eisodos.tropos)}».`);
  }

  return {
    sistima:
      // Το ύφος (T4): ρυθμίζει το συστηματικό ύφος βάσει των ρυθμίσεων.
      enotita_yfos_tis_sistimatos(yfos_exigisis) +
      SISTIMA_BASE_P4,
    xristis:
      enotita_se_keimeno('Ενότητα', [
        `id: ${eisodos.enotita.id}`,
        `τίτλος: ${eisodos.enotita.titlos}`,
        `έννοιες: ${eisodos.enotita.ennoies.join(', ')}`,
      ]) +
      // Ο τρόπος εξέτασης (T4): οδηγίες ύφους συγκεκριμένες για τον τύπο εξετάσεως.
      tropos.timi +
      enotita_se_keimeno('Λειτουργία', [`leitourgia: ${eisodos.leitourgia}`]) +
      enotita_se_keimeno('Οδηγός ενότητας', [perivale_dedomena(eisodos.odigos)]) +
      enotita_se_keimeno('Ιστορικό συζήτησης', [perivale_dedomena(istoriko)]) +
      enotita_se_keimeno('Τρέχουσα ερώτηση μαθητή', [perivale_dedomena(eisodos.erotisi)]),
    sisma: TutorApotelesmaSchema,
    ekdosi_prompt: EKDOSI_PROMPT_P4,
  };
}
