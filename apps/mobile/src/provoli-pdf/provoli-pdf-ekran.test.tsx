// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProvoliPdf from './provoli-pdf.js';
import { me_periballon_test } from '../../test-fixtures/periballon-test-provider.js';
import { ftiaxe_periballon_test } from '../../test-fixtures/ftiaxe-test-periballon.js';
import { MnimiApothiki, type ApothikiPyli } from '@dps/core/testing';
import { ParoxeApothekisis } from '../apothiki/aperixirto.js';

/** Καννάς με 2d πλαίσιο. */
function ftiaxe_kanvas(): HTMLCanvasElement {
  return { getContext: () => ({}) } as unknown as HTMLCanvasElement;
}

/** Καννάς χωρίς 2d πλαίσιο. */
function ftiaxe_kanvas_xoris(): HTMLCanvasElement {
  return { getContext: () => null } as unknown as HTMLCanvasElement;
}

/** Πλαστική απόδοση του `pdfjs-dist`. */
const pdfDocument = { numPages: 2, getPage: vi.fn(), destroy: vi.fn() };
const loadingTask = { promise: Promise.resolve(pdfDocument), destroy: vi.fn(() => Promise.resolve()) };
const pdfPage = {
  getViewport: vi.fn(({ scale }) => ({ width: 100 * scale, height: 200 * scale })),
  cleanup: vi.fn(),
  render: vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() })),
};
const mockPdfjs = { GlobalWorkerOptions: { workerSrc: '' }, getDocument: vi.fn() };

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: mockPdfjs.GlobalWorkerOptions,
  getDocument: mockPdfjs.getDocument,
}));

vi.mock('pdfjs-dist/build/pdf.worker.mjs?url', () => ({
  default: 'worker://mock.mjs',
}));

/** Δυαδικά που ξεκινούν με την επικεφαλίδα %PDF. */
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

/** Ρυθμίζει το πλάσμα του pdfjs για συναρτήσεις που ανοίγουν έγγραφα. */
async function ftiaxe_mock_pdfjs() {
  mockPdfjs.getDocument.mockReturnValue(loadingTask);
  pdfDocument.getPage.mockReturnValue(pdfPage);
  pdfPage.render.mockImplementation(() => ({ promise: Promise.resolve(), cancel: vi.fn() }));
}

/** Καθαρίζει το πλάσμα του pdfjs για το επόμενο τεστ. */
function katastesi_mock_pdfjs() {
  pdfDocument.numPages = 2;
  pdfDocument.getPage.mockReturnValue(pdfPage);
  pdfPage.render.mockImplementation(() => ({ promise: Promise.resolve(), cancel: vi.fn() }));
  mockPdfjs.getDocument.mockReturnValue(loadingTask);
  loadingTask.promise = Promise.resolve(pdfDocument);
}

/** Κάνει το έγγραφο του pdfjs αργό, ώστε η οθόνη να μένει εκκρεμής μετά τη φόρτωση των byteof. */
function theti_mock_pdfjs_arxo() {
  loadingTask.promise = new Promise((resolve) => {
    setTimeout(() => resolve(pdfDocument), 500);
  });
}

/** Αποθήκη με ευρετήριο και αρχείο PDF. */
async function ftiaxe_apothiki_dyadikon() {
  const apothiki = new MnimiApothiki();
  await apothiki.grapse_keimeno(
    'PLI201/.spoudes/eurethrio-arxeion.json',
    JSON.stringify([{ id: 'arx-1', diadromi: 'a.pdf' }])
  );
  await apothiki.grapse_dyadiko('PLI201/arxeia/a.pdf', PDF_BYTES);
  return apothiki;
}

