/**
 * Tests της οθόνης ρυθμίσεων ειδοποιήσεων (κάρτα P3).
 *
 * ZERO NETWORK: τα τεστ δεν εισάγουν καν το `@capacitor/local-notifications`. Οι
 * καταστάσεις ελέγχονται από props του παρουσιαστικού `OraEidopoiseon` (ίδια αρχή με
 * το `OdomosEnotiton` της οθόνης χάρτη), ενώ το δοχείο ελέγχεται ως συμβόλαιο.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import RythisiesEidopoiseon from './rythisies-eidopoiseon.js';
import { OraEidopoiseon } from './ora-eidopoiseon.js';
import type { OraEidopoiseonProps } from './ora-eidopoiseon.js';
import { LEPTES_PROEIDOPOISIS, proedapes_eidopoiseis } from './eidopoiiseis-typoi.js';
import type {
  EidopoiisiProgrammatismeni,
  EidopoiisiYpiresies,
  KatastasiAdieas,
} from './eidopoiiseis-typoi.js';
import { adeio, etimo, fortosi, sfalma } from '../kathstasi/index.js';
import { einai_chorigimeni, etiketa_lepton, keimeno_adias, pare_proedries, MINIMA_ADEIO, MINIMA_SFALMA } from './eidopoiiseis-ypiresies.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS_ORAS = readFileSync(join(ORISTO, 'ora-eidopoiseon.tsx'), 'utf8');
const ARXIKOS_DOXEIO = readFileSync(join(ORISTO, 'rythisies-eidopoiseon.tsx'), 'utf8');

/** Μία προγραμματισμένη ειδοποίηση για τις δοκιμές. */
function proedri(kleidiEnotitas: string, id: number): EidopoiisiProgrammatismeni {
  return {
    kleidiEnotitas,
    titlos: `Υπενθύμιση: ${kleidiEnotitas}`,
    soma: 'Διάβασε τη θεωρία της ενότητας',
    otan: new Date('2026-11-20T18:00:00.000Z'),
    id,
  };
}

/** Προεπιλογές props του παρουσιαστικού, με όλα τα callbacks ανενεργά. */
function arkeis_props(
  allax: Partial<OraEidopoiseonProps> = {}
): OraEidopoiseonProps {
  return {
    katastasi: etimo([proedri('en-1', 1)]),
    adia: 'granted',
    rytheseis: { einaiEnergies: true, leptaProeidopoisis: 30 },
    allaze_lepta: () => undefined,
    zitise_adeia: () => undefined,
    dokimi: () => undefined,
    akiro_oles: () => undefined,
    epanalipsi: () => undefined,
    apotel: null,
    onoma: '',
    ...allax,
  };
}

function apostrophes(props: OraEidopoiseonProps): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <OraEidopoiseon {...props} />
    </MemoryRouter>
  );
}

describe('OraEidopoiseon — τρεις καταστάσεις UI (οδηγός D)', () => {
  it('εξάγει ένα React component', () => {
    expect(typeof OraEidopoiseon).toBe('function');
  });

  it('φόρτωση: δείχνει spinner και ποτέ κενή οθόνη', () => {
    const html = apostrophes(arkeis_props({ katastasi: fortosi() }));
    expect(html).toContain('data-testid="katastasi-fortosi"');
    expect(html).toContain('data-testid="eidopoiseis-ekran"');
  });

  it('κενό: δείχνει το μήνυμα κενής λίστας, όχι λευκή οθόνη', () => {
    const html = apostrophes(arkeis_props({ katastasi: adeio() }));
    expect(html).toContain('data-testid="katastasi-adeio"');
    expect(html).toContain(MINIMA_ADEIO);
  });

  it('σφάλμα: δείχνει κωδικό και μήνυμα, με κουμπί επανάληψης', () => {
    const html = apostrophes(
      arkeis_props({ katastasi: sfalma({ kodikos: 'MI_YPOSTIRIZOMENO', minima: 'boom' }) })
    );
    expect(html).toContain('data-testid="katastasi-sfalma"');
    expect(html).toContain('MI_YPOSTIRIZOMENO');
    expect(html).toContain('data-testid="epanalipsi"');
  });

  it('έτοιμα δεδομένα: δείχνει τη λίστα χωρίς κατάσταση κενού', () => {
    const html = apostrophes(arkeis_props({ katastasi: etimo([proedri('en-1', 1), proedri('en-2', 2)]) }));
    expect(html).toContain('data-testid="eidopoiseis-lista"');
    expect(html).toContain('Υπενθύμιση: en-1');
    expect(html).toContain('Υπενθύμιση: en-2');
    expect(html).not.toContain('data-testid="katastasi-adeio"');
  });
});

