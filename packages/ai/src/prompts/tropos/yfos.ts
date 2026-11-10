import type { Apotelesma, TroposExetasis } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { enotita_se_keimeno } from '../koines.js';
import { enotita_tropou } from './index.js';

/** Υψος απαιτήσεων ύφους για τις εξετάσεις (Ρυθμίσεις). */
export type YfosExigisis = 'apla' | 'kanoniko' | 'texniko';

/** Όλες οι επιλογές ύφους, με τη σειρά παρουσίασης. */
export const YFOS_EXIGISIS: readonly YfosExigisis[] = ['apla', 'kanoniko', 'texniko'];

/** Τίτλος της ενότητας οδηγιών ύφους που ενσωματώνεται στα P3/P4. */
export const TITLOS_YFOS = 'Ύφος εξεταστικής';

/** Οδηγίες ύφους ανά επίπεδο απαιτήσεων, ευθυγραμμισμένες με το §7.1 (P3 ύφος). */
export const ODIGIES_YFOS: Record<YfosExigisis, readonly string[]> = {
  apla: [
    'Χρησιμοποίησε απλή γλώσσα, χωρίς τεχνική ορολογία όπου γίνεται.',
    'Εξήγηση βήμα-βήμα, σαν να μαθαίνει ο μαθητής το θέμα για πρώτη φορά.',
    'Παράδειγμα από καθημερινή ζωή, αν ταιριάζει στο θέμα.',
  ],
  kanoniko: [
    'Τυπική ακαδημαϊκή γλώσσα με την ορολογία του μαθήματος.',
    'Σαφής δομή: ορισμός, εφαρμογή, παράδειγμα.',
  ],
  texniko: [
    'Χρησιμοποίησε τον πλήρη τεχνικό τύπο και την αυστηρή ορολογία του μαθήματος.',
    'Ακρίβεια διατύπωσης πάνω από κάθε άλλη Consideration.',
  ],
};

/**
 * Επιστρέφει τις οδηγίες ύφους για ένα επίπεδο απαιτήσεων (T4).
 *
 * Pure και ντετερμινιστικό: ίδιο ύφος → ίδιες ακριβώς γραμμές. Σε άγνωστο
 * ύφος επιστρέφεται `MI_EGKYRO_SXIMA` — ποτέ ψεύτικο περιεχόμενο με default ύφος.
 */
export function odos_yfos(yfos: YfosExigisis): Apotelesma<string[]> {
  const odigies = ODIGIES_YFOS[yfos];
  if (odigies === undefined) {
    return apotyxia(
      'MI_EGKYRO_SXIMA',
      `Άγνωστο ύφος εξεταστικής «${String(yfos)}»· αναμενόμενο ένα από: ${YFOS_EXIGISIS.join(', ')}`
    );
  }
  return ok([...odigies]);
}

/**
 * Τυλίγει τις οδηγίες του ύφους σε ενότητα κειμένου έτοιμη για ενσωμάτωση
 * στα prompts P3 (οδηγός) και P4 (tutor) (ίδιο φορμάτ `## <τίτλος>`).
 */
export function enotita_yfos_exigisis(yfos: YfosExigisis): Apotelesma<string> {
  const odigies = odos_yfos(yfos);
  if (!odigies.ok) {
    return odigies;
  }
  return ok(
    enotita_se_keimeno(TITLOS_YFOS, [
      `yfos_exigisis: ${yfos}`,
      ...odigies.timi.map((o) => `- ${o}`),
    ])
  );
}

/**
 * Επιστρέφει το default ύφος όταν δεν ορίζεται στις ρυθμίσεις.
 * Το `kanoniko` είναι η προεπιλογή του §7.1 (P3/P4).
 */
export const YFOS_EXIGISIS_PROEPILOGI: YfosExigisis = 'kanoniko';

/**
 * Ενσωματώνει το ύφος στις οδηγίες του συστήματος (P3/P4).
 *
 * Δέχεται `undefined` ή `null` και επιστρέφει κενό κείμενο σε αυτή την περίπτωση,
 * ώστε η κλήση να μένει back-compatible με τις υπάρχουσες κλήσεις.
 */
export function enotita_yfos_tis_sistimatos(yfos: YfosExigisis | undefined | null): string {
  if (yfos === undefined || yfos === null) {
    return '';
  }
  const apotelesma = enotita_yfos_exigisis(yfos);
  if (!apotelesma.ok) {
    return '';
  }
  return apotelesma.timi;
}

/** Ενσωματώνει τον τρόπο εξέτασης στις οδηγίες του χρήστη (P3/P4). */
export function enotita_tropou_tis_xristis(
  tropos: TroposExetasis | undefined | null
): Apotelesma<string> {
  if (tropos === undefined || tropos === null) {
    return ok('');
  }
  return enotita_tropou(tropos);
}
