import { describe, expect, it, vi } from 'vitest';
import type { Apotelesma, Selida } from '@dps/core';
import { exagage_pdf } from '../src/pdf/index.js';

const ARXEIO_ID = 'arx-pdf-mock';
const DEDOMENA = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

/** Το απόρρητο που επιστρέφει το `getDocument` του `pdfjs-dist`. */
let trexon_apotelesma: Promise<unknown> = Promise.resolve({});

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: () => ({
    promise: trexon_apotelesma,
  }),
}));

function keimeno_apo_tima(res: Apotelesma<Selida[]>): Selida[] {
  if (!res.ok) {
    throw new Error(`Η εξαγωγή απέτυχε: ${res.sfalma.kodikos} ${res.sfalma.minima}`);
  }
  return res.timi;
}

function ftiaxe_fortosi(numPages: number, getPage: (arithmos: number) => Promise<any>): void {
  trexon_apotelesma = Promise.resolve({
    numPages,
    getPage,
    destroy: vi.fn(async () => undefined),
  });
}

describe('exagage_pdf — δοκιμαστικές διαδρομές (mock)', () => {
  it('σπάει σε σφάλμα όταν η εξαγωγή πετάει μετά την πρώτη σελίδα', async () => {
    ftiaxe_fortosi(2, vi.fn(async (arithmos: number) => {
      if (arithmos === 2) {
        throw new Error('κατεστραμμένο PDF');
      }
      return {
        getTextContent: () =>
          Promise.resolve({
            items: [{ str: 'Εδω', hasEOL: true }],
          }),
        cleanup: () => undefined,
      };
    }));

    const res = await exagage_pdf(DEDOMENA, ARXEIO_ID);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('δεν δέχεται αριθμό σελίδων πάνω από το όριο', async () => {
    ftiaxe_fortosi(5001, vi.fn());

    const res = await exagage_pdf(DEDOMENA, ARXEIO_ID);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
    }
  });

  it('περιμενει item που δεν είναι κείμενο και item χωρίς hasEOL', async () => {
    ftiaxe_fortosi(1, vi.fn(async () => ({
      getTextContent: () =>
        Promise.resolve({
          items: [
            'όχι αντικείμενο',
            null,
            42,
            { str: 'Εδω', hasEOL: false },
            { str: 'Εκεις', hasEOL: true },
            { hasEOL: false },
            { str: 'Τελευταια' },
          ],
        }),
      cleanup: () => undefined,
    })));

    const res = await exagage_pdf(DEDOMENA, ARXEIO_ID);

    expect(res.ok).toBe(true);
    if (res.ok) {
      const selides = keimeno_apo_tima(res);
      expect(selides.length).toBe(1);
      expect(selides[0]?.keimeno).toBe('Εδω Εκεις Τελευταια');
      expect(selides[0]?.lekseis).toBe(3);
    }
  });

  it('επιστρέφει σφάλμα αν δεν ανοίξει το PDF', async () => {
    trexon_apotelesma = Promise.reject(new Error('δεν ανοίγει'));

    const res = await exagage_pdf(DEDOMENA, ARXEIO_ID);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});
