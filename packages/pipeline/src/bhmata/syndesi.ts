/**
 * Βήμα 1 (§4): σύνδεση με το eClass μέσω του port `EclassPyli.syndesi()`.
 *
 * Οι κωδικοί σφάλματος έρχονται ήδη έτοιμοι από τον adapter (L14): `AUTH_APOTYXIA`
 * για λάθος κωδικό, `SESSION_LIXI` για λήξη συνεδρίας, `DIKTYO`/`TIMEOUT` για
 * δίκτυο. Η ροή ΔΕΝ κάνει δεύτερη προσπάθεια (κανόνας §8: κλείδωμα λογαριασμού).
 */

import type { Apotelesma } from '@dps/core';
import type { EisodosPipeline } from '../porte.js';

/** Βήμα 1: σύνδεση με το eClass. */
export async function syndesi(p: EisodosPipeline): Promise<Apotelesma<void>> {
  const apotelesma = await p.eclass.syndesi();
  if (!apotelesma.ok) {
    p.katagrafi.sfalma('syndesi: η σύνδεση με το eClass απέτυχε', {
      kodikos: apotelesma.sfalma.kodikos,
    });
    return apotelesma;
  }
  p.katagrafi.pliroforia('syndesi: σύνδεση με το eClass επιτυχής');
  return apotelesma;
}