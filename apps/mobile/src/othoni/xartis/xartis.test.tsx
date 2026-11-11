// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import XartisEnotiton, {
  KEIMENO_STOXOU,
  KEIMENO_TELIOU,
  KartaEnotitas,
  MINIMA_SFALMATOS_XARTI,
  OdomosEnotiton,
  ProodosDimiourgiasXarti,
  STADIA_DIMIOURGIAS_XARTI,
  einai_kleidomeni_enotita,
  grammi_proapasitis,
  stilise_isxya,
  stilise_lepta,
} from './xartis.js';
import { pseudos_xartis, pseudos_mathimata } from '../../../test-fixtures/pseudomata/index.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';
import { ParoxeApothekisis } from '../../apothiki/aperixirto.js';
import { MnimiApothiki } from '@dps/core/testing';
import { ftiaxe_periballon_test } from '../../../test-fixtures/ftiaxe-test-periballon.js';
import { generateCourseMap } from '../../ypiresies/pipeline-analisis.js';

vi.mock('../../ypiresies/pipeline-analisis.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ypiresies/pipeline-analisis.js')>();
  return {
    ...actual,
    generateCourseMap: vi.fn(),
  };
});

/** Το workspace root, ανεξάρτητα από το από πού τρέχει το test. */
function rootDir(): string {
  return existsSync(join(process.cwd(), 'apps', 'mobile'))
    ? process.cwd()
    : join(process.cwd(), '..', '..');
}

const MONI_PIGIS = join(rootDir(), 'apps/mobile/src/othoni/xartis/xartis.tsx');

/** Τυλίγει ένα στοιχείο σε MemoryRouter ώστε τα Link να αποδίδουν href. */
function apoidefsi(stoixeio: ReactElement): string {
  return renderToStaticMarkup(me_periballon_test(<MemoryRouter>{stoixeio}</MemoryRouter>));
}

/** Αποδίδει τον χάρτη με δοσμένες ολοκληρωμένες ενότητες, χωρίς Provider αποθήκευσης. */
function char_tis_proodhou(telies: readonly string[]): string {
  return apoidefsi(
    <OdomosEnotiton
      xartis={pseudos_xartis()}
      telies={telies}
      allaxe_telia={() => Promise.resolve()}
    />
  );
}

describe('xartis — μορφοποίηση χρόνου και ισχύος', () => {
  it('μετατρέπει τα λεπτά σε ώρες και λεπτά', () => {
    expect(stilise_lepta(15)).toBe('15 λ');
    expect(stilise_lepta(60)).toBe('1 ζ');
    expect(stilise_lepta(75)).toBe('1 ζ 15 λ');
    expect(stilise_lepta(null)).toBe('Χωρίς εκτίμηση χρόνου');
  });

  it('μετατρέπει την ισχύ προαπαίτησης σε ελληνική λέξη', () => {
    expect(stilise_isxya('isxyri')).toBe('ισχυρό');
    expect(stilise_isxya('asthenis')).toBe('ασθενικό');
  });

  it('γράφει τη γραμμή προαπαίτησης με id και ισχύ', () => {
    expect(grammi_proapasitis({ enotita_id: 'en-1', isxys: 'isxyri' })).toBe(
      'Προαπαιτείται: en-1 (ισχυρό)'
    );
    expect(grammi_proapasitis({ enotita_id: 'en-2', isxys: 'asthenis' })).toBe(
      'Προαπαιτείται: en-2 (ασθενικό)'
    );
  });
});

