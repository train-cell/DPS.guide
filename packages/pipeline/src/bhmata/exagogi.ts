/**
 * Βήμα 4 (§4): εξαγωγή κειμένου ανά αρχείο → `keimeno/<arxeio_id>.json` (`Selida[]`).
 *
 * Η εξαγωγή είναι deterministic και περνά από το `@dps/extract` (L05/L06).
 * Idempotent: αν το `keimeno/<arxeio_id>.json` υπάρχει ήδη, το βήμα το παραλείπει.
 * Κανένα μισό αρχείο: το `ApothikiPyli.grapse_keimeno` είναι atomic, και σε σφάλμα
 * του extract δεν γράφεται τίποτα — επιστρέφεται `Apotelesma` με `Sfalma`.
 */

import type { Apotelesma, Selida } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import type { EisodosPipeline, Metriti } from '../porte.js';
import { arxeio_keimenou, me_riza } from '../statheroi.js';
import { diavase_arxeia } from '../grammata/apothiki-json.js';
import { grapse_json } from '../grammata/apothiki-json.js';
import { ektekseven_arxeio } from '../grammata/diadromes.js';
import { diadromi_arxeiou } from '../statheroi.js';

/** Επεκτάσεις με πραγματική εξαγωγή κειμένου από το `@dps/extract`. */
const EXAGOGESIMES_EPITEKSEIS = new Set(['pdf', 'pptx', 'docx']);

/** Επιστρέφει τις σελίδες ενός αρχείου ή το σφάλμα του extract, ποτέ εξαίρεση. */
async function exagage_arxeio(
  dedomena: Uint8Array,
  arxeio_id: string,
  epiteksi: string,
  onoma: string
): Promise<Apotelesma<Selida[]>> {
  switch (epiteksi) {
    case 'pdf':
      return (await import('@dps/extract')).exagage_pdf(dedomena, arxeio_id);
    case 'pptx':
      return (await import('@dps/extract')).exagage_pptx(dedomena, arxeio_id);
    case 'docx':
      return (await import('@dps/extract')).exagage_docx(dedomena, arxeio_id);
    default:
      return apotyxia('MI_YPOSTIRIZOMENO', `Δεν υπάρχει εξαγωγή για την επέκταση «${epiteksi}»`, onoma);
  }
}

/** Βήμα 4: εξαγωγή κειμένου για κάθε αρχείο ενός μαθήματος. */
export async function exagogi(
  p: EisodosPipeline,
  kodikos_mathimatos: string
): Promise<Apotelesma<Metriti>> {
  const eurethrio = await diavase_arxeia(p.apothiki, p.riza, kodikos_mathimatos);
  if (!eurethrio.ok) {
    p.katagrafi.sfalma('exagogi: το ευρετήριο αρχείων δεν διαβάστηκε', {
      kodikos: eurethrio.sfalma.kodikos,
      kodikos_mathimatos,
    });
    return eurethrio;
  }

  const arxeia = eurethrio.timi;
  let megaliteres = 0;

  for (const arxeio of arxeia) {
    const epiteksi = ektekseven_arxeio(arxeio.diadromi);
    if (!EXAGOGESIMES_EPITEKSEIS.has(epiteksi)) {
      p.katagrafi.proeidopoiisi(
        `exagogi: παραλείφθηκε το «${arxeio.diadromi}»· δεν υπάρχει εξαγωγή κειμένου για «${epiteksi}»`,
        { kodikos_mathimatos, arxeio_id: arxeio.id }
      );
      continue;
    }

    const keimena = me_riza(p.riza, arxeio_keimenou(kodikos_mathimatos, arxeio.id));
    if (await p.apothiki.yparxei(keimena)) {
      continue;
    }

    const diadromi_arxeio = me_riza(
      p.riza,
      diadromi_arxeiou(kodikos_mathimatos, arxeio.diadromi)
    );
    const dedomena = await p.apothiki.diavase_dyadiko(diadromi_arxeio);
    if (!dedomena.ok) {
      p.katagrafi.sfalma('exagogi: το αρχείο δεν διαβάστηκε', {
        kodikos: dedomena.sfalma.kodikos,
        kodikos_mathimatos,
        arxeio_id: arxeio.id,
      });
      return dedomena;
    }

    const extraction = await exagage_arxeio(dedomena.timi, arxeio.id, epiteksi, arxeio.diadromi);
    if (!extraction.ok) {
      p.katagrafi.sfalma('exagogi: η εξαγωγή κειμένου απέτυχε', {
        kodikos: extraction.sfalma.kodikos,
        kodikos_mathimatos,
        arxeio_id: arxeio.id,
        minima: extraction.sfalma.minima,
      });
      return extraction;
    }

    let pages = extraction.timi;
    if (epiteksi === 'pdf' && p.ocr !== undefined) {
      const recovered: Selida[] = [];
      for (const page of pages) {
        if (!page.xoris_keimeno) {
          recovered.push(page);
          continue;
        }
        const recognized = await p.ocr.anagnorise_pdf_selida(dedomena.timi, page.arithmos);
        if (!recognized.ok) {
          p.katagrafi.sfalma('exagogi: το τοπικό OCR απέτυχε', {
            kodikos: recognized.sfalma.kodikos,
            kodikos_mathimatos,
            arxeio_id: arxeio.id,
            selida: page.arithmos,
          });
          return recognized;
        }
        const text = recognized.timi.normalize('NFC').replace(/\s+/g, ' ').trim();
        const words = text.length === 0 ? 0 : text.split(' ').length;
        recovered.push({ ...page, keimeno: text, lekseis: words, xoris_keimeno: words < 2 });
      }
      pages = recovered;
    }

    const grapse = await grapse_json(p.apothiki, keimena, pages);
    if (!grapse.ok) {
      p.katagrafi.sfalma('exagogi: απέτυχε η εγγραφή του εξαγόμενου κειμένου', {
        kodikos: grapse.sfalma.kodikos,
        kodikos_mathimatos,
        arxeio_id: arxeio.id,
      });
      return grapse;
    }
    megaliteres += 1;
  }

  p.katagrafi.pliroforia('exagogi: ο εξαγόμενος κείμενος ενημερώθηκε', {
    kodikos_mathimatos,
    megaliteres,
    synolo: arxeia.length,
  });
  return ok({ megaliteres });
}
