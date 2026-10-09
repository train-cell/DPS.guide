import type { Apotelesma } from '../contracts/apotelesma.js';
import type { Perigramma, Selida } from '../contracts/montela.js';
import { apotyxia, ok } from '../helpers.js';
import {
  ALFA_EWMA,
  ELAXISTO_KLASMA,
  ELAXISTOS_SYNTELESTIS,
  MEGISTO_KLASMA,
  MEGISTOS_SYNTELESTIS,
  MESES_LEKSEIS_SELIDAS,
  RYTHMOS_LEPTA_ANA_TYPO,
} from '../statheres.js';

/** Κλειδί ευρετηρίου σελίδας: σταθερό, ανεξάρτητο από σειρά εισόδου. */
function kleidi_selidas(arxeio_id: string, arithmos: number): string {
  return `${arxeio_id}:${arithmos}`;
}

/** Περιορίζει την τιμή στο κλειστό διάστημα [elaxisto, megisto]. */
function clamp(timi: number, elaxisto: number, megisto: number): number {
  if (timi < elaxisto) {
    return elaxisto;
  }
  if (timi > megisto) {
    return megisto;
  }
  return timi;
}

/**
 * Εκτιμά τα λεπτά μελέτης ενός περιγράμματος από τις σελίδες του.
 *
 * Για κάθε τμήμα και κάθε αριθμό σελίδας στο εύρος του, βρίσκει τη σελίδα
 * με ίδιο `arxeio_id` και πολλαπλασιάζει τον ρυθμό λεπτών/σελίδα του τύπου
 * με το κλάσμα πυκνότητας `lekseis / MESES_LEKSEIS_SELIDAS`, περιορισμένο
 * στο [ELAXISTO_KLASMA, MEGISTO_KLASMA]. Σελίδες που λείπουν παραλείπονται.
 * Το άθροισμα πολλαπλασιάζεται με τον συντελεστή χρήστη. Ντετερμινιστικό:
 * η σειρά άθροισης δεν εξαρτάται από τη σειρά εισόδου.
 */
export function ektimisi_lepton(
  perigramma: Perigramma,
  selides: Selida[],
  syntelestis_xristi = 1
): Apotelesma<number> {
  if (!Number.isFinite(syntelestis_xristi) || syntelestis_xristi <= 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Ο συντελεστής χρήστη πρέπει να είναι πεπερασμένος θετικός αριθμός.');
  }
  for (const selida of selides) {
    if (!Number.isFinite(selida.lekseis) || selida.lekseis < 0) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Οι λέξεις σελίδας πρέπει να είναι πεπερασμένος μη αρνητικός αριθμός.');
    }
  }

  const xartis_selidon = new Map<string, number>();
  for (const selida of selides) {
    xartis_selidon.set(kleidi_selidas(selida.arxeio_id, selida.arithmos), selida.lekseis);
  }

  let synolo = 0;
  for (const tmima of perigramma.tmimata) {
    const rythmos = RYTHMOS_LEPTA_ANA_TYPO[tmima.typos];
    for (let arithmos = tmima.selides.apo; arithmos <= tmima.selides.eos; arithmos += 1) {
      const lekseis = xartis_selidon.get(kleidi_selidas(perigramma.arxeio_id, arithmos));
      if (lekseis === undefined) {
        continue;
      }
      const klasma = clamp(lekseis / MESES_LEKSEIS_SELIDAS, ELAXISTO_KLASMA, MEGISTO_KLASMA);
      synolo += rythmos * klasma;
    }
  }

  return ok(synolo * syntelestis_xristi);
}

/**
 * Ενημερώνει τον προσωπικό συντελεστή ταχύτητας με EWMA.
 *
 * `neos = (1 − ALFA_EWMA) · palios + ALFA_EWMA · (pragmatika / ektimisi)`,
 * με περιορισμό στο [ELAXISTOS_SYNTELESTIS, MEGISTOS_SYNTELESTIS].
 */
export function enimerosi_syntelesti(
  palios_syntelestis: number,
  ektimisi_lepta: number,
  pragmatika_lepta: number
): Apotelesma<number> {
  if (
    !Number.isFinite(palios_syntelestis) ||
    palios_syntelestis < ELAXISTOS_SYNTELESTIS ||
    palios_syntelestis > MEGISTOS_SYNTELESTIS
  ) {
    return apotyxia(
      'MI_EGKYRO_SXIMA',
      'Ο παλιός συντελεστής πρέπει να είναι εντός του επιτρεπτού διαστήματος.'
    );
  }
  if (!Number.isFinite(ektimisi_lepta) || ektimisi_lepta <= 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η εκτίμηση πρέπει να είναι πεπερασμένος θετικός αριθμός.');
  }
  if (!Number.isFinite(pragmatika_lepta) || pragmatika_lepta < 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Τα πραγματικά λεπτά πρέπει να είναι πεπερασμένος μη αρνητικός αριθμός.');
  }

  const logos = pragmatika_lepta / ektimisi_lepta;
  const neos = (1 - ALFA_EWMA) * palios_syntelestis + ALFA_EWMA * logos;
  return ok(clamp(neos, ELAXISTOS_SYNTELESTIS, MEGISTOS_SYNTELESTIS));
}
