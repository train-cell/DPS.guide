import { describe, expect, it } from 'vitest';
import type { Selida } from '@dps/core';
import { ELAXISTES_LEKSEIS_SELIDAS } from '@dps/core';
import { MAGIKA_ZIP } from './koines.js';
import { arxizei_me, ftiaxe_selida, katharise_keimeno, metisese_lekseis, magika_zip } from './koines.js';

describe('katharise_keimeno', () => {
  it('κανονικοποιεί σε NFC και συμπιέζει τα κενά', () => {
    expect(katharise_keimeno('  καλημέρα   κόσμε\n  ')).toBe('καλημέρα κόσμε');
    expect(katharise_keimeno('\t  α   β\t')).toBe('α β');
  });

  it('δίνει κενό όταν το κείμενο είναι κενό', () => {
    expect(katharise_keimeno('')).toBe('');
  });
});

describe('metisese_lekseis', () => {
  it('μετράει τις λέξεις', () => {
    expect(metisese_lekseis('α β γ')).toBe(3);
    expect(metisese_lekseis('α')).toBe(1);
  });

  it('δίνει 0 για κενό κείμενο', () => {
    expect(metisese_lekseis('')).toBe(0);
  });
});

describe('ftiaxe_selida', () => {
  it('δίνει έγκυρη Selida', () => {
    const selida: Selida = ftiaxe_selida('arx-1', 1, '  καλημέρα   κόσμε  ');
    expect(selida.arxeio_id).toBe('arx-1');
    expect(selida.arithmos).toBe(1);
    expect(selida.keimeno).toBe('καλημέρα κόσμε');
    expect(selida.lekseis).toBe(2);
    expect(selida.xoris_keimeno).toBe(true);
  });

  it('σημαίνει χωρίς κείμενο όταν υπάρχουν λίγες λέξεις', () => {
    const selida: Selida = ftiaxe_selida('arx-1', 2, 'α β γ δ ε στ');
    expect(selida.lekseis).toBe(6);
    expect(selida.xoris_keimeno).toBe(false);
  });
});

describe('arxizei_me', () => {
  it('εντοπίζει την υπογραφή zip', () => {
    expect(arxizei_me(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), MAGIKA_ZIP)).toBe(true);
    expect(arxizei_me(new Uint8Array([0x50, 0x4b]), MAGIKA_ZIP)).toBe(true);
    expect(arxizei_me(new Uint8Array([0x50]), MAGIKA_ZIP)).toBe(false);
    expect(arxizei_me(new Uint8Array([]), MAGIKA_ZIP)).toBe(false);
    expect(arxizei_me(new Uint8Array([0x00, 0x01]), MAGIKA_ZIP)).toBe(false);
  });
});
