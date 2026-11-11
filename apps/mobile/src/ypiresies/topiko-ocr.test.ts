// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apotyxia, ok } from '@dps/core';
import { createLocalOcrPort } from './topiko-ocr.js';

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

/** Πλαστική απάντηση του `pdfjs-dist`. */
const pdfDocument = { numPages: 1, getPage: vi.fn(), destroy: vi.fn() };
const loadingTask = {
  promise: Promise.resolve(pdfDocument),
  destroy: vi.fn(() => Promise.reject(new Error('Δεν κλείνει το έγγραφο'))),
};
const renderTask = { promise: Promise.resolve() };
const pdfPage = {
  getViewport: vi.fn(({ scale }) => ({ width: 100 * scale, height: 100 * scale })),
  cleanup: vi.fn(),
  render: vi.fn(() => renderTask),
};

/** Πλαστικός καμβάς· το jsdom δεν υλοποιεί canvas 2D context. */
function kanvas(context = true) {
  const assignments: { width: number[]; height: number[] } = { width: [], height: [] };
  let width = 0;
  let height = 0;
  return {
    getContext: vi.fn((type) => (type === '2d' ? (context ? {} : null) : null)),
    get width() {
      return width;
    },
    set width(value: number) {
      assignments.width.push(value);
      width = value;
    },
    get height() {
      return height;
    },
    set height(value: number) {
      assignments.height.push(value);
      height = value;
    },
    assignments,
  };
}

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}));

vi.mock('pdfjs-dist/build/pdf.worker.mjs?url', () => ({
  default: '',
}));

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
}));

vi.mock('../provoli-pdf/pdf-ypiresies.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, etimose_pdfjs: vi.fn() };
});

describe('topiko-ocr.ts', () => {
  const pyli = createLocalOcrPort();

  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('εξάγει το τοπικό port OCR με τη σωστή υπογραφή', () => {
    expect(typeof pyli.anagnorise_pdf_selida).toBe('function');
  });

  it('αναγνωρίζει μια σελίδα PDF με τοπικό worker', async () => {
    const canvas = kanvas();
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);
    const worker = { recognize: vi.fn() };
    vi.mocked((await import('tesseract.js')).createWorker).mockReturnValue(worker);
    vi.mocked(worker.recognize).mockResolvedValue({ data: { text: 'Δοκιμή OCR' } });

    const getDocument = vi.mocked((await import('pdfjs-dist')).getDocument);
    getDocument.mockReturnValue(loadingTask);
    pdfDocument.getPage.mockReturnValue(pdfPage);

    const etimose = await import('../provoli-pdf/pdf-ypiresies.js');
    etimose.etimose_pdfjs.mockResolvedValue(ok(undefined));

    const apotelesma = await pyli.anagnorise_pdf_selida(PDF_BYTES, 1);

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi).toBe('Δοκιμή OCR');
    }
    expect(getDocument).toHaveBeenCalledWith({ data: expect.anything() });
    expect(pdfDocument.getPage).toHaveBeenCalledWith(1);
    expect(pdfPage.getViewport).toHaveBeenNthCalledWith(1, { scale: 1 });
    expect(pdfPage.getViewport).toHaveBeenNthCalledWith(2, { scale: 1.6 });
    expect(document.createElement).toHaveBeenCalledWith('canvas');
    expect(canvas.getContext).toHaveBeenCalledWith('2d', { willReadFrequently: true });
    expect(canvas.assignments.width).toEqual([160, 0]);
    expect(canvas.assignments.height).toEqual([160, 0]);
    expect(pdfPage.render).toHaveBeenCalledWith({
      canvas: expect.anything(),
      canvasContext: expect.anything(),
      viewport: expect.anything(),
    });
    expect(worker.recognize).toHaveBeenCalledWith(expect.anything());
    expect(pdfPage.cleanup).toHaveBeenCalled();
    expect(loadingTask.destroy).toHaveBeenCalled();
  });

  it('απορρίπτει μη έγκυρο αριθμό σελίδας (ακέραιος, κάτω, πάνω)', async () => {
    const canvas = kanvas();
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);
    const getDocument = vi.mocked((await import('pdfjs-dist')).getDocument);
    getDocument.mockReturnValue(loadingTask);
    pdfDocument.getPage.mockReturnValue(pdfPage);

    const etimose = await import('../provoli-pdf/pdf-ypiresies.js');
    etimose.etimose_pdfjs.mockResolvedValue(ok(undefined));

    expect((await pyli.anagnorise_pdf_selida(PDF_BYTES, 1.5)).ok).toBe(false);
    expect((await pyli.anagnorise_pdf_selida(PDF_BYTES, 0)).ok).toBe(false);
    expect((await pyli.anagnorise_pdf_selida(PDF_BYTES, 10)).ok).toBe(false);
    expect((await pyli.anagnorise_pdf_selida(PDF_BYTES, 1)).ok).toBe(true);
  });

  it('πετάει σφάλμα όταν ο καμβάς δεν έχει context', async () => {
    const canvas = kanvas(false);
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);
    const getDocument = vi.mocked((await import('pdfjs-dist')).getDocument);
    getDocument.mockReturnValue(loadingTask);
    pdfDocument.getPage.mockReturnValue(pdfPage);

    const etimose = await import('../provoli-pdf/pdf-ypiresies.js');
    etimose.etimose_pdfjs.mockResolvedValue(ok(undefined));

    const apotelesma = await pyli.anagnorise_pdf_selida(PDF_BYTES, 1);
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma?.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('πετάει σφάλμα όταν δεν φορτώνει η βιβλιοθήκη pdfjs', async () => {
    const etimose = await import('../provoli-pdf/pdf-ypiresies.js');
    etimose.etimose_pdfjs.mockResolvedValue(apotyxia('MI_YPOSTIRIZOMENO', 'Η βιβλιοθήκη προβολής PDF δεν φορτώθηκε.'));

    const apotelesma = await pyli.anagnorise_pdf_selida(PDF_BYTES, 1);
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma?.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('πετάει σφάλμα όταν περνάει το pdfjs', async () => {
    const getDocument = vi.mocked((await import('pdfjs-dist')).getDocument);
    getDocument.mockImplementation(() => {
      throw new Error('Δεν ανοίγει το PDF');
    });

    const etimose = await import('../provoli-pdf/pdf-ypiresies.js');
    etimose.etimose_pdfjs.mockResolvedValue(ok(undefined));

    const apotelesma = await pyli.anagnorise_pdf_selida(PDF_BYTES, 1);
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma?.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});
