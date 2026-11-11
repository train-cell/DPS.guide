// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { etimose_pdfjs, arithmos_selidon, stilise_selida } from './pdf-ypiresies.js';

/** Η βιβλιοθήκη pdf.js δεν είναι διαθέσιμη· η φόρτωση πετάει σφάλμα. */
vi.mock('pdfjs-dist', () => {
  throw new Error('ΔΕΝ ΦΟΡΤΩΘΗΚΕ');
});

vi.mock('pdfjs-dist/build/pdf.worker.mjs?url', () => {
  throw new Error('ΔΕΝ ΦΟΡΤΩΘΗΚΕ');
});

/** Καννάς με 2d πλαίσιο. */
function ftiaxe_kanvas(): HTMLCanvasElement {
  return { getContext: () => ({}) } as unknown as HTMLCanvasElement;
}

/** Δεδομένα που ξεκινούν με την επικεφαλίδα %PDF. */
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

describe('pdf-ypiresies — etimose_pdfjs (βιβλιοθήκη μη διαθέσιμη)', () => {
  it('δίνει σφάλμα όταν αποτυγχάνει η φόρτωση της βιβλιοθήκης', async () => {
    const apotelesma = await etimose_pdfjs();
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('ο arithmos_selidon επιστρέφει το σφάλμα φόρτωσης όταν δεν φορτώνει το pdfjs', async () => {
    const apotelesma = await arithmos_selidon(PDF_BYTES);
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('η stilise_selida επιστρέφει το σφάλμα φόρτωσης όταν δεν φορτώνει το pdfjs', async () => {
    const apotelesma = await stilise_selida(PDF_BYTES, 1, ftiaxe_kanvas(), 1.5);
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });
});
