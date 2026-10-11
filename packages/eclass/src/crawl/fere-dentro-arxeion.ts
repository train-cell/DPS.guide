import type { Apotelesma, KomvosArxeiou } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { PROEPILEGMENO_TIMEOUT_MS, VASIKO_URL_ECLASS } from '../statheres.js';
import { ektelesi_me_session } from '../auth/ektelesi-me-session.js';
import type { AuthPerivallon, SyndesiStratigiki } from '../auth/typoi.js';
import { analysi_fakelou_html } from './parsing-html.js';
import type { EpilogesCrawl } from './typoi.js';

interface OuraFakelou {
  rel_path: string;
  url: string;
}

const PROTYPOS_KODIKOU = /^[a-zA-Z0-9_\u0370-\u03ff-]+$/;

function perimene(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ανακτά το πλήρες δέντρο εγγράφων (αρχείων και φακέλων) ενός μαθήματος
 * χρησιμοποιώντας διάσχιση κατά πλάτος (BFS).
 *
 * Εγγυήσεις:
 * 1. Ο πρώτος κόμβος είναι πάντοτε η ρίζα (diadromi = '').
 * 2. Ακριβώς μία ρίζα.
 * 3. 404 σε υποφάκελο -> προειδοποίηση και συνέχεια της διάσχισης.
 * 4. Υποστήριξη ελληνικών ονομάτων (Unicode NFC).
 */
export async function fere_dentro_arxeion(
  perivallon: AuthPerivallon,
  stratigiki: SyndesiStratigiki,
  kodikos: string,
  epiloges: EpilogesCrawl = {}
): Promise<Apotelesma<KomvosArxeiou[]>> {
  if (!kodikos || !PROTYPOS_KODIKOU.test(kodikos)) {
    return apotyxia(
      'DEN_VRETHIKE',
      `Μη έγκυρος κωδικός μαθήματος «${kodikos}». Επιτρέπονται μόνο γράμματα, ψηφία, «-» και «_».`
    );
  }

  const base = (perivallon.base_url ?? VASIKO_URL_ECLASS).replace(/\/+$/, '');
  const url_rizas = `${base}/courses/${kodikos}/document/`;

  const riza_komvos: KomvosArxeiou = {
    typos: 'fakelos',
    onoma: '',
    diadromi: '',
    url: url_rizas,
    megethos: null,
    imerominia: null,
  };

  const dendro: KomvosArxeiou[] = [riza_komvos];
  const oura: OuraFakelou[] = [{ rel_path: '', url: url_rizas }];
  const episkeptemenoi = new Set<string>(['']);

  const kathysterisi = epiloges.kathysterisi_ms ?? 0;
  const simatodotis = epiloges.simatodotis;

  while (oura.length > 0) {
    if (simatodotis?.aborted) {
      return apotyxia('AKYROTHIKE', 'Η διάσχιση εγγράφων ακυρώθηκε');
    }

    const trexwn = oura.shift();
    if (!trexwn) break;

    const apantisi = await ektelesi_me_session(perivallon, stratigiki, {
      methodos: 'GET',
      url: trexwn.url,
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: PROEPILEGMENO_TIMEOUT_MS,
      typos_apantisis: 'keimeno',
      ...(simatodotis ? { simatodotis } : {}),
    });

    if (!apantisi.ok) {
      // Αν η ρίζα επιστρέψει σφάλμα, αποτυγχάνουμε
      if (trexwn.rel_path === '') {
        return apantisi;
      }
      // Σε υποφάκελο: 404 ή σφάλμα -> προειδοποίηση και συνέχεια
      continue;
    }

    const katastasi = apantisi.timi.katastasi;
    if (katastasi === 404) {
      if (trexwn.rel_path === '') {
        return apotyxia(
          'DEN_VRETHIKE',
          `Δεν βρέθηκε ο φάκελος εγγράφων του μαθήματος «${kodikos}»`
        );
      }
      // Υποφάκελος 404 -> παράλειψη και συνέχεια
      continue;
    }

    if (katastasi < 200 || katastasi >= 300) {
      if (trexwn.rel_path === '') {
        return apotyxia(
          'DIKTYO',
          `Αποτυχία ανάκτησης εγγράφων μαθήματος: HTTP ${katastasi}`
        );
      }
      continue;
    }

    const html = apantisi.timi.keimeno ?? '';
    const parsing = analysi_fakelou_html(html, trexwn.url, trexwn.rel_path);

    // Προσθήκη υποφακέλων στην ουρά BFS και στο δένδρο
    for (const fakelos of parsing.fakeloi) {
      const kanoniki_diadromi = fakelos.rel_path.normalize('NFC');
      if (episkeptemenoi.has(kanoniki_diadromi)) continue;
      episkeptemenoi.add(kanoniki_diadromi);

      dendro.push({
        typos: 'fakelos',
        onoma: fakelos.onoma.normalize('NFC'),
        diadromi: kanoniki_diadromi,
        url: fakelos.url,
        megethos: null,
        imerominia: null,
      });

      oura.push({
        rel_path: kanoniki_diadromi,
        url: fakelos.url,
      });
    }

    // Προσθήκη αρχείων στο δένδρο
    for (const arxeio of parsing.arxeia) {
      const kanoniki_diadromi = arxeio.rel_path.normalize('NFC');
      if (episkeptemenoi.has(kanoniki_diadromi)) continue;
      episkeptemenoi.add(kanoniki_diadromi);

      dendro.push({
        typos: 'arxeio',
        onoma: arxeio.onoma.normalize('NFC'),
        diadromi: kanoniki_diadromi,
        url: arxeio.url,
        megethos: arxeio.megethos,
        imerominia: arxeio.imerominia,
      });
    }

    if (kathysterisi > 0 && oura.length > 0) {
      await perimene(kathysterisi);
    }
  }

  return ok(dendro);
}