/** Αποθήκη που καθυστερεί κάθε ανάγνωση, για να προλάβει η οθόνη να απομακρυνθεί κατά τη φόρτωση. */
class ThrystoApotiki implements ApothikiPyli {
  private base: ApothikiPyli;
  constructor(base: ApothikiPyli = new MnimiApothiki()) {
    this.base = base;
  }
  private async katestera() {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  private anasferi<K extends keyof ApothikiPyli>(fn: K) {
    return (async (...args: unknown[]) => {
      await this.katestera();
      return (this.base[fn] as ApothikiPyli[K])(...args);
    }) as ApothikiPyli[K];
  }
  diavase_keimeno = this.anasferi('diavase_keimeno');
  grapse_keimeno = this.anasferi('grapse_keimeno');
  diavase_dyadiko = this.anasferi('diavase_dyadiko');
  grapse_dyadiko = this.anasferi('grapse_dyadiko');
  yparxei = this.anasferi('yparxei');
  lista = this.anasferi('lista');
  diagrafi = this.anasferi('diagrafi');
}

/** Φορτώνει την οθόνη μέσα σε router με διαδρομή. */
async function apodosi_provolis(diadromi: string) {
  const apothiki = await ftiaxe_apothiki_dyadikon();
  const periballon = ftiaxe_periballon_test({ apothiki });
  render(
    me_periballon_test(
      <ParoxeApothekisis kodikosMathimatos="PLI201">
        <MemoryRouter initialEntries={[diadromi]}>
          <Routes>
            <Route path="/provoli/:arxeioId/:selida" element={<ProvoliPdf />} />
          </Routes>
        </MemoryRouter>
      </ParoxeApothekisis>,
      periballon
    )
  );
  await waitFor(() => expect(document.querySelector('[data-testid="provoli-ekran"]')).not.toBeNull());
}

/** Ισχύει η απενεργοποίηση του `IonButton` — ελέγχει την ιδιότητα, όχι το attribute. */
function einai_apenenergismeno(testid: string): boolean {
  const el = document.querySelector(`[data-testid="${testid}"]`) as HTMLButtonElement | null;
  return el !== null && el.disabled === true;
}

describe('ProvoliPdf — διαδρομές σελίδας', () => {
  beforeEach(() => {
    void ftiaxe_mock_pdfjs();
  });

  afterEach(() => {
    cleanup();
    katastesi_mock_pdfjs();
  });

  it('φορτώνει και αποδίδει τη σελίδα 1', async () => {
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1 από 2'));
    expect(document.querySelector('[data-testid="provoli-kanvas"]')).not.toBeNull();
  });

  it('δέχεται μη αριθμητική σελίδα (πρωτεύουσα)', async () => {
    await apodosi_provolis('/provoli/arx-1/abc');
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1'));
  });

  it('δέχεται σελίδα πέρα από το τέλος', async () => {
    await apodosi_provolis('/provoli/arx-1/99');
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 2'));
  });

  it('δεν φορτώνει byteof όταν λείπει το αρχείο', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      'PLI201/.spoudes/eurethrio-arxeion.json',
      JSON.stringify([{ id: 'arx-1', diadromi: 'a.pdf' }])
    );
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <ParoxeApothekisis kodikosMathimatos="PLI201">
          <MemoryRouter initialEntries={['/provoli/arx-1/1']}>
            <Routes>
              <Route path="/provoli/:arxeioId/:selida" element={<ProvoliPdf />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelector('[data-testid="katastasi-sfalma"]')).not.toBeNull());
  });

  it('δίνεi σφάλμα όταν μετράει τις σελίδες', async () => {
    mockPdfjs.getDocument.mockImplementation(() => {
      throw new Error('Δεν ανοίγει το PDF');
    });
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="katastasi-sfalma"]')).not.toBeNull());
  });

  it('δεν αποδίδει έγγραφο χωρίς σελίδες', async () => {
    pdfDocument.numPages = 0;
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="katastasi-adeio"]')).not.toBeNull());
  });

  it('επαναφορτώνει με το κουμπί επανάληψης', async () => {
    // η πρώτη προσπάθεια αποτυγχάνει (sfalma → κουμπί επανάληψης), η δεύτερη πετυχαίνει
    let epicheiriseis = 0;
    mockPdfjs.getDocument.mockImplementation(() => {
      epicheiriseis += 1;
      if (epicheiriseis === 1) throw new Error('Δεν ανοίγει το PDF');
      return loadingTask;
    });
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="katastasi-sfalma"]')).not.toBeNull());
    fireEvent.click(document.querySelector('[data-testid="epanalipsi"]')!);
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1 από 2'));
  });

  it('επιστρέφει πίσω με το κουμπί επιστροφής', async () => {
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1 από 2'));
    // η επιστροφή είναι η μοναδική ενέργεια στο κουμπί «← Πίσω»
    fireEvent.click(document.querySelector('[data-testid="provoli-epistrofi"]')!);
  });

  it('υποβάλλει τη φόρμα μετάβασης και την επαναφέρει', async () => {
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1 από 2'));
    const form = document.querySelector('[data-testid="provoli-metavasi-selidas"]')!.closest('form');
    fireEvent.submit(form!);
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1'));
  });

  async function ftiaxe_apotiki_arghi(): Promise<ThrystoApotiki> {
    const base = new MnimiApothiki();
    await base.grapse_keimeno(
      'PLI201/.spoudes/eurethrio-arxeion.json',
      JSON.stringify([{ id: 'arx-1', diadromi: 'a.pdf' }])
    );
    await base.grapse_dyadiko('PLI201/arxeia/a.pdf', PDF_BYTES);
    return new ThrystoApotiki(base);
  }

  it('δεν ενημερώνει κατάσταση αν απομακρυνθεί πριν την ολοκλήρωση', async () => {
    const periballon = ftiaxe_periballon_test({ apothiki: await ftiaxe_apotiki_arghi() });
    const { unmount } = render(
      me_periballon_test(
        <ParoxeApothekisis kodikosMathimatos="PLI201">
          <MemoryRouter initialEntries={['/provoli/arx-1/1']}>
            <Routes>
              <Route path="/provoli/:arxeioId/:selida" element={<ProvoliPdf />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    // η θύρα αποθήκευσης είναι αργή· η οθόνη απομακρύνεται πριν προλάβει η
    // `fortose_pdf` και η μέτρηση σελίδων να ολοκληρωθούν (η `zontas` είναι false)
    theti_mock_pdfjs_arxo();
    // η φόρτωση του παραδόχου αποθήκης διαρκεί ~100ms· μετά φορτώνει η οθόνη
    await new Promise((resolve) => {
      setTimeout(resolve, 120);
    });
    unmount();
    // η μέτρηση σελίδων αργεί 500ms· περιμένω να ολοκληρωθεί η εκκρεμής promise
    await new Promise((resolve) => {
      setTimeout(resolve, 600);
    });
    expect(document.body).not.toBeNull();
  });

  it('δεν ενημερώνει κατάσταση αν απομακρυνθεί μετά την έναρξη της μέτρησης', async () => {
    const periballon = ftiaxe_periballon_test({ apothiki: await ftiaxe_apotiki_arghi() });
    const { unmount } = render(
      me_periballon_test(
        <ParoxeApothekisis kodikosMathimatos="PLI201">
          <MemoryRouter initialEntries={['/provoli/arx-1/1']}>
            <Routes>
              <Route path="/provoli/:arxeioId/:selida" element={<ProvoliPdf />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    // η `fortose_pdf` ολοκληρώνεται σε ~210ms· απομακρύνουμε την οθόνη αφού έχει
    // ολοκληρωθεί, πριν ολοκληρωθεί η μέτρηση σελίδων (500ms)
    theti_mock_pdfjs_arxo();
    await new Promise((resolve) => {
      setTimeout(resolve, 260);
    });
    unmount();
    // η μέτρηση σελίδων αργεί 500ms· περιμένω να ολοκληρωθεί η εκκρεμής promise
    await new Promise((resolve) => {
      setTimeout(resolve, 600);
    });
    expect(document.body).not.toBeNull();
  });

  it('δεν κάνει σφαλματα όταν απομακρύνεται από τη σελίδα', async () => {
    const periballon = ftiaxe_periballon_test({ apothiki: new ThrystoApotiki() });
    const { unmount } = render(
      me_periballon_test(
        <ParoxeApothekisis kodikosMathimatos="PLI201">
          <MemoryRouter initialEntries={['/provoli/arx-1/1']}>
            <Routes>
              <Route path="/provoli/:arxeioId/:selida" element={<ProvoliPdf />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    // η θύρα είναι αργή (200ms ανά ανάγνωση)· η φόρτωση byteof ολοκληρώνεται πριν την
    // απομάκρυνση, η μέτρηση σελίδων είναι αργή — η οθόνη απομακρύνεται ενώ κρέμεται
    theti_mock_pdfjs_arxo();
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });
    unmount();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  });
});

describe('ProvoliPdf — ζουμ και πλοήγηση', () => {
  beforeEach(() => {
    void ftiaxe_mock_pdfjs();
  });

  afterEach(() => {
    cleanup();
    katastesi_mock_pdfjs();
  });

  it('ζει μεγέθυνση και σμίκρυνση μέχρι τα όρια', async () => {
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1 από 2'));
    const enedeixi = () => document.querySelector('[data-testid="provoli-klimaka-endeixi"]')!;
    expect(enedeixi().textContent).toContain('150%');
    fireEvent.click(document.querySelector('[data-testid="provoli-megenthinsi"]')!);
    expect(enedeixi().textContent).toContain('175%');
    fireEvent.click(document.querySelector('[data-testid="provoli-megenthinsi"]')!);
    expect(enedeixi().textContent).toContain('200%');
    fireEvent.click(document.querySelector('[data-testid="provoli-megenthinsi"]')!);
    expect(enedeixi().textContent).toContain('225%');
    fireEvent.click(document.querySelector('[data-testid="provoli-megenthinsi"]')!);
    expect(enedeixi().textContent).toContain('250%');
    fireEvent.click(document.querySelector('[data-testid="provoli-megenthinsi"]')!);
    expect(enedeixi().textContent).toContain('275%');
    fireEvent.click(document.querySelector('[data-testid="provoli-megenthinsi"]')!);
    expect(enedeixi().textContent).toContain('300%');
    // το μέγιστο είναι 3.0
    expect(document.querySelector('[data-testid="provoli-megenthinsi"]')?.hasAttribute('disabled')).toBe(true);
    fireEvent.click(document.querySelector('[data-testid="provoli-smikrynsi"]')!);
    expect(enedeixi().textContent).toContain('275%');
    // το ελάχιστο είναι 0.75
    fireEvent.click(document.querySelector('[data-testid="provoli-smikrynsi"]')!);
    fireEvent.click(document.querySelector('[data-testid="provoli-smikrynsi"]')!);
    fireEvent.click(document.querySelector('[data-testid="provoli-smikrynsi"]')!);
    fireEvent.click(document.querySelector('[data-testid="provoli-smikrynsi"]')!);
    fireEvent.click(document.querySelector('[data-testid="provoli-smikrynsi"]')!);
    fireEvent.click(document.querySelector('[data-testid="provoli-smikrynsi"]')!);
    fireEvent.click(document.querySelector('[data-testid="provoli-smikrynsi"]')!);
    fireEvent.click(document.querySelector('[data-testid="provoli-smikrynsi"]')!);
    fireEvent.click(document.querySelector('[data-testid="provoli-smikrynsi"]')!);
    expect(enedeixi().textContent).toContain('75%');
    expect(document.querySelector('[data-testid="provoli-smikrynsi"]')?.hasAttribute('disabled')).toBe(true);
    fireEvent.click(document.querySelector('[data-testid="provoli-epanaphora-klimakas"]')!);
    expect(enedeixi().textContent).toContain('150%');
  });

  it('πλοηγείται μεταξύ σελίδων με τα κουμπιά', async () => {
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1 από 2'));
    const selida = () => document.querySelector('[data-testid="provoli-selida"]')!;
    expect(selida().textContent).toContain('Σελίδα 1 από 2');
    fireEvent.click(document.querySelector('[data-testid="provoli-epomeno"]')!);
    expect(selida().textContent).toContain('Σελίδα 2 από 2');
    // το επόμενο είναι απενεργοποιημένο στην τελευταία σελίδα
    expect(einai_apenenergismeno('provoli-epomeno')).toBe(true);
    fireEvent.click(document.querySelector('[data-testid="provoli-proigoumeno"]')!);
    expect(selida().textContent).toContain('Σελίδα 1 από 2');
    // το προηγούμενο είναι απενεργοποιημένο στην πρώτη σελίδα
    expect(einai_apenenergismeno('provoli-proigoumeno')).toBe(true);
  });

  it('επαναφέρει τη σελίδα όταν η εισαγωγή είναι μη έγκυρη', async () => {
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1'));
    const eisodos = document.querySelector('[data-testid="provoli-metavasi-selidas"]')!;
    fireEvent.change(eisodos, { target: { value: 'zzz' } });
    fireEvent.blur(eisodos);
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1'));
  });

  it('επαναφέρει τη σελίδα όταν η εισαγωγή είναι πέρα από το τέλος', async () => {
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 1'));
    const eisodos = document.querySelector('[data-testid="provoli-metavasi-selidas"]')!;
    fireEvent.change(eisodos, { target: { value: '99' } });
    fireEvent.blur(eisodos);
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-selida"]')?.textContent).toContain('Σελίδα 2'));
  });
});

describe('ProvoliPdf — απομάκρυνση με εκκρεμή φόρτωση', () => {
  beforeEach(() => {
    void ftiaxe_mock_pdfjs();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    katastesi_mock_pdfjs();
  });

  it('σταματά τη μέτρηση σελίδων όταν απομακρύνεται νωρίς', async () => {
    // η αποθήκη είναι αργή· η φόρτωση byteof ολοκληρώνεται πριν την απομάκρυνση,
    // η μέτρηση σελίδων (pdfjs) είναι αργή — η οθόνη απομακρύνεται ενώ κρέμεται
    const { unmount } = render(
      me_periballon_test(
        <ParoxeApothekisis kodikosMathimatos="PLI201">
          <MemoryRouter initialEntries={['/provoli/arx-1/1']}>
            <Routes>
              <Route path="/provoli/:arxeioId/:selida" element={<ProvoliPdf />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        ftiaxe_periballon_test({ apothiki: new ThrystoApotiki() })
      )
    );
    theti_mock_pdfjs_arxo();
    vi.advanceTimersByTime(200);
    unmount();
    vi.advanceTimersByTime(600);
  });

  it('σταματά τη φόρτωση byteof όταν απομακρύνεται πολύ νωρίς', async () => {
    const { unmount } = render(
      me_periballon_test(
        <ParoxeApothekisis kodikosMathimatos="PLI201">
          <MemoryRouter initialEntries={['/provoli/arx-1/1']}>
            <Routes>
              <Route path="/provoli/:arxeioId/:selida" element={<ProvoliPdf />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        ftiaxe_periballon_test({ apothiki: new ThrystoApotiki() })
      )
    );
    theti_mock_pdfjs_arxo();
    vi.advanceTimersByTime(60);
    unmount();
    vi.advanceTimersByTime(600);
  });
});

describe('ProvoliPdf — σφάλμα απόδοσης', () => {
  beforeEach(() => {
    void ftiaxe_mock_pdfjs();
  });

  afterEach(() => {
    cleanup();
    katastesi_mock_pdfjs();
  });

  it('δεν έχει καννάς 2d — δείχνει σφάλμα αποστολής', async () => {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => null;
    try {
      await apodosi_provolis('/provoli/arx-1/1');
      await waitFor(() => expect(document.querySelector('[data-testid="provoli-sfalma-apostolis"]')).not.toBeNull());
    } finally {
      HTMLCanvasElement.prototype.getContext = origGetContext;
    }
  });

  it('δεν έχει καννάα — η απόδοση επιστρέφει σφάλμα', async () => {
    pdfPage.render.mockImplementation(() => ({ promise: Promise.reject(new Error('ΣΦΑΛΜΑ')), cancel: vi.fn() }));
    await apodosi_provolis('/provoli/arx-1/1');
    await waitFor(() => expect(document.querySelector('[data-testid="provoli-sfalma-apostolis"]')).not.toBeNull());
  });
});

describe('ProvoliPdf — κενή ταυτότητα αρχείου', () => {
  it('δεν έχει κωδικό μαθήματος — δείχνει Άγνωστο αρχείο', async () => {
    const apothiki = await ftiaxe_apothiki_dyadikon();
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter initialEntries={['/provoli/arx-1/1']}>
          <ProvoliPdf />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelector('[title="Άγνωστο αρχείο"]')).not.toBeNull());
    expect(document.querySelector('[title="Άγνωστο αρχείο"]')?.textContent).toContain('Άγνωστο αρχείο');
  });
});
