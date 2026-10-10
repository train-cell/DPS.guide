import type { Apotelesma, Selida } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ftiaxe_selida, katharise_keimeno } from '../koines.js';

export { ftiaxe_selida, katharise_keimeno };

/** Ανώτατο πλήθος σελίδων που εξάγονται από ένα PDF (φρουράς μνήμης). */
export const MEGISTES_SELIDES_PDF = 5000;

/** Ευθύνη: ενώνει τα τμήματα κειμένου της σελίδας με σεβασμό στα τέλη γραμμής. */
function enose_kommatia(kommatia: readonly string[]): string {
  return kommatia.join('');
}

interface TmimaKeimenou {
  readonly str?: unknown;
  readonly hasEOL?: unknown;
}

function einai_tmima_keimenou(item: unknown): item is { str: string; hasEOL: boolean } {
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  const tmima = item as TmimaKeimenou;
  return typeof tmima.str === 'string';
}

/**
 * Εξάγει τις σελίδες ενός PDF σε `Selida[]` (L05).
 *
 * Χρησιμοποιεί το pdfjs-dist (legacy build για Node/webview χωρίς worker) πάνω
 * από τα bytes του αρχείου: καμία προσπέλαση δικτύου, καμία εγγραφή στο δίσκο.
 * Το κείμενο κάθε σελίδας κανονικοποιείται σε NFC, συμπιέζονται τα κενά και
 * κόβονται οι άκρες· οι σελίδες με λιγότερες από `ELAXISTES_LEKSEIS_SELIDAS`
 * λέξεις σημειώνονται `xoris_keimeno`. Σε κατεστραμμένο αρχείο επιστρέφεται
 * `Apotelesma` σφάλματος (`MI_EGKYRO_SXIMA`), ποτέ exception.
 */
export async function exagage_pdf(
  dedomena: Uint8Array,
  arxeio_id: string
): Promise<Apotelesma<Selida[]>> {
  let fortosi;
  try {
    fortosi = await getDocument({
      data: new Uint8Array(dedomena),
      isEvalSupported: false,
    }).promise;
  } catch (aitia) {
    return apotyxia(
      'MI_EGKYRO_SXIMA',
      'Το PDF δεν μπόρεσε να ανοιχτεί· πιθανόν κατεστραμμένο ή μη έγκυρο αρχείο',
      aitia
    );
  }

  try {
    if (fortosi.numPages > MEGISTES_SELIDES_PDF) {
      return apotyxia(
        'MI_YPOSTIRIZOMENO',
        `Το PDF έχει ${fortosi.numPages} σελίδες· το όριο είναι ${MEGISTES_SELIDES_PDF}`
      );
    }

    const selides: Selida[] = [];
    for (let arithmos = 1; arithmos <= fortosi.numPages; arithmos += 1) {
      const selida = await fortosi.getPage(arithmos);
      const periexomeno = await selida.getTextContent();
      const kommatia: string[] = [];
      for (const item of periexomeno.items) {
        if (!einai_tmima_keimenou(item)) {
          continue;
        }
        kommatia.push(item.str + (item.hasEOL ? '\n' : ' '));
      }
      const keimeno = katharise_keimeno(enose_kommatia(kommatia));
      selides.push(ftiaxe_selida(arxeio_id, arithmos, keimeno));
      selida.cleanup();
    }
    return ok(selides);
  } catch (aitia) {
    return apotyxia(
      'MI_EGKYRO_SXIMA',
      'Η εξαγωγή κειμένου από το PDF απέτυχε· πιθανόν κατεστραμμένη δομή',
      aitia
    );
  } finally {
    await fortosi.destroy();
  }
}