describe('xartis — οθόνη χάρτη ενοτήτων', () => {
  it('στο αρχικό render δείχνει την κατάσταση φόρτωσης του OloniKatastasis', () => {
    const html = apoidefsi(<XartisEnotiton />);
    expect(html).toContain('data-testid="xartis-ekran"');
    expect(html).toContain('data-testid="katastasi-fortosi"');
  });

  it('κάθε ενότητα έχει κάρτα, σύνδεσμο οδηγού και μπλοκ προαπαιτήσεων', () => {
    const html = char_tis_proodhou([]);
    expect(html).toContain('data-testid="xartis-enotita"');
    expect(html).toContain('data-testid="xartis-proiresi"');
    expect(html).toContain('data-testid="xartis-telos"');
    expect(html).toContain('href="/odigos/en-1"');
    expect(html).toContain('href="/odigos/en-4"');
    expect(html).toContain('Προαπαιτείται: en-1 (ισχυρό)');
    expect(html).toContain('Προαπαιτείται: en-2 (ασθενικό)');
    expect(html).toContain('enotita-kartela');
    expect(html).toContain('enotita-xreomeni');
  });

  it('παλιό ή κακόβουλο id ενότητας δεν γίνεται href εξωτερικής πλοήγησης', () => {
    const original = pseudos_xartis().enotites[0];
    if (original === undefined) throw new Error('λείπει η δοκιμαστική ενότητα');
    const html = apoidefsi(
      <KartaEnotitas
        enotita={{ ...original, id: '\\\\evil.example' }}
        tetagmeni={false}
        allaxe_telia={() => Promise.resolve()}
      />
    );

    expect(html).not.toContain('href=');
    expect(html).toContain('μη έγκυρο αναγνωριστικό');
  });

  it('ο δακτύλιος προόδου ξεκινά στο μηδέν και ανεβαίνει με τις ολοκληρωμένες ενότητες', () => {
    const kenis = char_tis_proodhou([]);
    expect(kenis).toContain('>0%<');
    expect(kenis).toContain('0 από 4 ενότητες');

    const tetagmenes = char_tis_proodhou(['en-1', 'en-2']);
    expect(tetagmenes).toContain('>50%<');
    expect(tetagmenes).toContain('2 από 4 ενότητες');
  });

  it('οι υποχρεωτικές data-testid υπάρχουν στην πηγή της οθόνης', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    for (const testid of [
      'xartis-ekran',
      'xartis-enotita',
      'xartis-proiresi',
      'xartis-telos',
      'xartis-katastasi-kleidomatos',
      'xartis-dag-syndesi',
      'xartis-apodosi-badge',
      'xartis-proodos-analisis',
    ]) {
      expect(pigi).toContain(`"${testid}"`);
    }
    expect(pigi).toContain('generateCourseMap(');
    expect(pigi).toContain('data-testid="xartis-dimiourgia"');
    expect(pigi).toContain('xartis-aristeia-${enotita.id}');
  });
});

describe('xartis — η ολοκλήρωση ζει στην αποθήκευση', () => {
  it('δεν κρατάει πλέον τοπική κατάσταση telies', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(pigi).not.toContain('useState<readonly string[]>');
    expect(pigi).not.toContain('setTelies');
  });

  it('διαβάζει και γράφει την πρόοδο μέσω της αποθήκευσης', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(pigi).toContain("import { xrisiApothekisis } from '../../apothiki/index.js'");
    expect(pigi).toContain('xrisiApothekisis()');
    expect(pigi).toContain('apothiki.proodhos.aristeiesEnotiton');
    expect(pigi).toContain('allaxe_telia={apothiki.allaxe_telia}');
    expect(pigi).toContain('await allaxe_telia(enotita.id)');
  });

  it('χωρίς Provider ο χάρτης αποδίδεται με κενή πρόοδο, όχι με σφάλμα', () => {
    const html = apoidefsi(<XartisEnotiton />);
    expect(html).toContain('data-testid="xartis-ekran"');
  });
});

