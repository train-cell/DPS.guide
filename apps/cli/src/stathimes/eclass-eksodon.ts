import type { Apotelesma, EclassPyli, KomvosArxeiou, Mathima } from '@dps/core';
import { apotyxia } from '@dps/core';

/**
 * Πού θα έπρεπε να ζει ο `EclassPyli` (κάρτες L14 `auth` + L15 `crawl`).
 *
 * Το `packages/eclass` δεν υπάρχει ακόμα στο repo, οπότε το CLI δεν μπορεί να
 * συνδεθεί στο eClass. Μέχρι τότε κάθε κλήση επιστρέφει ρητό σφάλμα
 * `MI_YPOSTIRIZOMENO` — ΠΟΤΕ ψεύτικη επιτυχία και ΠΟΤΕ αχνή υπόθεση για το
 * πρωτόκολλο (κανόνας §3.7: κανένα endpoint/selector χωρίς fixture).
 */
export const POU_KEITAI_TO_ECLASS = 'packages/eclass (κάρτες L14/L14-L15)';

/**
 * `EclassPyli` ρητά «μη υλοποιημένο».
 *
 * Υπάρχει μόνο ώστε να συμπληρωθεί η `EisodosPipeline`. Κάθε μέθοδος επιστρέφει
 * `MI_YPOSTIRIZOMENO` με σαφή αιτία, ώστε ο χρήστης να βλέπει error state (§3.9).
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
