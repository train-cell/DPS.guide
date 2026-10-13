import type { Apotelesma, EclassPyli, KomvosArxeiou, Mathima } from '@dps/core';
import { apotyxia } from '@dps/core';

/**
 * Fallback port όταν το CLI δεν έχει διαπιστευτήρια και διεύθυνση portal.
 * Δεν προσποιείται σύνδεση: όλες οι ενέργειες επιστρέφουν σαφές unsupported error.
 */
export const POU_KEITAI_TO_ECLASS = 'διαπιστευτήρια LMS και διεύθυνση portal';

/**
 * `EclassPyli` ρητά «μη υλοποιημένο».
 *
 * Χρησιμοποιείται μόνο ώστε το CLI να αποδίδει χρήσιμο σφάλμα αντί ψεύτικης επιτυχίας.
 */
export class MiYpostirimenoEclassPyli implements EclassPyli {
  private apotyxia_pylis<T>(praksi: string): Apotelesma<T> {
    return apotyxia(
      'MI_YPOSTIRIZOMENO',
      `Η λειτουργία «${praksi}» του eClass δεν είναι διαθέσιμη: λείπει το ${POU_KEITAI_TO_ECLASS}`
    );
  }

  syndesi(): Promise<Apotelesma<void>> {
    return Promise.resolve(this.apotyxia_pylis<void>('syndesi'));
  }

  fere_mathimata(): Promise<Apotelesma<Mathima[]>> {
    return Promise.resolve(this.apotyxia_pylis<Mathima[]>('fere_mathimata'));
  }

  fere_dentro_arxeion(): Promise<Apotelesma<KomvosArxeiou[]>> {
    return Promise.resolve(this.apotyxia_pylis<KomvosArxeiou[]>('fere_dentro_arxeion'));
  }
}
