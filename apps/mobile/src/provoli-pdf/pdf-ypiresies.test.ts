// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import {
  akirose_trexousa_apostoli,
  antigrafo_dyadikon,
  arithmos_selidon,
  einai_pdf,
  etimose_pdfjs,
  kilise_klimaka,
  stilise_selida,
} from './pdf-ypiresies.js';

afterEach(() => {
  writeFileSync('/tmp/debug-log.txt', 'AFTER: render calls=' + pdfPage.render.mock.calls.length + ' getPage=' + pdfDocument.getPage.mock.calls.length + '\n', { flag: 'a' });
  vi.clearAllMocks();
});

/** Πλαστική απάντηση του `pdfjs-dist`. */
const pdfDocument = { numPages: 1, getPage: vi.fn(), destroy: vi.fn() };
const loadingTask = {
  promise: Promise.resolve(pdfDocument),
  destroy: vi.fn(() => Promise.resolve()),
};
const renderTask = { promise: Promise.resolve() };
const pdfPage = {
  getViewport: vi.fn(({ scale }) => ({ width: 100 * scale, height: 200 * scale })),
  cleanup: vi.fn(),
  render: vi.fn(() => renderTask),
};

/** Καννάς με 2d πλαίσιο. */
function ftiaxe_kanvas(): HTMLCanvasElement {
  return { getContext: () => ({}) } as unknown as HTMLCanvasElement;
}

/** Καννάς χωρίς 2d πλαίσιο. */
function ftiaxe_kanvas_xoris(): HTMLCanvasElement {
  return { getContext: () => null } as unknown as HTMLCanvasElement;
}

/** Ψεύτικη βιβλιοθήκη pdf.js. */
const mockPdfjs = {
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
};

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: mockPdfjs.GlobalWorkerOptions,
  getDocument: mockPdfjs.getDocument,
}));

vi.mock('pdfjs-dist/build/pdf.worker.mjs?url', () => ({
  default: 'worker://mock.mjs',
}));

/** Δεδομένα που ξεκινούν με την επικεφαλίδα %PDF. */
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

/** Ρυθμίζει το πλάσμα του `pdfjs-dist` για τις συναρτήσεις που ανοίγουν έγγραφα. */
async function ftiaxe_mock_pdfjs() {
  mockPdfjs.getDocument.mockReturnValue(loadingTask);
  pdfDocument.getPage.mockReturnValue(pdfPage);
  pdfPage.render.mockImplementation(() => ({
    promise: Promise.resolve(),
    cancel: vi.fn(),
  }));
}

describe('pdf-ypiresies — einai_pdf', () => {
  it('αναγνωρίζει την υπογεγραμμένη επικεφαλίδα %PDF', () => {
    expect(einai_pdf(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))).toBe(true);
  });

  it('απορρίπτει κενά, κομμένα και μη-PDF δεδομένα', () => {
    expect(einai_pdf(new Uint8Array([]))).toBe(false);
    expect(einai_pdf(new Uint8Array([0x25, 0x50]))).toBe(false);
    expect(einai_pdf(new TextEncoder().encode('PNG89a...'))).toBe(false);
  });
});

describe('pdf-ypiresies — kilise_klimaka', () => {
  it('κρατά έγκυρη κλίμακα όπως δίνεται', () => {
    expect(kilise_klimaka(1.5)).toBe(1.5);
    expect(kilise_klimaka(0.1)).toBe(0.1);
    expect(kilise_klimaka(4)).toBe(4);
  });

  it('σφηνώνει τις ακραίες τιμές και πέφτει στο 1 για μη-αριθμό', () => {
    expect(kilise_klimaka(0.01)).toBe(0.1);
    expect(kilise_klimaka(99)).toBe(4);
    expect(kilise_klimaka(Number.NaN)).toBe(1);
  });
});

describe('pdf-ypiresies — antigrafo_dyadikon', () => {
  it('επιστρέφει πίνακα με ίδιο περιεχόμενο και διαφορετική ταυτότητα', () => {
    const arxiko = new Uint8Array([1, 2, 3, 4]);
    const antigrafo = antigrafo_dyadikon(arxiko);
    expect(antigrafo).not.toBe(arxiko);
    expect([...antigrafo]).toEqual([...arxiko]);
  });

  it('το αντίγραφο παραμένει αναλλοίωτο όταν το πρωτότυπο «αδειάζει» (detach του worker)', () => {
    const arxiko = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const antigrafo = antigrafo_dyadikon(arxiko);
    arxiko.fill(0);
    expect([...antigrafo]).toEqual([0x25, 0x50, 0x44, 0x46]);
  });
});