describe('OraEidopoiseon — ενεργοποίηση (role=switch)', () => {
  it('η ενεργοποίηση είναι role=switch με προσβάσιμο όνομα', () => {
    const html = apostrophes(arkeis_props());
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-label="Ενεργοποίηση τοπικών ειδοποιήσεων"');
    expect(html).toContain('data-testid="eidopoiseis-enaktopoieseis"');
  });

  it('η ενεργοποίηση ακολουθεί την άδεια: granted → ενεργές, denied → ανενεργές', () => {
    const xorigoritisi = apostrophes(
      arkeis_props({ adia: 'granted', rytheseis: { einaiEnergies: true, leptaProeidopoisis: 30 } })
    );
    expect(xorigoritisi).toContain('aria-checked="true"');
    expect(xorigoritisi).toContain('Ενεργές');

    const aposkeuousi = apostrophes(
      arkeis_props({ adia: 'denied', rytheseis: { einaiEnergies: false, leptaProeidopoisis: 30 } })
    );
    expect(aposkeuousi).toContain('aria-checked="false"');
    expect(aposkeuousi).toContain('Ανενεργές');
  });

  it('άδεια prompt εμφανίζεται ρητά ως μη δοθείσα, όχι ως ενεργή', () => {
    const html = apostrophes(
      arkeis_props({ adia: 'prompt', rytheseis: { einaiEnergies: false, leptaProeidopoisis: 30 } })
    );
    expect(html).toContain('δεν έχει δοθεί');
    expect(html).toContain('aria-checked="false"');
  });

  it('άγνωστη άδεια (null) δεν ισχυρίζεται ότι είναι ενεργή', () => {
    const html = apostrophes(
      arkeis_props({ adia: null, rytheseis: { einaiEnergies: false, leptaProeidopoisis: 30 } })
    );
    expect(html).toContain('άγνωστη');
    expect(html).toContain('aria-checked="false"');
  });

  it('δεν χρησιμοποιείται γυμνό checkbox', () => {
    expect(ARXIKOS_ORAS).not.toContain('type="checkbox"');
    expect(ARXIKOS_DOXEIO).not.toContain('type="checkbox"');
  });
});

describe('OraEidopoiseon — επιλογή λεπτών προειδοποίησης', () => {
  it('η επιλογή έχει προσβάσιμο όνομα, label και data-testid', () => {
    const html = apostrophes(arkeis_props());
    expect(html).toContain('data-testid="eidopoiseis-lekseis"');
    expect(html).toContain('aria-label="Λεπτά πριν από την ενότητα"');
    expect(html).toContain('for="eidopoiseis-lekseis"');
  });

  it('προσφέρει ακριβώς τις επιτρεπόμενες επιλογές', () => {
    const html = apostrophes(arkeis_props());
    for (const lepta of LEPTES_PROEIDOPOISIS) {
      expect(html).toContain(`value="${lepta}"`);
    }
    expect((html.match(/<option/g) ?? []).length).toBe(LEPTES_PROEIDOPOISIS.length);
  });

  it('οι επιλογές είναι αύξουσες και θετικοί ακέραιοι', () => {
    const a = [...LEPTES_PROEIDOPOISIS].sort((x, y) => x - y);
    expect([...LEPTES_PROEIDOPOISIS]).toEqual(a);
    for (const lepta of LEPTES_PROEIDOPOISIS) {
      expect(Number.isInteger(lepta)).toBe(true);
      expect(lepta).toBeGreaterThan(0);
    }
  });

  it('η επιλεγμένη τιμή είναι η τρέχουσα ρύθμιση', () => {
    const html = apostrophes(
      arkeis_props({ rytheseis: { einaiEnergies: true, leptaProeidopoisis: 1440 } })
    );
    expect(html).toContain('<option value="1440" selected="">');
  });
});