describe('xartis — κουμπί σήμανσης ανά ενότητα', () => {
  it('κάθε ενότητα έχει δικό της testid αλλαγής κατάστασης', () => {
    const html = char_tis_proodhou([]);
    for (const enotita of pseudos_xartis().enotites) {
      expect(html).toContain(`data-testid="xartis-aristeia-${enotita.id}"`);
    }
  });

  it('η ενότητα χωρίς αποθηκευμένη ολοκλήρωση ζητά να σημειωθεί', () => {
    const html = char_tis_proodhou([]);
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain(KEIMENO_STOXOU);
    expect(html).not.toContain('pilegma-entono');
  });

  it('η ενότητα με αποθηκευμένη ολοκλήρωση φαίνεται ολοκληρωμένη', () => {
    const html = char_tis_proodhou(['en-1']);
    expect(html).toContain('data-testid="xartis-aristeia-en-1"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain(KEIMENO_TELIOU);
    expect(html).toContain('pilegma-entono');
    expect(html).toContain('data-testid="xartis-aristeia-en-2"');
    expect(html).toContain('aria-pressed="false"');
  });
});

describe('xartis — DAG εξαρτήσεις και κατάσταση κλειδώματος', () => {
  const enotites = pseudos_xartis().enotites;
  const en1 = enotites[0]!;
  const en2 = enotites[1]!;
  const en3 = enotites[2]!;
  const en4 = enotites[3]!;

  it('η συνάρτηση einai_kleidomeni_enotita υπολογίζει σωστά το κλείδωμα βάσει ισχυρών προαπαιτουμένων', () => {
    // en-1: χωρίς προαπαιτούμενα -> ξεκλείδωτη
    expect(einai_kleidomeni_enotita(en1, [])).toBe(false);

    // en-2: προαπαιτεί en-1 (isxyri). Αν en-1 δεν είναι στα telies -> κλειδωμένη
    expect(einai_kleidomeni_enotita(en2, [])).toBe(true);
    expect(einai_kleidomeni_enotita(en2, ['en-1'])).toBe(false);

    // en-3: προαπαιτεί en-2 (asthenis). Ασθενές προαπαιτούμενο δεν κλειδώνει -> ξεκλείδωτη
    expect(einai_kleidomeni_enotita(en3, [])).toBe(false);

    // en-4: προαπαιτεί en-3 (isxyri). Αν en-3 δεν είναι στα telies -> κλειδωμένη
    expect(einai_kleidomeni_enotita(en4, [])).toBe(true);
    expect(einai_kleidomeni_enotita(en4, ['en-3'])).toBe(false);
  });

  it('αποδίδει το badge κατάστασης κλειδώματος (🔒 Κλειδωμένη / 🔓 Ξεκλείδωτη)', () => {
    const htmlArxiko = char_tis_proodhou([]);
    expect(htmlArxiko).toContain('data-testid="xartis-katastasi-kleidomatos"');
    expect(htmlArxiko).toContain('🔓 Ξεκλείδωτη');
    expect(htmlArxiko).toContain('🔒 Κλειδωμένη');

    // Χωρίς ολοκληρωμένες: en-1 είναι ξεκλείδωτη, en-2 είναι κλειδωμένη
    const htmlEn1 = apoidefsi(
      <KartaEnotitas enotita={en1} tetagmeni={false} allaxe_telia={() => Promise.resolve()} telies={[]} />
    );
    expect(htmlEn1).toContain('🔓 Ξεκλείδωτη');
    expect(htmlEn1).not.toContain('🔒 Κλειδωμένη');

    const htmlEn2Kleidomeni = apoidefsi(
      <KartaEnotitas enotita={en2} tetagmeni={false} allaxe_telia={() => Promise.resolve()} telies={[]} />
    );
    expect(htmlEn2Kleidomeni).toContain('🔒 Κλειδωμένη');

    const htmlEn2Xekleidoti = apoidefsi(
      <KartaEnotitas enotita={en2} tetagmeni={false} allaxe_telia={() => Promise.resolve()} telies={['en-1']} />
    );
    expect(htmlEn2Xekleidoti).toContain('🔓 Ξεκλείδωτη');
  });

  it('αποδίδει τα διαδραστικά pills προαπαιτουμένων (data-testid="xartis-dag-syndesi")', () => {
    // Όταν η προαπαιτούμενη ενότητα εκκρεμεί: ⏳ [Τίτλος/ID] (ισχυρό/ασθενικό)
    const htmlArxiko = char_tis_proodhou([]);
    expect(htmlArxiko).toContain('data-testid="xartis-dag-syndesi"');
    expect(htmlArxiko).toContain('⏳ Βασικές αρχές και ιστορικό (ισχυρό)');
    expect(htmlArxiko).toContain('⏳ Μεταβλητές και τύποι (ασθενικό)');

    // Όταν η προαπαιτούμενη ενότητα ολοκληρωθεί: ✓ [Τίτλος/ID]
    const htmlMeEn1 = char_tis_proodhou(['en-1']);
    expect(htmlMeEn1).toContain('✓ Βασικές αρχές και ιστορικό');
  });
});

describe('xartis — απόδοση ενοτήτων και badges θεμάτων', () => {
  it('εμφανίζει το badge υψηλής απόδοσης όταν apodosi > 0', () => {
    const enotita = { ...pseudos_xartis().enotites[0]!, apodosi_exetasis: null };
    const html = apoidefsi(
      <KartaEnotitas
        enotita={enotita}
        tetagmeni={false}
        allaxe_telia={() => Promise.resolve()}
        apodosi={12}
      />
    );
    expect(html).toContain('data-testid="xartis-apodosi-badge"');
    expect(html).toContain('⭐ Θέματα: +12 μονάδες');
  });

  it('δεν εμφανίζει το badge όταν η απόδοση είναι 0 ή μηδενική', () => {
    const enotita = { ...pseudos_xartis().enotites[0]!, apodosi_exetasis: 0 };
    const html = apoidefsi(
      <KartaEnotitas
        enotita={enotita}
        tetagmeni={false}
        allaxe_telia={() => Promise.resolve()}
        apodosi={0}
      />
    );
    expect(html).not.toContain('data-testid="xartis-apodosi-badge"');
  });

  it('ο OdomosEnotiton περνάει την απόδοση στις κάρτες', () => {
    const xartis = pseudos_xartis();
    const html = apoidefsi(
      <OdomosEnotiton
        xartis={xartis}
        telies={[]}
        allaxe_telia={() => Promise.resolve()}
        apodosi={{ 'en-1': 18 }}
      />
    );
    expect(html).toContain('data-testid="xartis-apodosi-badge"');
    expect(html).toContain('⭐ Θέματα: +18 μονάδες');
  });

  describe('xartis — ProodosDimiourgiasXarti (Stream 3)', () => {
    it('περιλαμβάνει και τα τρία στάδια ανάλυσης διαφανειών και DAG ταξινόμησης', () => {
      expect(STADIA_DIMIOURGIAS_XARTI).toEqual([
        'Επεξεργασία διαφανειών...',
        'Τοπολογική ταξινόμηση DAG...',
        'Ολοκλήρωση χάρτη...',
      ]);
    });

    it('αποδίδει το component με data-testid="xartis-proodos-analisis", progress bar και ποσοστό', () => {
      const html = renderToStaticMarkup(<ProodosDimiourgiasXarti stadio={1} pososto={33} />);
      expect(html).toContain('data-testid="xartis-proodos-analisis"');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuenow="33"');
      expect(html).toContain('33%');
      expect(html).toContain('ion-progress-bar');
      expect(html).toContain('Επεξεργασία διαφανειών...');
      expect(html).toContain('Τοπολογική ταξινόμηση DAG...');
      expect(html).toContain('Ολοκλήρωση χάρτη...');
    });

    it('αποδίδει ένδειξη ολοκλήρωσης σταδίων 2 και 3', () => {
      const html2 = renderToStaticMarkup(<ProodosDimiourgiasXarti stadio={2} pososto={66} />);
      expect(html2).toContain('aria-valuenow="66"');
      expect(html2).toContain('66%');
      expect(html2).toContain('Στάδιο 2/3');

      const html3 = renderToStaticMarkup(<ProodosDimiourgiasXarti stadio={3} pososto={100} />);
      expect(html3).toContain('aria-valuenow="100"');
      expect(html3).toContain('100%');
      expect(html3).toContain('Στάδιο 3/3');
    });

    it('αποδίδει το πρώτο στάδιο όταν δεν δίνεται ποσοστό', () => {
      const html = renderToStaticMarkup(<ProodosDimiourgiasXarti stadio={1} />);
      expect(html).toContain('data-testid="xartis-proodos-analisis"');
      expect(html).toContain('33%');
      expect(html).toContain('Επεξεργασία διαφανειών...');
    });
  });
});

/** Κωδικός μαθήματος για τις δοκιμές της οθόνης. */
const KODIKOS_XARTI = 'ΠΛΗ201';

/** Γράφει τα αρχεία που χρειάζεται η οθόνη του χάρτη μέσα στην τεστ αποθήκη. */
async function apoidefsi_xarti_data(apothiki: MnimiApothiki, telies: readonly string[], kodikos: string): Promise<void> {
  await apothiki.grapse_keimeno(`${kodikos}/.spoudes/xartis.json`, JSON.stringify(pseudos_xartis()));
  await apothiki.grapse_keimeno('mathimata.json', JSON.stringify(pseudos_mathimata()));
  await apothiki.grapse_keimeno(`${kodikos}/proodhos.json`, JSON.stringify({ aristeiesEnotiton: telies }));
}

/** Αποδίδει την οθόνη του χάρτη σε πραγματικό DOM, με δεδομένα μέσα από την αποθήκη. */
async function apoidefsi_xarti(telies: readonly string[] = []): Promise<ReturnType<typeof render>> {
  const apothiki = new MnimiApothiki();
  await apoidefsi_xarti_data(apothiki, telies, KODIKOS_XARTI);
  const periballon = ftiaxe_periballon_test({ apothiki });
  const result = render(
    me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos={KODIKOS_XARTI}>
        <MemoryRouter initialEntries={['/xartis']}>
          <Routes>
            <Route path="/xartis" element={<XartisEnotiton />} />
            <Route path="/odigos/:enotitaId" element={<div data-testid="alilos-odigos">οδηγός</div>} />
            <Route path="/mathimata" element={<div data-testid="alilos-mathimata">μαθήματα</div>} />
          </Routes>
        </MemoryRouter>
      </ParoxeApothekisis>,
      periballon
    )
  );
  await waitFor(() => expect(result.queryAllByTestId('xartis-enotita').length).toBeGreaterThan(0), { timeout: 2000 });
  return result;
}

