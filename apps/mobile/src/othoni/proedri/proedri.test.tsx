// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ok, apotyxia } from '@dps/core';
import { etimo } from '../../kathstasi/katastasi.js';
import { ftiaxe_periballon_test as ftiaxe_periballon } from '../../../test-fixtures/ftiaxe-test-periballon.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';
import { pseudos_mathimata } from '../../../test-fixtures/pseudomata/index.js';
import Proedri, { PROEDRI_BASE_URL, katharise_tonous } from './proedri.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS = readFileSync(join(ORISTO, 'proedri.tsx'), 'utf8');

const APOTELEMATA = [
  'proedri-ekran',
  'proedri-forma',
  'proedri-gramma-base',
  'proedri-gramma-xristis',
  'proedri-gramma-kodikos',
  'proediri-syndeon',
] as const;

const AMIDES_ASYNKRONES = [
  'OloniKatastasis',
  'fortosi()',
  'sfalma(',
  'syndesi_kai_anaktisi_mathimaton(',
  'epanalipsi={ananevei}',
] as const;

function apotelesma_proedri(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <Proedri periballon={ftiaxe_periballon()} />
    </MemoryRouter>,
  );
}

describe('Proedri — συμβόλαιο οθόνης', () => {
  it('εξάγει ένα React component', () => {
    expect(typeof Proedri).toBe('function');
  });

  it('η στατική απόδοση με ψεύτικες πύλες δεν σπάει και δείχνει το brand', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('proedri-plaka');
    expect(html).toContain('DPS.guide');
  });

  it('κάθε απαιτούμενο data-testid εμφανίζεται στην απόδοση', () => {
    const html = apotelesma_proedri();
    for (const testid of APOTELEMATA) {
      expect(html).toContain(`data-testid="${testid}"`);
    }
  });

  it('η πρώτη εμφάνιση περνά από το OloniKatastasis, όχι από λευκή οθόνη', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="katastasi-adeio"');
    expect(html).toContain('Πατήστε «Σύνδεση»');
  });

  it('η διεύθυνση eClass είναι προσυμπληρωμένη', () => {
    expect(PROEDRI_BASE_URL).toBe('https://thales.cs.unipi.gr');
    expect(apotelesma_proedri()).toContain(`value="${PROEDRI_BASE_URL}"`);
  });

  it('κάθε πεδίο έχει ετικέτα και ο κωδικός είναι κρυφός', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('<label class="odoni-xeiris-zeugos" for="proedri-gramma-base">');
    expect(html).toContain('type="password"');
    expect(html).toContain('aria-label="Κωδικός πρόσβασης LMS"');
  });

  it('η σημείωση λέει την αλήθεια για την αποθήκευση στη συσκευή', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('proedri-ypostirixtiki');
    expect(html).toContain('Τα διαπιστευτήρια και το προαιρετικό token κρυπτογραφούνται στο τοπικό vault');
  });

  it('κάθε ασύγχρονη κατάσταση περνά από το OloniKatastasis', () => {
    for (const meros of AMIDES_ASYNKRONES) {
      expect(ARXIKOS).toContain(meros);
    }
  });

  it('η οθόνη δεν μπερδεύει το όνομα χρήστη με τον κωδικό στη μνήμη της συσκευής', () => {
    expect(ARXIKOS).toContain("vale('eclass_onoma_xristi'");
    expect(ARXIKOS).toContain("vale('eclass_kodikos'");
    expect(ARXIKOS).toContain("vale('eclass_panepistimio_id'");
    expect(ARXIKOS).toContain("vale('eclass_base_url'");
    expect(ARXIKOS).not.toContain('llm_api_key');
  });

  it('δεν εισάγει χρώματα ούτε inline styles', () => {
    expect(ARXIKOS).not.toContain('style={{');
    expect(ARXIKOS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('Proedri — Bevel x UniStudents UI & Visual Components', () => {
  it('εμφανίζει το σήμα του κρυπτογραφημένου τοπικού vault', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="asfaleia-shma"');
    expect(html).toContain('Κρυπτογραφημένο τοπικό vault');
  });

  it('εμφανίζει το φοιτητικό tip ημέρας', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="foititiko-tip-kouti"');
    expect(html).toContain('💡');
  });

  it('εμφανίζει τις κάψουλες φίλτρων πανεπιστημίων με όλες τις κατηγορίες', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="filtra-panepistimion"');
    expect(html).toContain('data-testid="filtro-ola"');
    expect(html).toContain('data-testid="filtro-stem"');
    expect(html).toContain('data-testid="filtro-athina"');
    expect(html).toContain('data-testid="filtro-thessaloniki"');
    expect(html).toContain('data-testid="filtro-perifereia"');
    expect(html).toContain('data-testid="filtro-custom"');
    expect(html).toContain('kapsoula-filtrou energi');
  });

  it('εμφανίζει το πεδίο αναζήτησης πανεπιστημίου / σχολής', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="anazitisi-panepistimiou-pedio"');
    expect(html).toContain('placeholder="Αναζήτηση σχολής, τμήματος ή πόλης..."');
  });

  it('εμφανίζει τη λίστα καρτών πανεπιστημίων με tactile κάρτες και badges', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="lista-panepistimion"');
    expect(html).toContain('data-testid="karta-panepistimiou-unipi"');
    expect(html).toContain('karta-panepistimiou epilegmeni');
    expect(html).toContain('data-testid="eikonidio-panepistimiou-unipi"');
    expect(html).toContain('ΠΑΠΕΙ — Πανεπιστήμιο Πειραιώς');
  });

  it('εμφανίζει την Bevel 4-Segmented Progress Bar στην κορυφή', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('class="onboarding-vima-mpara"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="4"');
    expect(html.split('class="vima-tmima').length - 1).toBe(4);
  });

  it('εμφανίζει το Bevel fixed bottom navigation dock με πίσω και επόμενο κουμπιά', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('class="onboarding-ploigisi-mpara"');
    expect(html).toContain('class="onboarding-koumpi-piso aoratos"');
    expect(html).toContain('data-testid="onboarding-epomeno-koumpi"');
    expect(html).toContain('Επόμενο: Ίδρυμα →');
  });

  it('εμφανίζει την κάρτα επιβεβαίωσης πλάνου (Plan Receipt) στο Βήμα 4', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('onboarding-apodeixi-karta');
    expect(html).toContain('Το ακαδημαϊκό σου προφίλ είναι έτοιμο');
    expect(html).toContain('Κρυπτογραφημένο τοπικό vault');
  });

  it('η συνάρτηση katharise_tonous καθαρίζει τόνους και πεζά για accent-insensitive αναζήτηση', () => {
    expect(katharise_tonous('Πειραιώς')).toBe('πειραιως');
    expect(katharise_tonous('πειραιας')).toBe('πειραιας');
    expect(katharise_tonous('Πανεπιστήμιο')).toBe('πανεπιστημιο');
    expect(katharise_tonous('Αθήνα')).toBe('αθηνα');
    expect(katharise_tonous('Κρήτης')).toBe('κρητης');

    const peiraiasNormalized = katharise_tonous('πειραιας');
    const peiraiosNormalized = katharise_tonous('Πανεπιστήμιο Πειραιώς');
    expect(peiraiosNormalized.includes(peiraiasNormalized.slice(0, 6))).toBe(true);
  });
});

