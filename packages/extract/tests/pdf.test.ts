import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import type { Selida } from '@dps/core';
import { ELAXISTES_LEKSEIS_SELIDAS } from '@dps/core';
import { exagage_pdf } from '../src/pdf/index.js';

const ARXEIO_ID = 'arx-pdf-probe';
const RIZA_FIXTURES = fileURLToPath(new URL('../../../fixtures/pdf/', import.meta.url));

function diavase_fixture(onoma: string): Uint8Array {
  return new Uint8Array(readFileSync(`${RIZA_FIXTURES}${onoma}`));
}

function kelides(res: Awaited<ReturnType<typeof exagage_pdf>>): Selida[] {
  if (!res.ok) {
    throw new Error(`Η εξαγωγή απέτυχε: ${res.sfalma.kodikos} ${res.sfalma.minima}`);
  }
  return res.timi;
}

const LEIMES_P1 = 'Οι δομές δεδομένων ταξινομούν στοιχεία κατά αύξουσα σειρά.';
const LEIMES_P3 = 'Η ανάζηση δυαδικού δέντρου χρειάζεται αν ζητηθεί άμεση πρόσβαση.';

describe('exagage_pdf (L05)', () => {
  it('επιστρέφει μία Selida ανά σελίδα, με αρίθμηση 1..N και το ίδιο arxeio_id', async () => {
    const dedomena = diavase_fixture('notosans-tria-selides.pdf');

    const res = await exagage_pdf(dedomena, ARXEIO_ID);

    const selides = kelides(res);
    expect(selides.length).toBe(3);
    expect(selides.map((s) => s.arithmos)).toEqual([1, 2, 3]);
    expect(selides.every((s) => s.arxeio_id === ARXEIO_ID)).toBe(true);
  });

  it('διατηρεί τα ελληνικά με τόνους και τα φέρνει σε κανονική μορφή NFC', async () => {
    const dedomena = diavase_fixture('notosans-tria-selides.pdf');

    const selides = kelides(await exagage_pdf(dedomena, ARXEIO_ID));

    expect(selides[0]?.keimeno).toContain(LEIMES_P1);
    expect(selides[2]?.keimeno).toContain(LEIMES_P3);
    expect(selides[0]?.keimeno).toBe(selides[0]?.keimeno.normalize('NFC'));
    for (const s of selides) {
      expect(s.keimeno).not.toMatch(/[\uFFFD]/);
    }
  });

  it('χαρακτηρίζει σωστά το πλήθος λέξεων κάθε σελίδας', async () => {
    const dedomena = diavase_fixture('notosans-tria-selides.pdf');

    const selides = kelides(await exagage_pdf(dedomena, ARXEIO_ID));

    for (const s of selides) {
      const lekesis_ariste = s.keimeno.length === 0 ? 0 : s.keimeno.split(' ').length;
      expect(s.lekseis).toBe(lekesis_ariste);
      expect(s.lekseis).toBeGreaterThanOrEqual(0);
    }
  });

  it('σημειώνει ως xoris_keimeno τη σελίδα με λιγότερες από ELAXISTES_LEKSEIS_SELIDAS λέξεις', async () => {
    const dedomena = diavase_fixture('notosans-keni-selida.pdf');

    const selides = kelides(await exagage_pdf(dedomena, ARXEIO_ID));

    const keni = selides.find((s) => s.arithmos === 2);
    expect(keni).toBeDefined();
    expect(keni?.lekseis).toBeLessThan(ELAXISTES_LEKSEIS_SELIDAS);
    expect(keni?.xoris_keimeno).toBe(true);

    const pliris = selides.find((s) => s.arithmos === 1);
    expect(pliris?.lekseis).toBeGreaterThanOrEqual(ELAXISTES_LEKSEIS_SELIDAS);
    expect(pliris?.xoris_keimeno).toBe(false);
  });

  it('επιστρέφει σφάλμα, όχι exception, σε κατεστραμμένο αρχείο', async () => {
    const katasmmeno = Uint8Array.from([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a, 0x00, 0xff,
      0xfe, 0x99,
    ]);

    const res = await exagage_pdf(katasmmeno, ARXEIO_ID);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(res.sfalma.minima.length).toBeGreaterThan(0);
    }
  });

  it('είναι ντετερμινιστική: ίδια είσοδος → ίδια ακριβώς έξοδος', async () => {
    const dedomena = diavase_fixture('notosans-tria-selides.pdf');

    const prwto = kelides(await exagage_pdf(dedomena, ARXEIO_ID));
    const deftero = kelides(await exagage_pdf(dedomena, ARXEIO_ID));

    expect(deftero).toEqual(prwto);
  });

  it('κόβει τις λέξεις στο τέλος γραμμής και συμπιέζει τα κενά (υφολισμός, NFC, whitespace)', async () => {
    const dedomena = diavase_fixture('notosans-keni-selida.pdf');

    const selides = kelides(await exagage_pdf(dedomena, ARXEIO_ID));

    for (const s of selides) {
      expect(s.keimeno).not.toMatch(/\s\s/);
      expect(s.keimeno).toBe(s.keimeno.trim());
      expect(s.keimeno).toBe(s.keimeno.normalize('NFC'));
    }
  });
});