/** Αποδίδει την οθόνη χωρίς χάρτη (κενή κατάσταση) σε πραγματικό DOM. */
async function apoidefsi_xarti_keno(): Promise<ReturnType<typeof render>> {
  const apothiki = new MnimiApothiki();
  await apothiki.grapse_keimeno('mathimata.json', JSON.stringify([]));
  // δεν γράφει xartis.json → η οθόνη μένει στη κενή κατάσταση, χωρίς επιλεγμένο μάθημα
  const periballon = ftiaxe_periballon_test({ apothiki });
  const result = render(
    me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos="">
        <MemoryRouter initialEntries={['/xartis']}>
          <Routes>
            <Route path="/xartis" element={<XartisEnotiton />} />
            <Route path="/odigos/:enotitaId" element={<div data-testid="alilos-odigos">οδηγός</div>} />
            <Route path="/mathimata" element={<div data-testid="alilos-mathimata">μαθήματα</div>} />
          </Routes>
        </MemoryRouter>
      </ParoxeApothekisis>,
      periballon
    )
  );
  await waitFor(() => expect(result.queryAllByTestId('xartis-dimiourgia').length).toBeGreaterThan(0), { timeout: 2000 });
  return result;
}

/** Αποδίδει την οθόνη χωρίς χάρτη, με κωδικό μαθήματος, σε πραγματικό DOM. */
async function apoidefsi_xarti_keno_kodikou(): Promise<ReturnType<typeof render>> {
  const apothiki = new MnimiApothiki();
  await apothiki.grapse_keimeno('mathimata.json', JSON.stringify([]));
  // δεν γράφει xartis.json → η οθόνη μένει στη κενή κατάσταση
  const periballon = ftiaxe_periballon_test({ apothiki });
  const result = render(
    me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos={KODIKOS_XARTI}>
        <MemoryRouter initialEntries={['/xartis']}>
          <Routes>
            <Route path="/xartis" element={<XartisEnotiton />} />
            <Route path="/odigos/:enotitaId" element={<div data-testid="alilos-odigos">οδηγός</div>} />
            <Route path="/mathimata" element={<div data-testid="alilos-mathimata">μαθήματα</div>} />
          </Routes>
        </MemoryRouter>
      </ParoxeApothekisis>,
      periballon
    )
  );
  await waitFor(() => expect(result.queryAllByTestId('xartis-dimiourgia').length).toBeGreaterThan(0), { timeout: 2000 });
  return result;
}