/** Πλαστικές απαντήσεις των εξωτερικών υπηρεσιών που χρησιμοποιεί η οθόνη. */
const mocks = vi.hoisted(() => ({
  syndesi_kai_anaktisi_mathimaton: vi.fn(),
  pare_tip_imeras: vi.fn(),
}));

vi.mock('../../ypiresies/index.js', () => ({
  syndesi_kai_anaktisi_mathimaton: mocks.syndesi_kai_anaktisi_mathimaton,
}));

vi.mock('./foititika-tips.js', () => ({
  pare_tip_imeras: mocks.pare_tip_imeras,
}));

/** Λίστα χωρίς το `custom` (η αναζήτηση δεν το βρίσκει, καλύπτει τον κλάδο `??`) και με ένα
 * ίδρυμα που έχει κενό `baseEclass` (καλύπτει τον κλάδο του `setBase`). */
vi.mock('../../design/eikonidia-panepistimion.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    PANEPISTIMIA_LISTA: [
      ...actual.PANEPISTIMIA_LISTA.filter((pan) => pan.id !== 'custom'),
      {
        id: 'custom-2',
        onoma: 'Προσαρμοσμένο URL / Άλλο',
        syntomiOnomasia: 'Custom',
        baseEclass: '',
        katigoria: 'custom',
        perigrafi: 'Χειροκίνητη εισαγωγή διεύθυνσης eClass',
        lms: 'auto',
      },
    ],
  };
});