describe('pdf-ypiresies — etimose_pdfjs', () => {
  it('ρυθμίζει τον worker και δίνει ok', async () => {
    const apotelesma = await etimose_pdfjs();
    expect(apotelesma.ok).toBe(true);
    expect(vi.mocked((await import('pdfjs-dist')).GlobalWorkerOptions.workerSrc)).toBe('worker://mock.mjs');
  });
});

describe('pdf-ypiresies — arithmos_selidon', () => {
  it('μετράει τις σελίδες ενός έγκυρου PDF', async () => {
    await ftiaxe_mock_pdfjs();

    const apotelesma = await arithmos_selidon(PDF_BYTES);
    expect(apotelesma.ok).toBe(true);
    expect(apotelesma.timi).toBe(1);
  });

  it('δίνει σφάλμα σχήματος όταν δεν είναι PDF', async () => {
    const apotelesma = await arithmos_selidon(new Uint8Array([0x50, 0x4e, 0x47]));
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('δίνει σφάλμα όταν ανοίγει το pdfjs', async () => {
    vi.mocked((await import('pdfjs-dist')).getDocument).mockImplementation(() => {
      throw new Error('Δεν ανοίγει το PDF');
    });

    const apotelesma = await arithmos_selidon(PDF_BYTES);
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('pdf-ypiresies — stilise_selida', () => {
  it('αποδίδει τη σελίδα στο καμβά', async () => {
    const render = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }));
    await ftiaxe_mock_pdfjs();
    pdfPage.render.mockImplementation(render);

    const apotelesma = await stilise_selida(PDF_BYTES, 1, ftiaxe_kanvas(), 1.5);
    expect(apotelesma.ok).toBe(true);
    expect(render).toHaveBeenCalled();
  });

  it('δίνει σφάλμα όταν ο καμβάς δεν έχει 2d πλαίσιο', async () => {
    await ftiaxe_mock_pdfjs();

    const apotelesma = await stilise_selida(PDF_BYTES, 1, ftiaxe_kanvas_xoris(), 1.5);
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('δίνει σφάλμα όταν αποτυγχάνει η απόδοση', async () => {
    await ftiaxe_mock_pdfjs();
    pdfPage.render.mockImplementation(() => ({ promise: Promise.reject(new Error('ΣΦΑΛΜΑ')), cancel: vi.fn() }));

    const apotelesma = await stilise_selida(PDF_BYTES, 1, ftiaxe_kanvas(), 1.5);
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('δίνει ok όταν ακυρώθηκε η τρέχουσα αποπεμπα πριν το σφάλμα', async () => {
    await ftiaxe_mock_pdfjs();
    let rejectRender: (() => void) | null = null;
    pdfPage.render.mockImplementation(() => ({
      promise: new Promise<void>((_, reject) => {
        rejectRender = reject;
      }),
      cancel: vi.fn(),
    }));

    // ξεκινάει η απόδοση· κρέμεται στην pending promise
    const p = stilise_selida(PDF_BYTES, 1, ftiaxe_kanvas(), 1.5);
    // περιμένω να οριστεί η τρέχουσα αποπεμπα πριν την ακυρώσω
    for (let i = 0; i < 100 && rejectRender === null; i++) {
      await Promise.resolve();
    }
    expect(rejectRender).not.toBeNull();

    // ακύρωση· η τρέχουσα αποπεμπα γίνεται null, η νέα απόδοση δεν έχει αρχίσει
    akirose_trexousa_apostoli();
    // η pending promise πετάει· η συνάρτηση επιστρέφει ok (ακυρώθηκε)
    rejectRender!();

    const apotelesma = await p;
    expect(apotelesma.ok).toBe(true);
  });

  it('δίνει σφάλμα όταν πετάει το pdfjs', async () => {
    vi.mocked((await import('pdfjs-dist')).getDocument).mockImplementation(() => {
      throw new Error('Δεν ανοίγει το PDF');
    });

    const apotelesma = await stilise_selida(PDF_BYTES, 1, ftiaxe_kanvas(), 1.5);
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('pdf-ypiresies — akirose_trexousa_apostoli', () => {
  it('δεν καλεί cancel όταν δεν τρέχει αποπεμπα', async () => {
    akirose_trexousa_apostoli();
  });

  it('καλεί cancel όταν τρέχει αποπεμπα', async () => {
    const cancel = vi.fn();
    await ftiaxe_mock_pdfjs();
    pdfPage.render.mockImplementation(() => ({ promise: Promise.resolve(), cancel }));

    const apotelesma = await stilise_selida(PDF_BYTES, 1, ftiaxe_kanvas(), 1.5);
    expect(apotelesma.ok).toBe(true);
    expect(cancel).not.toHaveBeenCalled();

    akirose_trexousa_apostoli();
    expect(cancel).toHaveBeenCalled();
  });
});