describe('OraEidopoiseon — χειριστήριο δοκιμής και μαζική ακύρωση', () => {
  it('η δοκιμή είναι διαθέσιμη μόνο όταν η άδεια είναι granted', () => {
    const xorigoritisi = apostrophes(arkeis_props({ adia: 'granted' }));
    expect(xorigoritisi).toContain('data-testid="eidopoiseis-dokimi"');
    expect(xorigoritisi).not.toContain('disabled');

    const aposkeuousi = apostrophes(arkeis_props({ adia: 'denied' }));
    expect(aposkeuousi).toContain('data-testid="eidopoiseis-dokimi"');
    expect(aposkeuousi).toContain('disabled');
  });

  it('τα δύο χειριστήρια έχουν προσβάσιμα ονόματα', () => {
    const html = apostrophes(arkeis_props());
    expect(html).toContain('aria-label="Δοκιμή ειδοποίησης τώρα"');
    expect(html).toContain('aria-label="Ακύρωση όλων των υπενθυμίσεων"');
    expect(html).toContain('data-testid="eidopoiseis-akiro-oles"');
  });

  it('ο μετρικός δείχνει το πλήθος των προγραμματισμένων', () => {
    const treis = apostrophes(arkeis_props({ katastasi: etimo([proedri('a', 1), proedri('b', 2), proedri('c', 3)]) }));
    expect(treis).toContain('data-testid="eidopoiseis-metrikos"');
    expect(treis).toContain('Σε αναμονή: 3');

    const adies = apostrophes(arkeis_props({ katastasi: etimo([]) }));
    expect(adies).toContain('Σε αναμονή: 0');
  });
});

describe('OraEidopoiseon — περιορισμοί κώδικα (D11 / dark-only DS)', () => {
  it('δεν έχει inline styles και κανένα αυθαίρετο χρώμα', () => {
    for (const pigi of [ARXIKOS_ORAS, ARXIKOS_DOXEIO]) {
      expect(pigi).not.toContain('style={{');
      expect(pigi).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(pigi).not.toMatch(/rgb\(/);
    }
  });

  it('χρησιμοποιεί τις υπάρχουσες τάξεις CSS, χωρίς νέο αρχείο .css', () => {
    expect(ARXIKOS_ORAS).toContain('className="odoni-lista"');
    for (const pigi of [ARXIKOS_ORAS, ARXIKOS_DOXEIO]) {
      expect(pigi).not.toContain(".css'");
    }
    for (const klasa of ['pilegma', 'odoni-xeiris-zeugos']) {
      expect(ARXIKOS_ORAS).toContain(klasa);
    }
  });

  it('χρησιμοποιεί τα κοινά στοιχεία της οθόνης', () => {
    for (const symbolo of ['Karta', 'OloniKatastasis', 'Pilegma', 'ProskelesioOmonimas']) {
      expect(ARXIKOS_ORAS).toContain(symbolo);
    }
  });

  it('δεν εισάγει any, ts-ignore, ts-expect-error ή μη-null assertion', () => {
    for (const pigi of [ARXIKOS_ORAS, ARXIKOS_DOXEIO]) {
      expect(pigi).not.toMatch(/:\s*any\b/);
      expect(pigi).not.toContain('@ts-ignore');
      expect(pigi).not.toContain('@ts-expect-error');
      expect(pigi).not.toMatch(/!\s*[.;,)]/);
    }
  });

  it('οι σχετικές εισαγωγές έχουν επέκταση .js', () => {
    for (const pigi of [ARXIKOS_ORAS, ARXIKOS_DOXEIO]) {
      expect(pigi).not.toMatch(/from '\.\.?\/[^']*[^s]'/);
    }
  });

  it('κανένα data-testid δεν εμφανίζεται δύο φορές στην ίδια οθόνη', () => {
    const html = apostrophes(arkeis_props());
    for (const testid of [
      'eidopoiseis-ekran',
      'eidopoiseis-stathmos',
      'eidopoiseis-lekseis',
      'eidopoiseis-dokimi',
      'eidopoiseis-akiro-oles',
      'eidopoiseis-metrikos',
    ]) {
      expect((html.match(new RegExp(`data-testid="${testid}"`, 'g')) ?? []).length).toBe(1);
    }
  });
});

