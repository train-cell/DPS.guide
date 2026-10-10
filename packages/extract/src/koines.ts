import type { Selida } from '@dps/core';
import { ELAXISTES_LEKSEIS_SELIDAS } from '@dps/core';

/** Ευθύνη: κανονικοποιεί σε NFC και συμπιέζει τα κενά του εξαγόμενου κειμένου. */
export function katharise_keimeno(keimeno: string): string {
  return keimeno.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Ευθύνη: μετράει λέξεις (run μη-κενών χαρακτήρων χωριζόμενα με κενό). */
export function metisese_lekseis(keimeno: string): number {
  return keimeno.length === 0 ? 0 : keimeno.split(' ').length;
}

/**
 * Ευθύνη: φτιάχνει έγκυρη `Selida` από εξαγόμενο κείμενο, με σήμανση
 * `xoris_keimeno` όταν οι λέξεις είναι λιγότερες από `ELAXISTES_LEKSEIS_SELIDAS`.
 */
export function ftiaxe_selida(arxeio_id: string, arithmos: number, keimeno: string): Selida {
  const katharo = katharise_keimeno(keimeno);
  const lekseis = metisese_lekseis(katharo);
  return {
    arxeio_id,
    arithmos,
    keimeno: katharo,
    lekseis,
    xoris_keimeno: lekseis < ELAXISTES_LEKSEIS_SELIDAS,
  };
}

/** Υπογραφή αρχείων zip (PK\x03\x04 / PK\x05\x06 / PK\x07\x08). */
export const MAGIKA_ZIP: readonly number[] = [0x50, 0x4b];

/** Υπογραφή παλιού δυαδικού Office (OLE2 compound file). */
export const MAGIKA_OLE2: readonly number[] = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

/** Ευθύνη: ελέγχει αν τα bytes ξεκινούν με τα δεδομένα magic. */
export function arxizei_me(dedomena: Uint8Array, magika: readonly number[]): boolean {
  if (dedomena.length < magika.length) {
    return false;
  }
  return magika.every((m, i) => dedomena[i] === m);
}
