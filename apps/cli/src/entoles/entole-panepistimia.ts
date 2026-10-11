import type { Apotelesma } from '@dps/core';
import { ok, fere_ola_ta_panepistimia, filtrare_panepistimia } from '@dps/core';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ExodosEn } from '../eksodos/exodos-en.js';

/**
 * Εντολή CLI: `panepistimia [ANAZITISI]`.
 * Εμφανίζει τη λίστα των υποστηριζόμενων ελληνικών πανεπιστημίων,
 * των τμημάτων Πληροφορικής/STEM, καθώς και των eClass portals.
 */
export async function trexe_panepistimia(
  _eisodos: EisodosPipeline,
  ori_arg: readonly string[]
): Promise<Apotelesma<ExodosEn>> {
  const oros = ori_arg[0]?.trim();
  const lista =
    oros && oros.length > 0
      ? filtrare_panepistimia({ anazitisi: oros })
      : fere_ola_ta_panepistimia();

  if (lista.length === 0) {
    return ok({
      eidos: 'plirofories',
      minima: `Δεν βρέθηκαν πανεπιστήμια με όρο αναζήτησης: "${oros ?? ''}". Μπορείς να χρησιμοποιήσεις προσαρμοσμένο URL με τη ρύθμιση ECLASS_BASE_URL.`,
    });
  }

  const grammes = [
    `Υποστηριζόμενα Ελληνικά Ακαδημαϊκά Ιδρύματα (${lista.length}):`,
    '',
    ...lista.map((p) => {
      const stemSima = p.kategoria === 'pliroforiki_stem' ? ' [STEM/CS]' : '';
      return `• [${p.id}] ${p.syntomi_onomasia} — ${p.onoma} (${p.poli})${stemSima}\n  Τμήμα/Πύλη: ${p.tmima} | LMS: ${p.typos_lms}\n  URL: ${p.base_url}`;
    }),
    '',
    'Χρήση: Όρισε ECLASS_PANEPISTIMIO_ID=<id> ή ECLASS_BASE_URL=<url> για προσαρμοσμένη σύνδεση.',
  ];

  return ok({
    eidos: 'plirofories',
    minima: grammes.join('\n'),
  });
}