describe('RythisiesEidopoiseon — δοχείο και πηγές τιμών', () => {
  it('εξάγει ένα React component', () => {
    expect(typeof RythisiesEidopoiseon).toBe('function');
  });

  it('χωρίς πύλα η οθόνη δείχνει φόρτωση, όχι λευκή οθόνη', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <RythisiesEidopoiseon />
      </MemoryRouter>
    );
    expect(html).toContain('data-testid="katastasi-fortosi"');
    expect(html).not.toBe('');
  });

  it('το δοχείο διαβάζει άδεια και λίστα ΜΟΝΟ μέσω της πύλας', () => {
    expect(ARXIKOS_DOXEIO).toContain('ypiresies.zitise_adia()');
    expect(ARXIKOS_DOXEIO).toContain('ypiresies.lista()');
    expect(ARXIKOS_DOXEIO).toContain('ypiresies.zitisi_adias()');
    expect(ARXIKOS_DOXEIO).toContain('ypiresies.programmatise_dokimi');
    expect(ARXIKOS_DOXEIO).toContain('ypiresies.akiro_ol()');
  });

  it('η οθόνη ΔΕΝ εισάγει το plugin των ειδοποιήσεων (D7: το plugin είναι του adapter)', () => {
    for (const pigi of [ARXIKOS_ORAS, ARXIKOS_DOXEIO]) {
      expect(pigi).not.toMatch(/from '@capacitor\/local-notifications'/);
      expect(pigi).not.toContain('LocalNotifications');
    }
  });

  it('η οθόνη ΔΕΝ έχει σκληρά κωδικούς μαθήματος ή κλειδιά μυστικών', () => {
    for (const pigi of [ARXIKOS_ORAS, ARXIKOS_DOXEIO]) {
      expect(pigi).not.toMatch(/ΠΛΗ\d+/);
      expect(pigi).not.toContain('llm_api_key');
      expect(pigi).not.toContain('eclass_kodikos');
      expect(pigi).not.toContain('eclass_onoma_xristi');
    }
  });

  it('η οθόνη ΔΕΝ καταγράφει στην κονσόλα', () => {
    for (const pigi of [ARXIKOS_ORAS, ARXIKOS_DOXEIO]) {
      expect(pigi).not.toMatch(/console\./);
    }
  });

  it('η οθόνη ΔΕΝ κάνει δίκτυο', () => {
    for (const pigi of [ARXIKOS_ORAS, ARXIKOS_DOXEIO]) {
      expect(pigi).not.toMatch(/fetch\(|XMLHttpRequest|axios/);
    }
  });
});

describe('EidopoiisiYpiresies — συμβατότητα της πύλας', () => {
  it('η δοχείο δέχεται οποιαδήποτε υλοποίηση της πύλας', () => {
    const adies: readonly KatastasiAdieas[] = ['granted', 'denied', 'prompt', 'prompt-with-rationale'];
    for (const adia of adies) {
      const pugi: EidopoiisiYpiresies = {
        zitise_adia: async () => ({ ok: true, timi: adia }),
        zitisi_adias: async () => ({ ok: true, timi: adia }),
        programmatise_dokimi: async () => ({ ok: true, timi: proedri('en-1', 1) }),
        akiro_ol: async () => ({ ok: true, timi: undefined }),
        lista: async () => ({ ok: true, timi: [proedri('en-1', 1)] }),
      };
      expect(typeof pugi.zitise_adia).toBe('function');
      expect(typeof pugi.programmatise_dokimi).toBe('function');
      expect(typeof pugi.akiro_ol).toBe('function');
      expect(typeof pugi.lista).toBe('function');
      expect(typeof pugi.zitisi_adias).toBe('function');
    }
  });

  it('η πύλα επιστρέφει πάντα Apotelesma — ποτέ throw, ποτέ ψευδή επιτυχία', async () => {
    const pugi: EidopoiisiYpiresies = {
      zitise_adia: async () => ({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'x' } }),
      zitisi_adias: async () => ({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'x' } }),
      programmatise_dokimi: async () => ({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'x' } }),
      akiro_ol: async () => ({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'x' } }),
      lista: async () => ({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'x' } }),
    };
    for (const amitosa of [
      pugi.zitise_adia(),
      pugi.zitisi_adias(),
      pugi.programmatise_dokimi(new Date(), 30),
      pugi.akiro_ol(),
      pugi.lista(),
    ]) {
      const a = await amitosa;
      expect(a.ok).toBe(false);
      if (!a.ok) expect(a.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
    }
  });
});

