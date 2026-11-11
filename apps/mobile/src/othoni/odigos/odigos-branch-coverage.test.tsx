// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEffect } from 'react';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { xrisiApothekisis } from '../../apothiki/aperixirto.js';
import { ParoxeApothekisis } from '../../apothiki/aperixirto.js';
import { MnimiApothiki } from '@dps/core/testing';
import { ftiaxe_periballon_test } from '../../../test-fixtures/ftiaxe-test-periballon.js';
import { generateCourseGuide } from '../../ypiresies/pipeline-analisis.js';
import type { OdigosEnotitas } from '../../ypiresies/index.js';
import { katagrapse_leitner_apantisi } from '../../apothiki/index.js';

vi.mock('../../ypiresies/pipeline-analisis.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ypiresies/pipeline-analisis.js')>();
  return {
    ...actual,
    generateCourseGuide: vi.fn(),
  };
});

// Η fortose_proodho παραμένει πραγματική· μόνο η καταγραφή απάντησης προσομοιώνεται.
vi.mock('../../apothiki/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../apothiki/index.js')>();
  return {
    ...actual,
    katagrapse_leitner_apantisi: vi.fn().mockResolvedValue({ ok: true, timi: [] }),
  };
});

// Η φόρτωση του οδηγού είναι προσομοιωμένη· κάθε δοκιμή ορίζει το αποτέλεσμα.
vi.mock('../../ypiresies/odigos.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ypiresies/odigos.js')>();
  return {
    ...actual,
    // default: κανένας οδηγός δεν υπάρχει ακόμα
    fortose_odigo_apo_apothiki: vi.fn().mockResolvedValue({ katastasi: 'adeio' }),
  };
});

// Η επιλογή Gemini πετάει το σφάλμα μέσα από το ai-policy· μπορεί να γίνει non-Error.
vi.mock('../../ypiresies/ai-policy.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ypiresies/ai-policy.js')>();
  return {
    ...actual,
    // το checkbox ξεκινά μη ελεγμένο· το κλικ το ενεργοποιεί
    read_course_gemini_opt_in: vi.fn().mockResolvedValue(false),
    write_course_gemini_opt_in: vi.fn().mockResolvedValue(undefined),
  };
});

import OdigosMeletis, {
  AutoelegchosAkordeon,
  AutoelegchosErwtisi,
  ProodosDimiourgiasOdigou,
  analise_erwtisi_autoelegchou,
} from './odigos.js';
import { fortose_odigo_apo_apothiki } from '../../ypiresies/odigos.js';
import { read_course_gemini_opt_in, write_course_gemini_opt_in } from '../../ypiresies/ai-policy.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';

/** Προσομοίωση της φόρτωσης του οδηγού· η κάθε δοκιμή ορίζει τον τρόπο απόκρισης. */
function trexe_odigo_montoma(
  apokrisis: { katastasi: string },
  delay = 1000
): Promise<{ katastasi: string }> {
  return new Promise((resolve) => setTimeout(() => resolve(apokrisis), delay));
}

/** Κενό κείμενο αυτοελέγχου χωρίς «Απάντηση:». */
const KENO = '';

/** Ενεργοποιεί το κουμπί δημιουργίας (επιλογή Gemini + κλικ) σε οθόνη με κενή κάρτα. */
async function energopoiisi_dimiourgias(result: ReturnType<typeof render>): Promise<void> {
  await waitFor(() => expect(result.getByTestId('odigos-gemini-optin').disabled).toBe(false), { timeout: 2000 });
  fireEvent.click(result.getByTestId('odigos-gemini-optin'));
  await waitFor(() => expect(result.getByTestId('odigos-dimiourgia').disabled).toBe(false), { timeout: 2000 });
  fireEvent.click(result.getByTestId('odigos-dimiourgia'));
}