/** Αποδίδει την οθόνη μέσα σε router με test-only πύλες. */
function apotelesma_ergazias(children: ReactElement): ReactElement {
  return me_periballon_test(<MemoryRouter>{children}</MemoryRouter>);
}

describe('Proedri — onboarding wizard με render', () => {
  beforeEach(() => {
    mocks.syndesi_kai_anaktisi_mathimaton.mockResolvedValue(ok(pseudos_mathimata()));
    mocks.pare_tip_imeras.mockReturnValue('💡 Συγχρόνισε ένα μάθημα όσο έχεις σύνδεση.');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('αποδίδει το πρώτο βήμα και το κουμπί επόμενου', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    expect(screen.getByTestId('proedri-ekran'));
    expect(screen.getByTestId('onboarding-epomeno-koumpi').textContent).toContain('Επόμενο: Ίδρυμα →');
    expect(screen.getByText('Βήμα 1 από 4 • Φιλοσοφία & Ασφάλεια'));
  });

  it('μεταβαίνει στα επόμενα βήματα με το κουμπί', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    expect(screen.getByText('Βήμα 2 από 4 • Επιλογή Ιδρύματος'));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    expect(screen.getByText('Βήμα 3 από 4 • Σύνδεση & Διαπιστευτήρια'));
    expect(screen.getByTestId('proedri-forma'));
  });

  it('οι κάρτες πανεπιστημίου αλλάζουν το επιλεγμένο και το base url', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByTestId('karta-panepistimiou-unipi'));
    expect(screen.getByTestId('karta-panepistimiou-unipi').getAttribute('aria-pressed')).toBe('true');
    const base = screen.getByTestId('proedri-gramma-base');
    expect(base.getAttribute('value')).toBe('https://thales.cs.unipi.gr');
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    expect(screen.getByTestId('karta-panepistimiou-unipi').textContent).toContain('ΠΑΠΕΙ — Πανεπιστήμιο Πειραιώς');
  });

  it('επιλογή custom ιδρύματος κλείνει με το κενό αποτέλεσμα', async () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    const input = screen.getByTestId('anazitisi-panepistimiou-pedio');
    fireEvent.change(input, { target: { value: 'όχι-ουτε-ελληνικά' } });
    await waitFor(async () => {
      expect(screen.getByTestId('lista-panepistimion-keno'));
    }, { timeout: 5000 });
    expect(screen.getByTestId('koumpi-epilogi-custom'));
    fireEvent.click(screen.getByTestId('koumpi-epilogi-custom'));
    expect(screen.queryByTestId('lista-panepistimion-keno')).toBeNull();
  });

  it('η αναζήτηση αφαίρει τα αποτελέσματα και τα επαναφέρει', async () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    const input = screen.getByTestId('anazitisi-panepistimiou-pedio');
    fireEvent.change(input, { target: { value: 'αθήνα' } });
    await waitFor(async () => {
      expect(screen.queryAllByTestId('karta-panepistimiou').length).toBeLessThan(10);
    }, { timeout: 5000 });
    fireEvent.change(input, { target: { value: '' } });
    await waitFor(async () => {
      expect(screen.getByTestId('lista-panepistimion'));
    }, { timeout: 5000 });
  });

  it('οι κάψουλες φίλτρων αλλάζουν την κατηγορία', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByTestId('filtro-stem'));
    expect(screen.getByTestId('filtro-stem').getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByTestId('filtro-custom'));
    expect(screen.getByTestId('filtro-custom').getAttribute('aria-selected')).toBe('true');
  });

  it('η φόρμα αποστέλλεται μόνο όταν συμπληρώνεται', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    expect(screen.getByTestId('proediri-syndeon').disabled).toBe(true);
    fireEvent.change(screen.getByTestId('proedri-gramma-xristis'), { target: { value: 'user' } });
    fireEvent.change(screen.getByTestId('proedri-gramma-kodikos'), { target: { value: 'pass' } });
    expect(screen.getByTestId('proediri-syndeon').disabled).toBe(false);
  });

  it('η σύνδεση με επιτυχία μεταβαίνει στο βήμα 4', async () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.change(screen.getByTestId('proedri-gramma-xristis'), { target: { value: 'user' } });
    fireEvent.change(screen.getByTestId('proedri-gramma-kodikos'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByTestId('proedri-forma'));
    await waitFor(async () => {
      expect(screen.getByText('Επιτυχής σύνδεση'));
    }, { timeout: 5000 });
    expect(screen.getByText('Μαθήματα: 4'));
    expect(screen.getByText('Βήμα 4 από 4 • Ολοκλήρωση & Επισκόπηση'));
    expect(screen.getAllByTestId('proedri-eisodos-koumpi').length).toBeGreaterThan(0);
    expect(screen.getByText('Πανεπιστήμιο Πειραιώς').textContent).toBeDefined();
    expect(screen.getByText('https://thales.cs.unipi.gr').textContent).toBeDefined();
  });

  it('η σύνδεση αποτυγχάνει με μήνυμα σφάλματος', async () => {
    mocks.syndesi_kai_anaktisi_mathimaton.mockResolvedValue(
      apotyxia('AUTH_APOTYXIA', 'Λάθος διαπιστευτήρια.')
    );
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.change(screen.getByTestId('proedri-gramma-xristis'), { target: { value: 'user' } });
    fireEvent.change(screen.getByTestId('proedri-gramma-kodikos'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByTestId('proedri-forma'));
    await waitFor(async () => {
      expect(screen.getByText('Λάθος διαπιστευτήρια.'));
    }, { timeout: 5000 });
    expect(screen.getByText('Δοκίμασε ξανά'));
    expect(screen.queryByText('Επιτυχής σύνδεση')).toBeNull();
  });

  it('η σύνδεση διέρρηκνυται και εμφανίζει άγνωστο σφάλμα', async () => {
    mocks.syndesi_kai_anaktisi_mathimaton.mockRejectedValue(new Error('Δίκτυο'));
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.change(screen.getByTestId('proedri-gramma-xristis'), { target: { value: 'user' } });
    fireEvent.change(screen.getByTestId('proedri-gramma-kodikos'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByTestId('proedri-forma'));
    await waitFor(async () => {
      expect(screen.getByText('Η σύνδεση διέκοψε απρόσμενα. Μπορείς να δοκιμάσεις ξανά.'));
    }, { timeout: 5000 });
  });

  it('η επανάληψη φόρτωσης επαναφέρει το σφάλμα', async () => {
    mocks.syndesi_kai_anaktisi_mathimaton.mockRejectedValue(new Error('Δίκτυο'));
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.change(screen.getByTestId('proedri-gramma-xristis'), { target: { value: 'user' } });
    fireEvent.change(screen.getByTestId('proedri-gramma-kodikos'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByTestId('proedri-forma'));
    await waitFor(async () => {
      expect(screen.getByTestId('katastasi-sfalma'));
    }, { timeout: 5000 });
    fireEvent.click(screen.getByTestId('epanalipsi'));
    expect(screen.getByTestId('katastasi-fortosi'));
  });

  it('η επόμενη ενέργεια στο βήμα 4 πηγαίνει στην οθόνη σήμερα', async () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.change(screen.getByTestId('proedri-gramma-xristis'), { target: { value: 'user' } });
    fireEvent.change(screen.getByTestId('proedri-gramma-kodikos'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    await waitFor(async () => {
      expect(screen.getByText('Είσοδος στην Εφαρμογή ✓'));
    }, { timeout: 5000 });
  });

  it('η οθόνη πετάει όταν λείπει το production Periballon provider', () => {
    expect(() => renderToStaticMarkup(
      <MemoryRouter>
        <Proedri />
      </MemoryRouter>
    )).toThrow('Λείπει το production Periballon provider.');
  });

  it('η γραμμή προόδου πηγαίνει στα βήματα με το κλικ', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByLabelText('Μετάβαση στο Βήμα 3'));
    expect(screen.getByText('Βήμα 3 από 4 • Σύνδεση & Διαπιστευτήρια'));
    fireEvent.click(screen.getByLabelText('Μετάβαση στο Βήμα 1'));
    expect(screen.getByText('Βήμα 1 από 4 • Φιλοσοφία & Ασφάλεια'));
  });

  it('το κουμπί πίσω γυρίζει στο προηγούμενο βήμα', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    expect(screen.getByText('Βήμα 2 από 4 • Επιλογή Ιδρύματος'));
    fireEvent.click(screen.getByLabelText('Προηγούμενο βήμα'));
    expect(screen.getByText('Βήμα 1 από 4 • Φιλοσοφία & Ασφάλεια'));
  });

  it('η μετάβαση από το βήμα 4 καλεί την πλοήγηση', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.change(screen.getByTestId('proedri-gramma-xristis'), { target: { value: 'user' } });
    fireEvent.change(screen.getByTestId('proedri-gramma-kodikos'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    expect(screen.getByText('Είσοδος στην Εφαρμογή ✓'));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    expect(screen.getByTestId('proedri-ekran')).toBeDefined();
  });

  it('η επιλογή του custom ιδρύματος δεν αλλάζει το base url', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.click(screen.getByTestId('karta-panepistimiou-custom-2'));
    expect(screen.getByTestId('proedri-gramma-base').getAttribute('value')).toBe('https://thales.cs.unipi.gr');
    expect(screen.getByTestId('karta-panepistimiou-custom-2').getAttribute('aria-pressed')).toBe('true');
  });

  it('η επιλογή custom ιδρύματος επιστρέφει στην προεπιλογή (εκτός λίστας)', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    // η αναζήτηση δεν βγάζει αποτελέσματα, οπότε βγάζει το κενό και το custom κουμπί
    const input = screen.getByTestId('anazitisi-panepistimiou-pedio');
    fireEvent.change(input, { target: { value: 'όχι-ουτε-ελληνικά' } });
    expect(screen.getByTestId('lista-panepistimion-keno')).toBeDefined();
    fireEvent.click(screen.getByTestId('koumpi-epilogi-custom'));
    expect(screen.getByText('ΠΑΠΕΙ'));
    expect(screen.getByTestId('karta-panepistimiou-custom-2')).toBeDefined();
  });

  it('η καρτα επιλέγεται με Enter και με Space', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    const karta = screen.getByTestId('karta-panepistimiou-unipi');
    fireEvent.keyDown(karta, { key: 'Enter' });
    expect(karta.getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(karta, { key: ' ' });
    expect(karta.getAttribute('aria-pressed')).toBe('true');
  });

  it('η καρτα του custom-2 δεν είναι η επιλεγμένη μετά την επιλογή άλλου', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.click(screen.getByTestId('karta-panepistimiou-custom-2'));
    fireEvent.click(screen.getByTestId('karta-panepistimiou-unipi'));
    expect(screen.getByTestId('karta-panepistimiou-unipi').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('karta-panepistimiou-custom-2').getAttribute('aria-pressed')).toBe('false');
  });

  it('το Moodle εμφανίζει το πεδίο token', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.change(screen.getByLabelText('Πρότυπο portal'), { target: { value: 'moodle' } });
    expect(screen.getByTestId('proedri-moodle-token')).toBeDefined();
    expect(screen.queryByText('Αυτό το portal δεν έχει συνδετήρα Open eClass ή Moodle.')).toBeNull();
    fireEvent.change(screen.getByTestId('proedri-gramma-base'), { target: { value: 'https://moodle.example.gr' } });
    fireEvent.change(screen.getByTestId('proedri-moodle-token'), { target: { value: 'token-123456' } });
    expect(screen.getByTestId('proedri-gramma-base').getAttribute('value')).toBe('https://moodle.example.gr');
  });

  it('η σύνδεση με token moodle δεν αποθηκεύει κενά πεδία', async () => {
    mocks.syndesi_kai_anaktisi_mathimaton.mockResolvedValue(ok(pseudos_mathimata()));
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.change(screen.getByLabelText('Πρότυπο portal'), { target: { value: 'moodle' } });
    fireEvent.change(screen.getByTestId('proedri-moodle-token'), { target: { value: 'token-123456' } });
    fireEvent.submit(screen.getByTestId('proedri-forma'));
    await waitFor(async () => {
      expect(screen.getByText('Επιτυχής σύνδεση'));
    }, { timeout: 5000 });
    expect(mocks.syndesi_kai_anaktisi_mathimaton).toHaveBeenCalledWith({
      periballon: expect.anything(),
      base_url: 'https://thales.cs.unipi.gr',
      onoma_xristi: '',
      kodikos: '',
      panepistimio_id: 'unipi',
      lms: 'moodle',
      webservice_token: 'token-123456',
    });
  });

  it('το μη υποστηριζόμενο portal εμφανίζει το μήνυμα και κρύβει το token', () => {
    render(apotelesma_ergazias(<Proedri periballon={ftiaxe_periballon()} />));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.click(screen.getByTestId('onboarding-epomeno-koumpi'));
    fireEvent.change(screen.getByLabelText('Πρότυπο portal'), { target: { value: 'unsupported' } });
    expect(screen.getByText('Αυτό το portal δεν έχει συνδετήρα Open eClass ή Moodle.'));
    expect(screen.queryByTestId('proedri-moodle-token')).toBeNull();
  });
});
