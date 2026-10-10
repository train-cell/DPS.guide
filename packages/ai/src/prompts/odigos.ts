import { ParapompiSchema, MAX_SELIDES_ANA_KLISI, MAX_XARAKTIRES_ANA_KLISI } from '@dps/core';
import type { Enotita, Selida } from '@dps/core';
import { z } from 'zod';
import { EKDOSI_PROMPT_P3 } from './ekdoseis.js';
import type { AitisiPrompt } from './koines.js';
import { enotita_se_keimeno, perivale_dedomena } from './koines.js';
import { kopse_se_kommatia } from './perigramma.js';

export const ENOTITES_ODIGOU = [
  '🎯 Στόχοι',
  '👶 ELI5',
  '🔬 Θεωρία',
  '🧪 Λυμένο παράδειγμα',
  '⚠️ Παγίδες',
  '🔗 Συνδέσεις',
  '✅ Αυτοέλεγχος',
] as const;

export const ELAXISTES_EROTISEIS_AUTOELGXOU = 3;
export const MEGISTES_EROTISEIS_AUTOELGXOU = 5;

export const OdigosApotelesmaSchema = z.object({
  markdown: z.string(),
  parapompes: z.array(ParapompiSchema),
});
export type OdigosApotelesma = z.infer<typeof OdigosApotelesmaSchema>;

const SISTIMA_P3 =
  enotita_se_keimeno('Ρόλος', [
    'Γράφεις τον οδηγό μελέτης μιας ενότητας για μαθητή ελληνικού πανεπιστημίου, στα ελληνικά.',
  ]) +
  enotita_se_keimeno('Υποχρεωτικές ενότητες (με αυτή ακριβώς τη σειρά)', [
    ENOTITES_ODIGOU.map((e) => `## ${e}`).join('\n'),
  ]) +
  enotita_se_keimeno('Κανόνες', [
    '- Κάθε ενότητα του οδηγού γράφεται με την ακριβώς παραπάνω μορφή «## <εικονίδιο> <τίτλος>».',
    '- Το ύφος πάει από το απλό (ELI5) προς τη θεωρία, μετά δείχνει μοτίβα εξετάσεων και τελειώνει με τις παγίδες.',
    '- Το λυμένο παράδειγμα πηγάζει ΑΠΟΚΛΕΙΣΤΙΚΑ από το δεδομένο υλικό. Αν δεν υπάρχει λυμένο παράδειγμα στο υλικό, γράφεις ακριβώς: Δεν υπάρχει λυμένο παράδειγμα στο υλικό',
    `- Ο αυτοέλεγχος έχει από ${ELAXISTES_EROTISEIS_AUTOELGXOU} έως ${MEGISTES_EROTISEIS_AUTOELGXOU} ερωτήσεις. Κάθε ερώτηση συνοδεύεται από την απάντησή της μέσα σε εισαγωγικά με το πρόθεμα «Απάντηση:».`,
    '- Κάθε παράγραφος του οδηγού κλείνει με παραπομπή στη μορφή [[arxeio_id:σελίδα]], χωρίς να αλλάζει η μορφή των αγκύλων.',
    '- Οι παραπομπές αναφέρονται ΜΟΝΟ σε σελίδες που δίνονται παρακάτω ως επιτρεπόμενες. Απαγορεύεται να παραπέμψεις σε σελίδα εκτός εύρους.',
    '- Αριθμητικός υπολογισμός που δεν υπάρχει αυτούσιος στο υλικό πρέπει να σημειώνεται με «⚠️ μη επαληθευμένο». Απαγορεύεται να παρουσιάζεις ως γεγονός κάτι που δεν υπολόγισε η πηγή.',
    '- Μην επινοείς. Ό,τι δεν τεκμηριώνεται από το υλικό δεν μπαίνει στον οδηγό: Δεν υπάρχει στο υλικό.',
    '- Το markdown περιλαμβάνει ΜΟΝΟ τις 7 υποχρεωτικές ενότητες, με σαφείς παραγράφους και παραπομπές.',
  ]);

export interface EisodosOdigou {
  enotita: Enotita;
  selides: Selida[];
}

export function prompt_odigou(eisodos: EisodosOdigou): AitisiPrompt<OdigosApotelesma> {
  const epitrepomenes = eisodos.enotita.piges.map(
    (p) => `- ${p.arxeio_id}: από ${p.apo} έως ${p.eos}`
  );

  const kommatia = kopse_se_kommatia(eisodos.selides);
  if (kommatia.length > 1) {
    throw new Error(
      `P3: τα κείμενα πηγών της ενότητας «${eisodos.enotita.id}» ξεπερνούν τα ` +
        `MAX_SELIDES_ANA_KLISI (${MAX_SELIDES_ANA_KLISI}) ή MAX_XARAKTIRES_ANA_KLISI ` +
        `(${MAX_XARAKTIRES_ANA_KLISI}) — δεν επιτρέπεται σιωπηρή αποκοπή πηγής`
    );
  }

  return {
    sistima: SISTIMA_P3,
    xristis:
      enotita_se_keimeno('Ενότητα', [
        `id: ${eisodos.enotita.id}`,
        `τίτλος: ${eisodos.enotita.titlos}`,
        `έννοιες: ${eisodos.enotita.ennoies.join(', ')}`,
      ]) +
      enotita_se_keimeno('Επιτρεπόμενες παραπομπές', [
        'Οι παραπομπές πρέπει να πέφτουν ΜΟΝΟ στα παρακάτω εύρη:',
        ...epitrepomenes,
      ]) +
      enotita_se_keimeno('Κείμενο πηγών', [
        perivale_dedomena(
          eisodos.selides.map((s) => `[σ.${s.arithmos}] ${s.arxeio_id}\n${s.keimeno}`).join('\n\n')
        ),
      ]),
    sisma: OdigosApotelesmaSchema,
    ekdosi_prompt: EKDOSI_PROMPT_P3,
  };
}