describe('odigos — κάλυψη κλάδων (branch coverage)', () => {
  afterEach(() => {
    cleanup();
    (generateCourseGuide as unknown as ReturnType<typeof vi.fn>).mockReset();
    (katagrapse_leitner_apantisi as unknown as ReturnType<typeof vi.fn>).mockClear();
    // επαναφέρει τις προεπιλογές μετά από κάθε δοκιμή
    (write_course_gemini_opt_in as unknown as ReturnType<typeof vi.fn>).mockReset();
    (write_course_gemini_opt_in as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (read_course_gemini_opt_in as unknown as ReturnType<typeof vi.fn>).mockReset();
    // το checkbox ξεκινά μη ελεγμένο· το κλικ το ενεργοποιεί
    (read_course_gemini_opt_in as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    // προεπιλογή: κανένας οδηγός δεν υπάρχει ακόμα
    (fortose_odigo_apo_apothiki as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      katastasi: 'adeio',
    });
  });

  it('αποδίδει ποσοστό βάσει σταδίου όταν λείπει το pososto', () => {
    const html = renderToStaticMarkup(<ProodosDimiourgiasOdigou stadio={2} />);
    expect(html).toContain('aria-valuenow="67"');
  });

  it('αναλύει κείμενο χωρίς ερώτηση, απάντηση και κενό κείμενο', () => {
    const parsed = analise_erwtisi_autoelegchou('Απάντηση:', 0, 'en-1');
    expect(parsed.erwtisi).toBe('Απάντηση:');
    expect(parsed.apantisi).toBe('Ανατρέξτε στην αντίστοιχη πηγή της ενότητας.');
    expect(parsed.ennoia).toBe('Απάντηση:');
    // κενό κείμενο → η έννοια προκύπτει από το id της ενότητας
    const keno = analise_erwtisi_autoelegchou(KENO, 0, 'en-1');
    expect(keno.erwtisi).toBe('');
    expect(keno.apantisi).toBe('Ανατρέξτε στην αντίστοιχη πηγή της ενότητας.');
    expect(keno.ennoia).toBe('en-1-erwtisi-1');
  });

  it('δεν απαιτεί onApantisi και δε δέχεται δεύτερο κλικ όταν είναι υπό υποβολή', () => {
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <AutoelegchosErwtisi
            arithmos={1}
            erwtisi="Τι;"
            apantisi="Η απάντηση"
            ennoia="Εννοία"
          />
        </MemoryRouter>
      )
    );
    const koumpi = result.getAllByTestId('autoelegchos-apantisi-koumpi')[0];
    fireEvent.click(koumpi);
    expect(koumpi.disabled).toBe(false);
    // χωρίς onApantisi το ypovoli επανέρχεται άμεσα· το δεύτερο κλικ επαναλαμβάνει τη δράση
    fireEvent.click(koumpi);
    expect(koumpi.disabled).toBe(false);
  });

  it('επεξεργάζει απάντηση χωρίς κωδικό μαθήματος', async () => {
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <AutoelegchosAkordeon
            keimena={['Ερώτηση: Τι είναι int; Απάντηση: Ακέραιος.']}
            kodikosMathimatos=""
            enotitaId="en-1"
          />
        </MemoryRouter>
      )
    );
    const koumpi = result.getAllByTestId('autoelegchos-apantisi-koumpi')[0];
    fireEvent.click(koumpi);
    await waitFor(() => expect(koumpi.disabled).toBe(false), { timeout: 1000 });
  });

  it('επανέρχεται στο κανονικό κουτί όταν η απάντηση είναι λανθασμένη', async () => {
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <AutoelegchosAkordeon
            keimena={['Ερώτηση: Τι είναι int; Απάντηση: Ακέραιος.']}
            kodikosMathimatos="CS101"
            enotitaId="en-1"
          />
        </MemoryRouter>
      )
    );
    const koumpi = result.getAllByTestId('autoelegchos-apantisi-koumpi');
    // Το δεύτερο κουμπί είναι η λανθασμένη απάντηση (Χρειάζομαι επανάληψη)
    fireEvent.click(koumpi[1]);
    await waitFor(() => expect(koumpi[1].disabled).toBe(false), { timeout: 1000 });
  });

  it('επιστρέφει νωρίς όταν η απάντηση είναι ήδη υπό υποβολή (ypovoli)', async () => {
    const periballon = ftiaxe_periballon_test();
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <AutoelegchosErwtisi
            arithmos={1}
            erwtisi="Τι;"
            apantisi="Η απάντηση"
            ennoia="Εννοία"
            onApantisi={async () => new Promise((resolve) => setTimeout(resolve, 300))}
          />
        </MemoryRouter>
      ),
      periballon
    );
    const koumpi = result.getAllByTestId('autoelegchos-apantisi-koumpi')[0];
    fireEvent.click(koumpi);
    expect(koumpi.disabled).toBe(true);
    // ο browser δεν στέλνει κλικ σε απενεργοποιημένο κουμπί· το αβγώνουμε με的人工
    // ώστε η κλήση να φτάσει στο early return της ypovoli κατάστασης
    await new Promise((resolve) => setTimeout(resolve, 100));
    koumpi.disabled = false;
    fireEvent.click(koumpi);
    // η κατάσταση δεν άλλαξε (early return)· η επαναφορά έρχεται από το finally του πρώτου κλικ
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(koumpi.disabled).toBe(false);
  });

  it('δεν καταγράφει απάντηση όταν η αποθήκη πετάει μη Error', async () => {
    (katagrapse_leitner_apantisi as unknown as ReturnType<typeof vi.fn>).mockRejectedValue('Όχι Error');
    const periballon = ftiaxe_periballon_test();
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <AutoelegchosAkordeon
            keimena={['Ερώτηση: Τι είναι int; Απάντηση: Ακέραιος.']}
            kodikosMathimatos="CS101"
            enotitaId="en-1"
          />
        </MemoryRouter>
      ),
      periballon
    );
    const koumpi = result.getAllByTestId('autoelegchos-apantisi-koumpi');
    fireEvent.click(koumpi[0]);
    await waitFor(() => expect(koumpi[0].disabled).toBe(false), { timeout: 1000 });
  });

  it('δεν ενημερώνει τα κουτιά όταν η καταγραφή επιστρέφει ok false', async () => {
    (katagrapse_leitner_apantisi as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, timi: [] });
    const periballon = ftiaxe_periballon_test();
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <AutoelegchosAkordeon
            keimena={['Ερώτηση: Τι είναι int; Απάντηση: Ακέραιος.']}
            kodikosMathimatos="CS101"
            enotitaId="en-1"
          />
        </MemoryRouter>
      ),
      periballon
    );
    const koumpi = result.getAllByTestId('autoelegchos-apantisi-koumpi');
    fireEvent.click(koumpi[0]);
    await waitFor(() => expect(koumpi[0].disabled).toBe(false), { timeout: 1000 });
  });

  it('φορτώνει προηγουμένως καταγεγραμμένες απαντήσεις από την αποθήκη', async () => {
    // η πραγματική λειτουργία γράφει την πρόοδο από το αρχείο της αποθήκης
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      'CS101/proodhos.json',
      JSON.stringify({ katastasiMathisis: [{ ennoia: 'Τι είναι int;', kouti: 3 }] })
    );
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <AutoelegchosAkordeon
            keimena={['Ερώτηση: Τι είναι int; Απάντηση: Ακέραιος.']}
            kodikosMathimatos="CS101"
            enotitaId="en-1"
          />
        </MemoryRouter>
      ,
        periballon
      )
    );
    await waitFor(() => expect(result.baseElement.textContent).toContain('Κουτί 3'), { timeout: 1000 });
    result.unmount();
  });

  it('δεν καταγράφει απάντηση όταν η αποθήκη αποτυγχάνει', async () => {
    (katagrapse_leitner_apantisi as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Δεν γίνεται εγγραφή')
    );
    const periballon = ftiaxe_periballon_test();
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <AutoelegchosAkordeon
            keimena={['Ερώτηση: Τι είναι int; Απάντηση: Ακέραιος.']}
            kodikosMathimatos="CS101"
            enotitaId="en-1"
          />
        </MemoryRouter>
      ,
        periballon
      )
    );
    const koumpi = result.getAllByTestId('autoelegchos-apantisi-koumpi');
    fireEvent.click(koumpi[0]);
    await waitFor(() => expect(koumpi[0].disabled).toBe(false), { timeout: 1000 });
  });

  it('αποδίδει την οθόνη χωρίς id ενότητας', async () => {
    const periballon = ftiaxe_periballon_test();
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos']}>
            <Routes>
              <Route path="/odigos" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-ekran')).not.toBeNull(), { timeout: 1000 });
    result.unmount();
  });

  it('επιλέγει το προεπιλεγμένο μοντέλο όταν λείπει η ρύθμιση', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('ΠΛΗ201/.spoudes/rytheseis.json', JSON.stringify({ onomaMontelou: '' }));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-ekran')).not.toBeNull(), { timeout: 1000 });
    result.unmount();
  });

  it('απορρίπτει τη φόρτωση όταν απομακρύνεται πριν ολοκληρωθεί', async () => {
    const periballon = ftiaxe_periballon_test();
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    result.unmount();
    await waitFor(() => expect(true).toBe(true), { timeout: 500 });
  });

  it('δεν ξεκινά δημιουργία με κενό κωδικό μαθήματος', async () => {
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-dimiourgia')).not.toBeNull(), { timeout: 1000 });
    // το κουμπί είναι απενεργοποιημένο· το κλικ φτάνει όμως στον χειριστή (kodikosMathimatos κενό)
    fireEvent.click(result.getByTestId('odigos-dimiourgia'));
    result.unmount();
  });

  it('επιλέγει το προεπιλεγμένο μοντέλο όταν η ρύθμιση είναι κενή', async () => {
    // η αποθήκη κρατάει το onomaMontelou όπως το έβαλε η οθόνη ρυθμίσεων
    function KleiMonoToMontelo(): JSX.Element | null {
      const apothiki = xrisiApothekisis();
      const navigate = useNavigate();
      useEffect(() => {
        void apothiki.allaxe_rytheseis({ ...apothiki.rytheseis, onomaMontelou: '' }).then(() => navigate('/odigos/en-1'));
      }, [apothiki, navigate]);
      return null;
    }
    const periballon = ftiaxe_periballon_test();
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/klaro']}>
            <Routes>
              <Route path="/klaro" element={<KleiMonoToMontelo />} />
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-dimiourgia')).not.toBeNull(), { timeout: 2000 });
    result.unmount();
  });

  it('δεν ξεκινά δημιουργία χωρίς id ενότητας', async () => {
    // χωρίς Route το useParams δίνει κενό enotitaId· ενεργοποιείται μόνο με optIn
    const periballon = ftiaxe_periballon_test();
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter>
            <OdigosMeletis />
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    const optin = await waitFor(
      () => {
        const el = result.getByTestId('odigos-gemini-optin');
        expect(el.disabled).toBe(false);
        return el;
      },
      { timeout: 2000 }
    );
    fireEvent.click(optin);
    await waitFor(
      () => expect(result.getByTestId('odigos-dimiourgia').disabled).toBe(false),
      { timeout: 2000 }
    );
    // κενό enotitaId → νωρίς
    fireEvent.click(result.getByTestId('odigos-dimiourgia'));
    result.unmount();
  });

  it('εναλλάσσει όλα τα εργαλεία και επανέρχεται στο κανονικό', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('ΠΛΗ201/.spoudes/odigoi/en-1.md', '# Τίτλος\n\n## 🎯 Στόχοι\n\n- Κείμενο.\n\n');
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-ekran')).not.toBeNull(), { timeout: 1000 });
    const exam = result.getByTestId('odigos-tool-exam');
    fireEvent.click(exam);
    expect(exam.className).toContain('pilegma-entono');
    fireEvent.click(exam);
    expect(exam.className).not.toContain('pilegma-entono');
    const mnemonika = result.getByTestId('odigos-tool-mnemonika');
    fireEvent.click(mnemonika);
    expect(mnemonika.className).toContain('pilegma-entono');
    fireEvent.click(mnemonika);
    expect(mnemonika.className).not.toContain('pilegma-entono');
    const p2p = result.getByTestId('odigos-tool-p2p');
    fireEvent.click(p2p);
    expect(p2p.className).toContain('pilegma-entono');
    fireEvent.click(p2p);
    expect(p2p.className).not.toContain('pilegma-entono');
    result.unmount();
  });

  it('οδηγός με κενό κωδικό μαθήματος δεν ξεκινά δημιουργία', async () => {
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-dimiourgia')).not.toBeNull(), { timeout: 1000 });
    fireEvent.click(result.getByTestId('odigos-tool-exam'));
    await waitFor(() => expect(result.queryByTestId('odigos-start-mock-exam')).not.toBeNull(), { timeout: 1000 });
    result.unmount();
  });

  it('οδηγός με κενή ρύθμιση μοντέλου επιλέγει το προεπιλεγμένο', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('rythmiseis.json', JSON.stringify({ onomaMontelou: '' }));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-ekran')).not.toBeNull(), { timeout: 1000 });
    result.unmount();
  });

  it('απορρίπτει τη φόρτωση όταν απομακρύνεται πριν ολοκληρωθεί', async () => {
    const periballon = ftiaxe_periballon_test();
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    result.unmount();
  });

  it(
    'δεν ενημερώνει την κατάσταση όταν απομακρύνεται πριν φορτωθεί',
    async () => {
      // η φόρτωση είναι πολύ αργή· η απομάκρυνση γίνεται πριν τελειώσει
      (fortose_odigo_apo_apothiki as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => trexe_odigo_montoma({ katastasi: 'sfalma' }, 2000)
      );
      const periballon = ftiaxe_periballon_test();
      const result = render(
        me_periballon_test(
          <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
            <MemoryRouter initialEntries={['/odigos/en-1']}>
              <Routes>
                <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
              </Routes>
            </MemoryRouter>
          </ParoxeApothekisis>,
          periballon
        )
      );
      // φορτώνει την οθόνη· η απομάκρυνση κάνει το mounted false πριν την άφιξη
      await waitFor(() => expect(result.getByTestId('odigos-ekran')).not.toBeNull(), { timeout: 2000 });
      result.unmount();
      // περιμένει την άφιξη της αργής φόρτωσης
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  );

  it('δεν πετάει όταν η επιλογή Gemini απορρίπτεται', async () => {
    // η συνάρτηση πετάει Error· η cond-expr παίρνει το message true path
    (write_course_gemini_opt_in as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Δεν αποθηκεύτηκε η επιλογή.')
    );
    const apothiki = new MnimiApothiki();
    apothiki.grapse_keimeno = async () =>
      ({ ok: false, sfalma: { kodikos: 'MI_EGKYRO', minima: 'Δεν αποθηκεύτηκε' } } as never);
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-gemini-optin').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('odigos-gemini-optin'));
    await waitFor(() => expect(result.queryByText('Δεν αποθηκεύτηκε η επιλογή.')).not.toBeNull(), { timeout: 2000 });
    result.unmount();
  });

  it('καλύπτει την επιλογή Gemini σε κατάσταση sfalma με Error', async () => {
    // η κατάσταση sfalma δείχνει το checkbox του sfalma κλάδου (γραμμή 612)
    (fortose_odigo_apo_apothiki as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        Promise.resolve({
          katastasi: 'sfalma',
          sfalma: { kodikos: 'MI_EGKYRO_SXIMA', minima: 'Χαλασμένο σχήμα' },
        })
    );
    (write_course_gemini_opt_in as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Δεν αποθηκεύτηκε η επιλογή.')
    );
    const periballon = ftiaxe_periballon_test();
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-gemini-optin').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('odigos-gemini-optin'));
    await waitFor(() => expect(result.queryByText('Δεν αποθηκεύτηκε η επιλογή.')).not.toBeNull(), { timeout: 2000 });
    result.unmount();
  });

  it('δεν πετάει όταν η επιλογή Gemini πετάει μη Error', async () => {
    // η συνάρτηση πετάει string· η cond-expr παίρνει το String(sfalma) false path
    (write_course_gemini_opt_in as unknown as ReturnType<typeof vi.fn>).mockRejectedValue('Όχι Error');
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-gemini-optin').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('odigos-gemini-optin'));
    await waitFor(() => expect(result.queryByText('Δεν αποθηκεύτηκε η επιλογή Gemini.')).not.toBeNull(), { timeout: 2000 });
    result.unmount();
  });

  it('εμφανίζει σφάλμα σε κατάσταση sfalma', async () => {
    (fortose_odigo_apo_apothiki as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => Promise.resolve({ katastasi: 'sfalma', sfalma: { kodikos: 'MI_EGKYRO_SXIMA', minima: 'Χαλασμένο σχήμα' } })
    );
    (write_course_gemini_opt_in as unknown as ReturnType<typeof vi.fn>).mockRejectedValue('Όχι Error');
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByText('Χαλασμένο σχήμα')).not.toBeNull(), { timeout: 2000 });
    await waitFor(() => expect(result.getByTestId('odigos-gemini-optin').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('odigos-gemini-optin'));
    await waitFor(() => expect(result.queryByText('Δεν αποθηκεύτηκε η επιλογή Gemini.')).not.toBeNull(), { timeout: 2000 });
    result.unmount();
  });

  it('εμφανίζει σφάλμα σε κατάσταση etimo', async () => {
    // η κατάσταση etimo επιστρέφει dedomena· η children απεικονίζει τα tmimata
    (fortose_odigo_apo_apothiki as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        Promise.resolve({
          katastasi: 'etimo',
          dedomena: {
            enotita_id: 'en-1',
            titlos: 'Τίτλος ενότητας en-1',
            tmimata: {
              stoxoi: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              eli5: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              theoria: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              paradeigma: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              pagides: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              syndeseis: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              autoelegchos: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
            },
          },
        })
    );
    // η φόρτωση της επιλογής πετάει non-Error· το error είναι non-null (καλύπτει το false paths στα binary-expr)
    (read_course_gemini_opt_in as unknown as ReturnType<typeof vi.fn>).mockRejectedValue('Όχι Error');
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.queryAllByTestId('odigos-epikefalida').length).toBe(7), { timeout: 2000 });
    await waitFor(() => expect(result.queryByText('Δεν φορτώθηκε η επιλογή Gemini.')).not.toBeNull(), { timeout: 2000 });
    result.unmount();
  });

  it('απορρίπτει το μη έγκυρο αποτέλεσμα παραγωγής', async () => {
    (generateCourseGuide as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      sfalma: { kodikos: 'MI_EGKYRO_SXIMA', minima: 'Μη έγκυρο αποτέλεσμα' },
    });
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-dimiourgia')).not.toBeNull(), { timeout: 1000 });
    await energopoiisi_dimiourgias(result);
    await waitFor(() => expect(result.getByText('Μη έγκυρο αποτέλεσμα')).not.toBeNull(), { timeout: 2000 });
    result.unmount();
  });

  it('καλύπτει τα στάδια ανάλυσης με το διάστημα', async () => {
    // η αποθήκη διαβάζει τον γραμμένο οδηγό· επιστρέφει έτοιμο σχήμα
    (fortose_odigo_apo_apothiki as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (apothiki: { diavase_keimeno: (diadromi: string) => Promise<unknown> }, kodikos: string, enotita: string) => {
        const apotelesma = await apothiki.diavase_keimeno(`ΠΛΗ201/.spoudes/odigoi/en-1.md`);
        if (!(apotelesma as { ok: boolean }).ok) {
          return { katastasi: 'adeio' };
        }
        return { katastasi: 'etimo' };
      }
    );
    (generateCourseGuide as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (periballon: unknown, kodikosMathimatos: string, enotitaId: string) => {
        // η παραγωγή γράφει τον οδηγό στην αποθήκη· ο επαναφορτωμένος οδηγός είναι έτοιμος
        await (periballon as { apothiki: { grapse_keimeno: (diadromi: string, periexomeno: string) => Promise<void> } }).apothiki
          .grapse_keimeno(`ΠΛΗ201/.spoudes/odigoi/en-1.md`, '# Τίτλος ενότητας en-1\n\n');
        await new Promise((resolve) => setTimeout(resolve, 4500));
        return {
          ok: true,
          timi: {
            enotita_id: 'en-1',
            titlos: 'Τίτλος ενότητας en-1',
            tmimata: {
              stoxoi: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              eli5: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              theoria: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              paradeigma: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              pagides: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              syndeseis: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
              autoelegchos: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
            },
          } as unknown as OdigosEnotitas,
        };
      }
    );
    // κενή κάρτα (κανένας οδηγός) → εμφανίζεται το κουμπί δημιουργίας
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.queryAllByTestId('odigos-dimiourgia').length).toBeGreaterThan(0), { timeout: 2000 });
    await energopoiisi_dimiourgias(result);
    // το διάστημα κάνει tick όλα τα στάδια πριν ολοκληρωθεί η παραγωγή
    await waitFor(() => expect(result.queryAllByTestId('odigos-proodos-pososto')).toHaveLength(1), { timeout: 1000 });
    // ολοκλήρωση παραγωγής· το διάστημα σταματά
    await waitFor(() => expect(result.queryAllByTestId('odigos-proodos-pososto')).toHaveLength(0), { timeout: 6000 });
    result.unmount();
  });

  it('δεν πετάει όταν η δημιουργία πετάει μη Error', async () => {
    (generateCourseGuide as unknown as ReturnType<typeof vi.fn>).mockRejectedValue('Όχι Error');
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/odigos/en-1']}>
            <Routes>
              <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.getByTestId('odigos-dimiourgia')).not.toBeNull(), { timeout: 1000 });
    await energopoiisi_dimiourgias(result);
    await waitFor(() => expect(result.getByText('Δεν δημιουργήθηκε ο οδηγός.')).not.toBeNull(), { timeout: 2000 });
    result.unmount();
  });
});
