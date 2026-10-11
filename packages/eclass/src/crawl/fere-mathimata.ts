import type { Apotelesma, Mathima } from '@dps/core';
import { MathimaSchema, apotyxia, ok } from '@dps/core';
import { PATH_PORTFOLIO, PROEPILEGMENO_TIMEOUT_MS, VASIKO_URL_ECLASS } from '../statheres.js';
import { ektelesi_me_session } from '../auth/ektelesi-me-session.js';
import type { AuthPerivallon, SyndesiStratigiki } from '../auth/typoi.js';
import { analysi_portfolio_html } from './parsing-html.js';
import type { EpilogesCrawl } from './typoi.js';

/**
 * Ανακτά τη λίστα των εγγεγραμμένων μαθημάτων του χρήστη από το Open eClass.
 * Χρησιμοποιεί τον μηχανισμό ektelesi_me_session για αυτόματη επανασύνδεση αν έχει λήξει η συνεδρία.
 */
export async function fere_mathimata(
  perivallon: AuthPerivallon,
  stratigiki: SyndesiStratigiki,
  _epiloges?: EpilogesCrawl
): Promise<Apotelesma<Mathima[]>> {
  const base = (perivallon.base_url ?? VASIKO_URL_ECLASS).replace(/\/+$/, '');
  const url_portfolio = `${base}${PATH_PORTFOLIO}`;

  const apantisi = await ektelesi_me_session(perivallon, stratigiki, {
    methodos: 'GET',
    url: url_portfolio,
    akolouthise_anakateuthinseis: true,
    xronos_orio_ms: PROEPILEGMENO_TIMEOUT_MS,
    typos_apantisis: 'keimeno',
  });

  if (!apantisi.ok) {
    return apantisi;
  }

  const katastasi = apantisi.timi.katastasi;
  if (katastasi < 200 || katastasi >= 300) {
    return apotyxia('DIKTYO', `Αποτυχία ανάκτησης μαθημάτων: HTTP κατάσταση ${katastasi}`);
  }

  const keimeno = apantisi.timi.keimeno ?? '';
  const mathimata_raw = analysi_portfolio_html(keimeno, base);

  if (mathimata_raw.length === 0) {
    return apotyxia(
      'DEN_VRETHIKE',
      'Δεν βρέθηκαν εγγεγραμμένα μαθήματα στο portfolio του χρήστη'
    );
  }

  const mathimata: Mathima[] = [];
  for (const stoixeio of mathimata_raw) {
    const parsed = MathimaSchema.safeParse(stoixeio);
    if (!parsed.success) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Μη έγκυρο σχήμα μαθήματος: ${parsed.error.message}`
      );
    }
    mathimata.push(parsed.data);
  }

  return ok(mathimata);
}
