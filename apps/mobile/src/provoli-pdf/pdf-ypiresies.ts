import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';

/** Η μαγική επικεφαλίδα κάθε PDF: "%PDF". */
const MAGIKI_PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

/** Ελάχιστη κλίμακα απόδοσης μιας σελίδας, ώστε να μην εξαφανίζεται στο καμβά. */
export const ELAXISTI_KLIMAKA = 0.1;

/** Μέγιστη κλίμακα απόδοσης μιας σελίδας, πριν γίνει αναγνώσιμη μόνο με ζουμ. */
export const MEGISTI_KLIMAKA = 4;

/** Μήνυμα αποτυχίας φόρτωσης της βιβλιοθήκης προβολής. */
const MINIMA_VIBLIOTHIKIS = 'Η βιβλιοθήκη προβολής PDF δεν φορτώθηκε.';

/** Η τρέχουσα αποπεμπα απόδοσης· κρατιέται για να ακυρώνεται πριν την επόμενη. */
let trexousaApostoli: { cancel(): void } | null = null;

/** Ελέγχει αν τα byteof ξεκινούν με την υπογεγραμμένη επικεφαλίδα PDF. */
export function einai_pdf(dyadiko: Uint8Array): boolean {
  if (dyadiko.length < MAGIKI_PDF.length) {
    return false;
  }
  return MAGIKI_PDF.every((byte, i) => dyadiko[i] === byte);
}

/** Περιορίζει την κλίμακα απόδοσης στα αποδεκτά όρια. */
export function kilise_klimaka(klimaka: number): number {
  if (!Number.isFinite(klimaka)) {
    return 1;
  }
  return Math.min(Math.max(klimaka, ELAXISTI_KLIMAKA), MEGISTI_KLIMAKA);
}

/** Ακυρώνει την αποπεμπα απόδοσης που τρέχει, ώστε ο καμβάς να μην αποδίδει δύο φορές. */
export function akirose_trexousa_apostoli(): void {
  const apostoli = trexousaApostoli;
  trexousaApostoli = null;
  if (apostoli !== null) {
    apostoli.cancel();
  }
}

/**
 * Αντιγράφει τα byteof πριν το getDocument: το pdf.js μεταφέρει (detach) τον πίνακα
 * στον worker, άστο χωρίς αντίγραφο ο ίδιος πίνακας δεν θα μπορούσε να ανοιχτεί
 * δύο φορές (μία για σελίδες και μία για απόδοση).
 */
export function antigrafo_dyadikon(dyadiko: Uint8Array): Uint8Array {
  const antigrafo = new Uint8Array(dyadiko.length);
  antigrafo.set(dyadiko);
  return antigrafo;
}

/** Ρυθμίζει μία φορά τον worker του pdf.js· η επανάκληψη είναι αθόρυβη. */
export async function etimose_pdfjs(): Promise<Apotelesma<void>> {
  try {
    const [{ default: dramosWorker }, pdfjs] = await Promise.all([
      import('pdfjs-dist/build/pdf.worker.mjs?url'),
      import('pdfjs-dist'),
    ]);
    if (pdfjs.GlobalWorkerOptions.workerSrc !== dramosWorker) {
      pdfjs.GlobalWorkerOptions.workerSrc = dramosWorker;
    }
    return ok(undefined);
  } catch {
    return apotyxia('MI_YPOSTIRIZOMENO', MINIMA_VIBLIOTHIKIS);
  }
}

/** Διαβάζει τον αριθμό σελίδων ενός εγγράφου από τα byteof του, χωρίς να το αποδώσει. */
export async function arithmos_selidon(dyadiko: Uint8Array): Promise<Apotelesma<number>> {
  const etimase = await etimose_pdfjs();
  if (!etimase.ok) {
    return etimase;
  }
  if (!einai_pdf(dyadiko)) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Τα δεδομένα δεν είναι PDF (λείπει η επικεφαλίδα %PDF).');
  }
  try {
    const pdfjs = await import('pdfjs-dist');
    const fortosi = pdfjs.getDocument({ data: antigrafo_dyadikon(dyadiko) });
    const eggrafo = await fortosi.promise;
    const selides = eggrafo.numPages;
    await fortosi.destroy();
    return ok(selides);
  } catch {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το αρχείο δεν ανοίγει ως έγκυρο PDF.');
  }
}

/**
 * Αποδίδει μία σελίδα στο δοθέν καμβά. Μια προηγούμενη απόδοση που τρέχει ακυρώνεται
 * πρώτη, ώστε ένας καμβάς να μην αποδίδει ποτέ δύο εργασίες ταυτόχρονα. Η ακύρωση
 * από νεότερη απόδοση είναι σιωπηρή· μόνο το πραγματικό σφάλμα επιστρέφεται.
 */
export async function stilise_selida(
  dyadiko: Uint8Array,
  arithmos: number,
  kanvas: HTMLCanvasElement,
  klimaka: number
): Promise<Apotelesma<void>> {
  const etimase = await etimose_pdfjs();
  if (!etimase.ok) {
    return etimase;
  }
  akirose_trexousa_apostoli();
  try {
    const pdfjs = await import('pdfjs-dist');
    const fortosi = pdfjs.getDocument({ data: antigrafo_dyadikon(dyadiko) });
    const eggrafo = await fortosi.promise;
    const selida = await eggrafo.getPage(arithmos);
    const provoli = selida.getViewport({ scale: kilise_klimaka(klimaka) });
    const plaisio = kanvas.getContext('2d');
    if (plaisio === null) {
      selida.cleanup();
      await fortosi.destroy();
      return apotyxia('MI_YPOSTIRIZOMENO', 'Ο browser δεν έδωσε καμβά 2d για την απόδοση.');
    }
    kanvas.width = Math.floor(provoli.width);
    kanvas.height = Math.floor(provoli.height);
    const apostoli = selida.render({ canvas: kanvas, canvasContext: plaisio, viewport: provoli });
    trexousaApostoli = apostoli;
    try {
      await apostoli.promise;
      return ok(undefined);
    } catch {
      if (trexousaApostoli === apostoli) {
        trexousaApostoli = null;
        return apotyxia('MI_EGKYRO_SXIMA', 'Η σελίδα δεν αποδόθηκε.');
      }
      return ok(undefined);
    } finally {
      selida.cleanup();
      await fortosi.destroy();
    }
  } catch {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η σελίδα δεν αποδόθηκε.');
  }
}