/** Αποδίδει την οθόνη με χαλασμένο χάρτη (κατάσταση σφάλματος) σε πραγματικό DOM. */
async function apoidefsi_xarti_sfalma(): Promise<ReturnType<typeof render>> {
  const apothiki = new MnimiApothiki();
  await apothiki.grapse_keimeno('mathimata.json', JSON.stringify([]));
  await apothiki.grapse_keimeno(`${KODIKOS_XARTI}/.spoudes/xartis.json`, '{όχι-έγκυρο-json');
  const periballon = ftiaxe_periballon_test({ apothiki });
  const result = render(
    me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos={KODIKOS_XARTI}>
        <MemoryRouter initialEntries={['/xartis']}>
          <Routes>
            <Route path="/xartis" element={<XartisEnotiton />} />
            <Route path="/odigos/:enotitaId" element={<div data-testid="alilos-odigos">οδηγός</div>} />
            <Route path="/mathimata" element={<div data-testid="alilos-mathimata">μαθήματα</div>} />
          </Routes>
        </MemoryRouter>
      </ParoxeApothekisis>,
      periballon
    )
  );
  await waitFor(() => expect(result.queryAllByTestId('xartis-dimiourgia').length).toBeGreaterThan(0), { timeout: 2000 });
  return result;
}

