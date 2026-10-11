import { createHash } from 'node:crypto';
import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import {
  EPITREPOMENES_EPEKTASEIS,
  MEGISTO_MEGETHOS_ARXEIOU_BYTES,
} from '../statheres.js';

const APAGOREYMENOI_XARAKTIRES = /[\\:*?"<>|]/g;

/**
 * Κανονικοποιεί μια διαδρομή eClass κατά το §5.3:
 * Unicode NFC, αφαίρεση απαγορευμένων χαρακτήρων, απαγόρευση «..».
 */
export function kanonikopoiise_diadromi(diadromi: string): Apotelesma<string> {
  if (!diadromi || diadromi.trim() === '') {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αρχείου είναι κενή');
  }

  const einai_fakelos = diadromi.endsWith('/');
  const normalized = diadromi.normalize('NFC');
  const tmimata = normalized
    .split('/')
    .filter((t) => t !== '' && t !== '.')
    .map((t) => t.replace(APAGOREYMENOI_XARAKTIRES, '_').trim());

  if (tmimata.some((t) => t === '..')) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Απαγορεύεται το «..» στη διαδρομή');
  }

  if (tmimata.length === 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή δεν περιέχει έγκυρα τμήματα');
  }

  const enwmeni = tmimata.join('/');
  return ok(einai_fakelos ? `${enwmeni}/` : enwmeni);
}

/**
 * Εξάγει την επέκταση του αρχείου σε πεζά (π.χ. 'pdf').
 * Επιστρέφει κενό string αν δεν υπάρχει επέκταση.
 */
export function pare_epiktasi(diadromi: string): string {
  const onoma = diadromi.slice(diadromi.lastIndexOf('/') + 1);
  const telia = onoma.lastIndexOf('.');
  return telia > 0 ? onoma.slice(telia + 1).toLowerCase() : '';
}

/**
 * Ελέγχει αν η επέκταση περιλαμβάνεται στην allowlist του §8.
 */
export function einai_epitrepomeni_epiktasi(epiktasi: string): boolean {
  return (EPITREPOMENES_EPEKTASEIS as readonly string[]).includes(epiktasi.toLowerCase());
}

/**
 * Ελέγχει αν το μέγεθος υπερβαίνει το μέγιστο επιτρεπόμενο όριο των 100 MB.
 */
export function ypervainei_orio_megethous(megethos: number | null): boolean {
  if (megethos === null) return false;
  return megethos > MEGISTO_MEGETHOS_ARXEIOU_BYTES;
}

/**
 * Υπολογίζει το σταθερό αναγνωριστικό αρχείου κατά το §5.3:
 * arxeio_id = sha256(kodikos_mathimatos + diadromi).
 */
export function ftiaxe_arxeio_id(
  kodikos_mathimatos: string,
  kanonikopoiimeni_diadromi: string
): string {
  return createHash('sha256')
    .update(kodikos_mathimatos + kanonikopoiimeni_diadromi, 'utf8')
    .digest('hex');
}

/**
 * Υπολογίζει το SHA-256 hash του δυαδικού περιεχομένου ενός αρχείου.
 */
export function hash_periexomenou(dedomena: Uint8Array): string {
  return createHash('sha256').update(dedomena).digest('hex');
}