describe('eidopoiiseis-ypiresies — καθαρή επικύρωση', () => {
  it('η προεπιλογή λεπτών προειδοποίησης είναι μία από τις επιτρεπόμενες', () => {
    expect(LEPTES_PROEIDOPOISIS).toContain(proedapes_eidopoiseis().leptaProeidopoisis);
  });

  it('η προεπιλογή ενεργοποίησης είναι κλειστή μέχρι να δοθεί άδεια', () => {
    expect(proedapes_eidopoiseis().einaiEnergies).toBe(false);
  });

  it('ο καθαρισμός λεπτών δέχεται μόνο επιτρεπόμενες τιμές', () => {
    for (const lepta of LEPTES_PROEIDOPOISIS) {
      expect(pare_proedries(lepta)).toBe(lepta);
    }
  });

  it('ο καθαρισμός επιστρέφει την προεπιλογή για άγνωστη ή μη ακέραια τιμή', () => {
    const proedapes = proedapes_eidopoiseis().leptaProeidopoisis;
    expect(pare_proedries(999)).toBe(proedapes);
    expect(pare_proedries(-5)).toBe(proedapes);
    expect(pare_proedries(Number.NaN)).toBe(proedapes);
    expect(pare_proedries(30.5)).toBe(proedapes);
  });

  it('οι ετικέτες λεπτών είναι ελληνικές και χωρίς μαγικούς αριθμούς', () => {
    expect(etiketa_lepton(15)).toBe('15 λεπτά πριν');
    expect(etiketa_lepton(60)).toBe('1 ώρα πριν');
    expect(etiketa_lepton(1440)).toBe('1 ημέρα πριν');
  });

  it('η κατάσταση άδειας περιγράφεται ρητά, χωρίς ψευδή σιγουριά', () => {
    // granted / denied έχουν διαφορετικά κείμενα· οι δύο «μη δοθείσα» καταστάσεις
    // μοιράζονται ρητό κείμενο «δεν έχει δοθεί» — ποτέ δεν παρουσιάζονται ως ενεργές.
    expect(keimeno_adias('granted')).not.toBe(keimeno_adias('denied'));
    expect(keimeno_adias('prompt')).not.toBe(keimeno_adias('denied'));
    expect(keimeno_adias('prompt-with-rationale')).not.toBe(keimeno_adias('denied'));
    for (const adia of ['prompt', 'prompt-with-rationale'] as const) {
      expect(keimeno_adias(adia)).toContain('δεν έχει δοθεί');
      expect(keimeno_adias(adia)).not.toContain('δοθείσα');
    }
    expect(keimeno_adias('denied')).toContain('απορριφθείσα');
    expect(keimeno_adias('granted')).toContain('δοθείσα');
    expect(einai_chorigimeni('granted')).toBe(true);
    expect(einai_chorigimeni('denied')).toBe(false);
    expect(einai_chorigimeni('prompt')).toBe(false);
    expect(einai_chorigimeni('prompt-with-rationale')).toBe(false);
  });

  it('τα μηνύματα κενού και σφάλματος δεν εκθέτουν ευαίσθητα στοιχεία', () => {
    expect(MINIMA_ADEIO).not.toMatch(/κωδικός|password|token/i);
    expect(MINIMA_SFALMA).not.toMatch(/κωδικός|password|token/i);
    expect(MINIMA_SFALMA).not.toMatch(/http|:\/\//);
  });
});