describe('xartis — οθόνη σε πραγματικό DOM', () => {
  afterEach(() => {
    cleanup();
    (generateCourseMap as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it('φορτώνει τον χάρτη από την αποθήκη και δείχνει τις ενότητες με προαπαιτούμενες', async () => {
    const result = await apoidefsi_xarti();
    expect(result.queryAllByTestId('xartis-enotita').length).toBe(4);
    expect(result.queryAllByTestId('xartis-dag-syndesi').length).toBeGreaterThan(0);
    expect(result.queryByTestId('xartis-telos')).not.toBeNull();
  });

  it('σημειώνει μια ενότητα ως ολοκληρωμένη όταν πατηθεί το κουμπί', async () => {
    const result = await apoidefsi_xarti();
    const enotitaId = 'en-1';
    const koumpi = result.getByTestId(`xartis-aristeia-${enotitaId}`);
    expect(koumpi.textContent).toBe('Σημείωση ως ολοκληρωμένη');
    fireEvent.click(koumpi);
    await waitFor(() => expect(result.getByTestId(`xartis-aristeia-${enotitaId}`).textContent).toBe('Ολοκληρώθηκε'), { timeout: 2000 });
  });

  it('πηγαίνει στη διαδρομή οδηγού όταν πατηθεί μια συνάρτηση DAG', async () => {
    const result = await apoidefsi_xarti();
    const syndesi = result.getAllByTestId('xartis-dag-syndesi')[0];
    fireEvent.click(syndesi);
    await waitFor(() => expect(result.queryByTestId('alilos-odigos')).not.toBeNull(), { timeout: 2000 });
  });

  it('δεν έχει φίλτρα μαθημάτων όταν δεν υπάρχει επιλεγμένο μάθημα', async () => {
    const result = await apoidefsi_xarti_keno();
    expect(result.queryByTestId('alilos-mathimata')).toBeNull();
    expect(result.queryByText('Επίλεξε μάθημα για να δεις την ύλη.')).not.toBeNull();
  });

  it('επαναφορτώνει τον χάρτη με το κουμπί επανάληψης', async () => {
    const result = await apoidefsi_xarti_sfalma();
    expect(result.getByText('Ο χάρτης χρειάζεται ανάλυση')).not.toBeNull();
    const koumpi = result.getByText('Επανάληψη ανάλυσης');
    fireEvent.click(koumpi);
    expect(result.queryByTestId('xartis-enotita')).toBeNull();
  });

  it('ακινεί τον χάρτη και δείχνει τα στάδια ανάλυσης όσο δημιουργείται', async () => {
    // Η ανάλυση είναι απομονημένη στο test, με καθυστέρηση ώστε να παρατηρηθεί η κατάσταση φόρτωσης.
    (generateCourseMap as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, timi: pseudos_xartis() }), 300))
    );
    const result = await apoidefsi_xarti_keno_kodikou();
    const checkbox = result.getByTestId('xartis-gemini-optin');
    fireEvent.click(checkbox);
    await waitFor(() => expect(result.getByTestId('xartis-dimiourgia').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('xartis-dimiourgia'));
    await waitFor(() => expect(result.queryAllByTestId('xartis-proodos-analisis')).toHaveLength(1), { timeout: 4000 });
    await waitFor(() => expect(result.queryAllByTestId('katastasi-fortosi')).not.toBeNull(), { timeout: 4000 });
    await waitFor(() => expect(result.queryAllByTestId('xartis-enotita').length).toBeGreaterThan(0), { timeout: 6000 });
  });

  it('εναλλάσσει τα φίλτρα μαθημάτων όταν υπάρχουν συγχρονισμένα', async () => {
    const apothiki = new MnimiApothiki();
    await apoidefsi_xarti_data(apothiki, [], KODIKOS_XARTI);
    // Το δεύτερο συγχρονισμένο μάθημα είναι επίσης στα μαθήματα, ώστε να μην επέλθει επαναφορά.
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify(pseudos_mathimata().slice(0, 2)));
    await apothiki.grapse_keimeno('rythmiseis.json', JSON.stringify({ mathimataSynch: ['ΠΛΗ201', 'ΠΛΗ101'] }));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/xartis']}>
            <Routes>
              <Route path="/xartis" element={<XartisEnotiton />} />
              <Route path="/odigos/:enotitaId" element={<div data-testid="alilos-odigos">οδηγός</div>} />
              <Route path="/mathimata" element={<div data-testid="alilos-mathimata">μαθήματα</div>} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.queryAllByTestId('xartis-enotita').length).toBeGreaterThan(0), { timeout: 2000 });
    expect(result.queryAllByTestId('xartis-dimiourgia')).toHaveLength(0);
    const koumpiA = result.getByRole('button', { name: 'ΠΛΗ201' });
    const koumpiB = result.getByRole('button', { name: 'ΠΛΗ101' });
    expect(koumpiA.getAttribute('aria-pressed')).toBe('true');
    expect(koumpiB.getAttribute('aria-pressed')).toBe('false');

    // Εναλλαγή στο δεύτερο συγχρονισμένο μάθημα.
    fireEvent.click(koumpiB);
    await waitFor(() => expect(result.getByRole('button', { name: 'ΠΛΗ101' }).getAttribute('aria-pressed')).toBe('true'), { timeout: 2000 });
    expect(result.getByRole('button', { name: 'ΠΛΗ201' }).getAttribute('aria-pressed')).toBe('false');

    // Το δεύτερο μάθημα δεν έχει χάρτη, η οθόνη επαναφορτώνεται.
    await waitFor(() => expect(result.queryAllByTestId('xartis-enotita').length).toBe(0), { timeout: 3000 });
    expect(result.queryByText('Δημιουργία χάρτη μαθήματος')).not.toBeNull();
  });

  it('επιβεβαιώνει το opt-in Gemini και ενεργοποιεί το κουμπί δημιουργίας', async () => {
    const result = await apoidefsi_xarti_keno_kodikou();
    const checkbox = result.getByTestId('xartis-gemini-optin');
    expect(checkbox).not.toBeNull();
    expect(result.getByTestId('xartis-dimiourgia').disabled).toBe(true);
    fireEvent.click(checkbox);
    await waitFor(() => expect(result.getByTestId('xartis-dimiourgia').disabled).toBe(false), { timeout: 2000 });
  });

  it('αναφέρει σφάλμα όταν αποτύχει η ανάλυση υλικού', async () => {
    (generateCourseMap as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Αδυναμία ανάλυσης'));
    const result = await apoidefsi_xarti_keno_kodikou();
    const checkbox = result.getByTestId('xartis-gemini-optin');
    fireEvent.click(checkbox);
    await waitFor(() => expect(result.getByTestId('xartis-dimiourgia').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('xartis-dimiourgia'));
    await waitFor(() => expect(result.queryByText('Αδυναμία ανάλυσης')).not.toBeNull(), { timeout: 4000 });
  });

  it('δεν εκτελεί διπλή δημιουργία όταν ο χάρτης ήδη δημιουργείται', async () => {
    (generateCourseMap as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, timi: pseudos_xartis() }), 600))
    );
    const result = await apoidefsi_xarti_keno_kodikou();
    const checkbox = result.getByTestId('xartis-gemini-optin');
    fireEvent.click(checkbox);
    await waitFor(() => expect(result.getByTestId('xartis-dimiourgia').disabled).toBe(false), { timeout: 2000 });
    const koumpi = result.getByTestId('xartis-dimiourgia');
    fireEvent.click(koumpi);
    await waitFor(() => expect(result.queryAllByTestId('xartis-proodos-analisis')).toHaveLength(1), { timeout: 1000 });
    // η οθόνη απενεργοποιεί το κουμπί, αλλά η συνάρτηση προστασίας δέχεται κλήση
    koumpi.removeAttribute('disabled');
    fireEvent.click(koumpi);
    expect(result.queryAllByTestId('xartis-proodos-analisis')).toHaveLength(1);
    expect(result.queryAllByTestId('xartis-enotita')).toHaveLength(0);
  });

  it('περνάει από όλα τα στάδια ανάλυσης όσο ανεβαίνει το ποσοστό', async () => {
    (generateCourseMap as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, timi: pseudos_xartis() }), 5000))
    );
    const result = await apoidefsi_xarti_keno_kodikou();
    const checkbox = result.getByTestId('xartis-gemini-optin');
    fireEvent.click(checkbox);
    await waitFor(() => expect(result.getByTestId('xartis-dimiourgia').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('xartis-dimiourgia'));
    await waitFor(() => expect(result.getByTestId('xartis-proodos-analisis')).not.toBeNull(), { timeout: 1000 });
    await waitFor(() => expect(result.getByTestId('xartis-proodos-pososto').textContent).toContain('50%'), { timeout: 3000 });
    await waitFor(() => expect(result.getByTestId('xartis-proodos-pososto').textContent).toContain('80%'), { timeout: 3000 });
    await waitFor(() => expect(result.getByTestId('xartis-proodos-pososto').textContent).toContain('95%'), { timeout: 3000 });
    await waitFor(() => expect(result.queryAllByTestId('xartis-enotita').length).toBe(4), { timeout: 6000 });
  }, 30000);

  it('αναφέρει σφάλμα δικτύου όταν αποτυγχάνει η φόρτωση των δεδομένων', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify(pseudos_mathimata().slice(0, 1)));
    const diavase_proto = apothiki.diavase_keimeno.bind(apothiki);
    apothiki.diavase_keimeno = async (diadromi: string) => {
      if (diadromi === 'ΠΛΗ201/.spoudes/xartis.json' || diadromi === 'ΠΛΗ201/apodosi.json') {
        throw new Error('Αδυναμία φόρτωσης δεδομένων');
      }
      return diavase_proto(diadromi);
    };
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/xartis']}>
            <Routes>
              <Route path="/xartis" element={<XartisEnotiton />} />
              <Route path="/odigos/:enotitaId" element={<div data-testid="alilos-odigos">οδηγός</div>} />
              <Route path="/mathimata" element={<div data-testid="alilos-mathimata">μαθήματα</div>} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.queryByText('Δεν ήταν δυνατή η φόρτωση του χάρτη του μαθήματος.')).not.toBeNull(), { timeout: 4000 });
    expect(result.getByTestId('xartis-dimiourgia')).not.toBeNull();
  });

  it('δείχνει το σφάλμα επιβεβαίωσης όταν αποτυγχάνει η αποθήκευση του opt-in', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify(pseudos_mathimata().slice(0, 1)));
    const grapse_proto = apothiki.grapse_keimeno.bind(apothiki);
    apothiki.grapse_keimeno = async (diadromi: string, periexomeno: string) => {
      if (diadromi.includes('rytheseis-ai.json')) {
        return { ok: false, sfalma: { kodikos: 'DEN_VRETHIKE', minima: 'Δεν αποθηκεύτηκε η επιλογή Gemini.' } };
      }
      return grapse_proto(diadromi, periexomeno);
    };
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/xartis']}>
            <Routes>
              <Route path="/xartis" element={<XartisEnotiton />} />
              <Route path="/odigos/:enotitaId" element={<div data-testid="alilos-odigos">οδηγός</div>} />
              <Route path="/mathimata" element={<div data-testid="alilos-mathimata">μαθήματα</div>} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.queryAllByTestId('xartis-dimiourgia').length).toBeGreaterThan(0), { timeout: 2000 });
    const checkbox = result.getByTestId('xartis-gemini-optin');
    fireEvent.click(checkbox);
    await waitFor(() => expect(result.queryByText('Δεν αποθηκεύτηκε η επιλογή Gemini.')).not.toBeNull(), { timeout: 2000 });
  });

  it('δεν καλεί τη δημιουργία όταν ο κωδικός μαθήματος λείπει', async () => {
    const result = await apoidefsi_xarti_keno();
    const koumpi = result.getByTestId('xartis-dimiourgia');
    expect(koumpi.disabled).toBe(true);
    koumpi.removeAttribute('disabled');
    fireEvent.click(koumpi);
    expect(result.queryAllByTestId('xartis-enotita')).toHaveLength(0);
  });

  it('αναφέρει σφάλμα όταν η ανάλυση επιστρέφει ok=false', async () => {
    (generateCourseMap as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        Promise.resolve({
          ok: false,
          sfalma: { kodikos: 'SFALMA_XARTI', minima: 'Αδυναμία ανάλυσης υλικού' },
        })
    );
    const result = await apoidefsi_xarti_keno_kodikou();
    const checkbox = result.getByTestId('xartis-gemini-optin');
    fireEvent.click(checkbox);
    await waitFor(() => expect(result.getByTestId('xartis-dimiourgia').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('xartis-dimiourgia'));
    await waitFor(() => expect(result.queryByText('Αδυναμία ανάλυσης υλικού')).not.toBeNull(), { timeout: 4000 });
  });

  it('αναφέρει το κείμενο που απορρίφθηκε όταν δεν είναι Error', async () => {
    (generateCourseMap as unknown as ReturnType<typeof vi.fn>).mockRejectedValue('Αδυναμία επικοινωνίας');
    const result = await apoidefsi_xarti_keno_kodikou();
    const checkbox = result.getByTestId('xartis-gemini-optin');
    fireEvent.click(checkbox);
    await waitFor(() => expect(result.getByTestId('xartis-dimiourgia').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('xartis-dimiourgia'));
    await waitFor(() => expect(result.queryByText(MINIMA_SFALMATOS_XARTI)).not.toBeNull(), { timeout: 4000 });
  });

  it('η σύνδεση DAG με μη έγκυρο id δεν πλοηγείται', async () => {
    const periballon = ftiaxe_periballon_test();
    const enotita = {
      ...pseudos_xartis().enotites[1]!,
      proapaitoumenes: [{ enotita_id: '\\\\evil.example', isxys: 'isxyri' }],
    };
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <KartaEnotitas
            enotita={enotita}
            tetagmeni={false}
            allaxe_telia={() => Promise.resolve()}
            telies={[]}
          />
        </MemoryRouter>,
        periballon
      )
    );
    const syn = result.getByTestId('xartis-dag-syndesi');
    expect(syn.textContent).toContain('⏳');
    fireEvent.click(syn);
    await waitFor(() => expect(result.queryAllByTestId('xartis-enotita')).toHaveLength(1), { timeout: 2000 });
  });

  it('η απόδοση προέρχεται από την ενότητα όταν δεν δίνεται apodosi', async () => {
    const enotita = { ...pseudos_xartis().enotites[0]!, apodosi_exetasis: null };
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <KartaEnotitas
            enotita={enotita}
            tetagmeni={false}
            allaxe_telia={() => Promise.resolve()}
            telies={[]}
          />
        </MemoryRouter>,
        ftiaxe_periballon_test()
      )
    );
    expect(result.queryByTestId('xartis-apodosi-badge')).toBeNull();
    expect(result.queryAllByTestId('xartis-enotita')).toHaveLength(1);
  });
});

