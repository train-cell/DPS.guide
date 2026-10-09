import type { Apotelesma } from '../contracts/apotelesma.js';
import { apotyxia, ok } from '../helpers.js';

/**
 * Αντιστοίχιση μίας ερώτησης παλιού θέματος σε ενότητα με μονάδες (έξοδος LLM).
 *
 * Η αντιστοίχιση (NLP) γίνεται από το LLM· ο υπολογισμός εδώ είναι 100%
 * deterministic (50/50 boundary, §2 D4).
 */
export interface AntistoixisiThematos {
  enotita_id: string;
  monades: number;
}

/**
 * Υπολογίζει την απόδοση εξέτασης ανά ενότητα (§7.3).
 *
 * `apodosi_exetasis = Σ συχνότητα εμφάνισης × μονάδες`: κάθε αντιστοίχιση
 * ερώτησης συνεισφέρει τις μονάδες της στην ενότητά της. Ίδια είσοδος →
 * ίδια έξοδος.
 */
export function ypologise_apodosi(
  antistoixiseis: AntistoixisiThematos[]
): Apotelesma<Record<string, number>> {
  const apodosi: Record<string, number> = {};
  for (const antistoixisi of antistoixiseis) {
    if (antistoixisi.enotita_id.trim() === '') {
      return apotyxia('MI_EGKYRO_SXIMA', 'Κενό id ενότητας.');
    }
    if (!Number.isFinite(antistoixisi.monades) || antistoixisi.monades < 0) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Οι μονάδες πρέπει να είναι πεπερασμένος μη αρνητικός αριθμός.');
    }
    apodosi[antistoixisi.enotita_id] = (apodosi[antistoixisi.enotita_id] ?? 0) + antistoixisi.monades;
  }
  return ok(apodosi);
}
