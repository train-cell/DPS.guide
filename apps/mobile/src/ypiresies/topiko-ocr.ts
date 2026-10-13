import type { OcrPyli } from '@dps/pipeline';
import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { antigrafo_dyadikon, etimose_pdfjs } from '../provoli-pdf/pdf-ypiresies.js';

const OCR_SCALE = 1.6;
interface OcrWorker {
  recognize(image: HTMLCanvasElement): Promise<{ readonly data: { readonly text: string } }>;
  terminate(): Promise<unknown>;
}
let workerPromise: Promise<OcrWorker> | null = null;

function worker(): Promise<OcrWorker> {
  workerPromise ??= import('tesseract.js').then(({ createWorker }) => createWorker('ell+eng', 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core/tesseract-core-lstm.wasm.js',
    langPath: '/ocr/lang',
    cachePath: 'dps-ocr-v1',
    cacheMethod: 'write',
    workerBlobURL: false,
    gzip: true,
  }));
  return workerPromise;
}

async function recognizePdfPage(bytes: Uint8Array, pageNumber: number): Promise<Apotelesma<string>> {
  const ready = await etimose_pdfjs();
  if (!ready.ok) return ready;

  let closeDocument: (() => Promise<void>) | undefined;
  let cleanupPage: (() => void) | undefined;
  let canvas: HTMLCanvasElement | undefined;
  try {
    const pdfjs = await import('pdfjs-dist');
    const loadingTask = pdfjs.getDocument({ data: antigrafo_dyadikon(bytes) });
    closeDocument = () => loadingTask.destroy();
    const pdfDocument = await loadingTask.promise;
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Ο αριθμός σελίδας για το OCR δεν είναι έγκυρος.');
    }
    const pdfPage = await pdfDocument.getPage(pageNumber);
    cleanupPage = () => pdfPage.cleanup();
    const original = pdfPage.getViewport({ scale: 1 });
    const scale = Math.min(OCR_SCALE, 2600 / Math.max(original.width, original.height));
    const viewport = pdfPage.getViewport({ scale: Math.max(0.8, scale) });
    canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context === null) {
      return apotyxia('MI_YPOSTIRIZOMENO', 'Δεν είναι διαθέσιμος καμβάς για το τοπικό OCR.');
    }
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const renderTask = pdfPage.render({ canvas, canvasContext: context, viewport });
    await renderTask.promise;
    const result = await (await worker()).recognize(canvas);
    return ok(result.data.text);
  } catch {
    return apotyxia('MI_EGKYRO_SXIMA', `Το τοπικό OCR απέτυχε στη σελίδα ${pageNumber}.`);
  } finally {
    cleanupPage?.();
    if (canvas !== undefined) {
      canvas.width = 0;
      canvas.height = 0;
    }
    await closeDocument?.().catch(() => undefined);
  }
}

/** Fully local OCR. PDF bytes and recognized text never leave this device. */
export function createLocalOcrPort(): OcrPyli {
  return { anagnorise_pdf_selida: recognizePdfPage };
}
