import type { Apotelesma } from '@dps/core';
import { ok } from '@dps/core';
import { syndesi } from '@dps/pipeline';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ExodosEn } from '../eksodos/exodos-en.js';
import {
  katastaseis_mystikon,
  grammes_katastaseon,
  sfalma_leipton_diapisteuterion,
} from './mystika-katastaseis.js';

/**
 * Βήμα 1 (§4): σύνδεση με το eClass.
 *
 * Τα διαπιστευτήρια διαβάζονται από το `MystikaPyli` (Windows Credential Manager με
 * fallback σε μεταβλητές περιβάλλοντος). Αν λείπουν, σταματάμε ΠΡΙΝ το βήμα — δεν
 * ξεκινάμε σύνδεση που θα αποτύχει κατά τυχαίο (§3.9: ποτέ ψεύτικη επιτυχία).
 */
export async function trexe_syndesi(eisodos: EisodosPipeline): Promise<Apotelesma<ExodosEn>> {
  const katastaseis = await katastaseis_mystikon(eisodos);
  const leipa = sfalma_leipton_diapisteuterion(katastaseis);
  if (leipa !== null) {
    return leipa;
  }
  const apotelesma = await syndesi(eisodos);
  if (!apotelesma.ok) {
    return apotelesma;
  }
  return ok({
    eidos: 'plirofories',
    minima: [`Η σύνδεση ολοκληρώθηκε.`, ...grammes_katastaseon(katastaseis)].join('\n'),
  });
}
