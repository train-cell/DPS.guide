/**
 * Tests της οθόνης ρυθμίσεων ειδοποιήσεων (κάρτα P3) — RED.
 *
 * ZERO NETWORK: η οθόνη μιλάει μόνο με τη δομική πύλα `EidopoiisiYpiresies`, που στα
 * τεστ είναι ψεύτικο αντικείμενο. Καμία εισαγωγή του `@capacitor/local-notifications`.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import RythisiesEidopoiseon, {
  LEPTES_PROEIDOPOISIS,
  pare_proedries,
} from './rythisies-eidopoiseon.js';
import type { EidopoiisiYpiresies } from './eidopoiiseis-typoi.js';
import { proedapes_eidopoiseis } from './eidopoiiseis-typoi.js';
import { MINIMA_ADEIO, MINIMA_SFALMA } from './eidopoiiseis-ypiresies.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS = readFileSync(join(ORISTO, 'rythisies-eidopoiseon.tsx'), 'utf8');

const APOTELEMATA = [
  'eidopoiseis-ekran',
  'eidopoiseis-fortosi',
  'eidopoiseis-stathmos',
  'eidopoiseis-lekseis',
  'eidopoiseis-dokimi',
  'eidopoiseis-akiro-oles',
  'eidopoiseis-metrikos',
  'eidopoiseis-lista',
  'eidopoiseis-adeio',
  'eidopoiseis-sfalma',
] as const;

/** Ψεύτικη πύλα: καταγράφει κλήσεις και επιστρέφει προγραμματισμένες από τον κώδικα. */
function psefthikes_ypiresies(sunexo?: {
  adia?: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';
  sfalma?: boolean;
  programmatismenoi?: string[];
}) {
  const kliseis: string[] = [];
  const stathmos = {
    adia: (sunexo?.adia ?? 'granted') as
      | 'granted'
      | 'denied'
      | 'prompt'
      | 'prompt-with-rationale',
    sfalma: sunexo?.sfalma ?? false,
    programmatismenoi: [...(sunexo?.programmatismenoi ?? [])],
  };
  const ypiresies: EidopoiisiYpiresies = {
    zitise_adia: async () => {
      kliseis.push('zitise_adia');
      if (stathmos.sfalma) return { ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'x' } };
      return { ok: true, timi: stathmos.adia };
    },
    zitisi_adias: async () => {
      kliseis.push('zitisi_adias');
      return { ok: true, timi: stathmos.adia };
    },
    programmatise_dokimi: async (otp, lepta) => {
      kliseis.push(`dokimi:${otp.toISOString()}:${lepta}`);
      if (stathmos.sfalma) return { ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'x' } };
      return { ok: true, timi: { kleidiEnotitas: 'dokimi', titlos: 't', soma: 's', otan: otp, id: 1 } };
    },
    akiro_ol: async () => {
      kliseis.push('akiro_ol');
      if (stathmos.sfalma) return { ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'x' } };
      stathmos.programmatismenoi = [];
      return { ok: true, timi: undefined };
    },
    lista: async () => {
      kliseis.push('lista');
      if (stathmos.sfalma) return { ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'x' } };
      return {
        ok: true,
        timi: stathmos.programmatismenoi.map((k) => ({
          kleidiEnotitas: k,
          titlos: 'Υπενθύμιση',
          soma: 'Διάβασε τη θεωρία',
          otan: new Date('2026-11-20T18:00:00.000Z'),
          id: 1,
        })),
      };
    },
  };
  return { ypiresies, kliseis, stathmos };
}

function apostrophes(ypiresies: EidopoiisiYpiresies, onoma = 'Οθόνη'): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <RythisiesEidopoiseon ypiresies={ypiresies} onoma={onoma} />
    </MemoryRouter>
  );
}

describe('RythisiesEidopoiseon — τρεις καταστάσεις UI (οδηγός D)', () => {
  it('εξάγει ένα React component', () => {
    expect(typeof RythisiesEidopoiseon).toBe('function');
  });

  it('χωρίς Provider ούτε πύλα η οθόνη δείχνει κατάσταση φόρτωσης, όχι λευκή οθόνη', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <RythisiesEidopoiseon />
      </MemoryRouter>
    );
    expect(html).toContain('data-testid="eidopoiseis-fortosi"');
    expect(html).not.toBe('');
  });

  it('σφάλμα πύλας → κατάσταση σφάλματος με κωδικό, όχι κενή οθόνη', () => {
    const { ypiresies } = psefthikes_ypiresies({ sfalma: true });
    const html = apostrophes(ypiresies);
    expect(html).toContain('data-testid="eidopoiseis-sfalma"');
    expect(html).toContain(MINIMA_SFALMA);
    expect(html).toContain('MI_YPOSTIRIZOMENO');
  });

  it('κατάσταση σφάλματος έχει κουμπί επανάληψης', () => {
    const { ypiresies } = psefthikes_ypiresies({ sfalma: true });
    const html = apostrophes(ypiresies);
    expect(html).toContain('data-testid="epanalipsi"');
  });

  it('επιτυχής φόρτωση χωρίς προγραμματισμένες → κατάσταση κενού με το σωστό μήνυμα', () => {
    const { ypiresies } = psefthikes_ypiresies({ programmatismenoi: [] });
    const html = apostrophes(ypiresies);
    expect(html).toContain('data-testid="eidopoiseis-lista"');
    expect(html).toContain('data-testid="eidopoiseis-adeio"');
    expect(html).toContain(MINIMA_ADEIO);
  });

  it('επιτυχής φόρτωση με προγραμματισμένες → λίστα, χωρίς κατάσταση κενού', () => {
    const { ypiresies } = psefthikes_ypiresies({ programmatismenoi: ['en-1', 'en-2'] });
    const html = apostrophes(ypiresies);
    expect(html).toContain('data-testid="eidopoiseis-lista"');
    expect(html).toContain('en-1');
    expect(html).toContain('en-2');
    expect(html).not.toContain('data-testid="eidopoiseis-adeio"');
  });
});

describe('RythisiesEidopoiseon — έλεγχος ενεργοποίησης (IonToggle, role=switch)', () => {
  it('η ενεργοποίηση είναι role=switch με προσβάσιμο όνομα', () => {
    const { ypiresies } = psefthikes_ypiresies();
    const html = apostrophes(ypiresies);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-label="Ενεργοποίηση τοπικών ειδοποιήσεων"');
    expect(html).toContain('data-testid="eidopoiseis-enaktopoieseis"');
  });

  it('ο διακόπτης είναι ενεργοποιημένος όταν η άδεια είναι granted', () => {
    const { ypiresies } = psefthikes_ypiresies({ adia: 'granted' });
    const html = apostrophes(ypiresies);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('Ενεργές');
  });

  it('ο διακόπτης είναι κλειστός όταν η άδεια είναι denied', () => {
    const { ypiresies } = psefthikes_ypiresies({ adia: 'denied' });
    const html = apostrophes(ypiresies);
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('Ανενεργές');
  });

  it('άδεια prompt εμφανίζεται ως μη δοθείσα, όχι ως granted', () => {
    const { ypiresies } = psefthikes_ypiresies({ adia: 'prompt' });
    const html = apostrophes(ypiresies);
    expect(html).toContain('δεν έχει δοθεί');
    expect(html).toContain('aria-checked="false"');
  });

  it('δεν χρησιμοποιείται γυμνό checkbox', () => {
    expect(ARXIKOS).not.toContain('type="checkbox"');
  });
});

describe('RythisiesEidopoiseon — επιλογή λεπτών προειδοποίησης', () => {
  it('η επιλογή έχει προσβάσιμο όνομα και data-testid', () => {
    const { ypiresies } = psefthikes_ypiresies();
    const html = apostrophes(ypiresies);
    expect(html).toContain('data-testid="eidopoiseis-lekseis"');
    expect(html).toContain('aria-label="Λεπτά πριν από την ενότητα"');
  });

  it('προσφέρει τις επιλογές της λεπτής και όχι τυχαίες αριθμούς', () => {
    const { ypiresies } = psefthikes_ypiresies();
    const html = apostrophes(ypiresies);
    for (const lepta of LEPTES_PROEIDOPOISIS) {
      expect(html).toContain(`value="${lepta}"`);
    }
    expect((html.match(/<option/g) ?? []).length).toBe(LEPTES_PROEIDOPOISIS.length);
  });

  it('οι επιλογές είναι αύξουσες και χωρίς αρνητικές τιμές', () => {
    const a = [...LEPTES_PROEIDOPOISIS].sort((x, y) => x - y);
    expect([...LEPTES_PROEIDOPOISIS]).toEqual(a);
    for (const lepta of LEPTES_PROEIDOPOISIS) {
      expect(Number.isInteger(lepta)).toBe(true);
      expect(lepta).toBeGreaterThan(0);
    }
  });
});

describe('RythisiesEidopoiseon — χειριστήριο δοκιμής', () => {
  it('η δοκιμή είναι διαθέσιμη μόνο όταν η άδεια είναι granted', () => {
    const xorigoritisi = psefthikes_ypiresies({ adia: 'granted' });
    expect(apostrophes(xorigoritisi.ypiresies)).not.toContain('disabled');

    const aposkeuousi = psefthikes_ypiresies({ adia: 'denied' });
    const html = apostrophes(aposkeuousi.ypiresies);
    expect(html).toContain('data-testid="eidopoiseis-dokimi"');
    expect(html).toContain('disabled');
  });

  it('ο κουμπί δοκιμής έχει προσβάσιμο όνομα', () => {
    const { ypiresies } = psefthikes_ypiresies({ adia: 'granted' });
    const html = apostrophes(ypiresies);
    expect(html).toContain('aria-label="Δοκιμή ειδοποίησης τώρα"');
  });
});

describe('RythisiesEidopoiseon — μετρικός και ακύρωση όλων', () => {
  it('δείχνει το πλήθος των προγραμματισμένων ειδοποιήσεων', () => {
    const { ypiresies } = psefthikes_ypiresies({ programmatismenoi: ['en-1', 'en-2', 'en-3'] });
    const html = apostrophes(ypiresies);
    expect(html).toContain('data-testid="eidopoiseis-metrikos"');
    expect(html).toContain('3');
  });

  it('η ακύρωση όλων έχει προσβάσιμο όνομα και data-testid', () => {
    const { ypiresies } = psefthikes_ypiresies({ programmatismenoi: ['en-1'] });
    const html = apostrophes(ypiresies);
    expect(html).toContain('data-testid="eidopoiseis-akiro-oles"');
    expect(html).toContain('aria-label="Ακύρωση όλων των υπενθυμίσεων"');
  });

  it('η ακύρωση όλων απενεργοποιείται όταν δεν υπάρχει τίποτα να ακυρώσει', () => {
    const { ypiresies } = psefthikes_ypiresies({ programmatismenoi: [] });
    expect(apostrophes(ypiresies)).not.toContain('eidopoiseis-akiro-oles" \n');
  });
});

describe('rythisiesEidopoiseon — πηγές των τιμών', () => {
  it('η οθόνη ΔΕΝ έχει σταθερές τιμές: όλα έρχονται από την πύλα', () => {
    expect(ARXIKOS).toContain('ypiresies');
    expect(ARXIKOS).toContain('zitise_adia');
    expect(ARXIKOS).toContain('programmatise_dokimi');
  });

  it('η οθόνη ΔΕΝ εισάγει το @capacitor/local-notifications', () => {
    expect(ARXIKOS).not.toContain('@capacitor/local-notifications');
    expect(ARXIKOS).not.toContain('LocalNotifications');
  });

  it('η οθόνη ΔΕΝ έχει σκληρά κωδικούς μαθήματος ή κωδικούς πρόσβασης', () => {
    expect(ARXIKOS).not.toMatch(/ΠΛΗ\d+/);
    expect(ARXIKOS).not.toContain('llm_api_key');
    expect(ARXIKOS).not.toContain('eclass_kodikos');
  });

  it('η οθόνη ΔΕΝ καταγράφει στην κονσόλα', () => {
    expect(ARXIKOS).not.toMatch(/console\./);
  });
});

describe('rythisiesEidopoiseon — περιορισμοί κώδικα (D11 / dark-only DS)', () => {
  it('δεν έχει inline styles και κανένα αυθαίρετο χρώμα', () => {
    expect(ARXIKOS).not.toContain('style={{');
    expect(ARXIKOS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(ARXIKOS).not.toMatch(/rgb\(/);
  });

  it('χρησιμοποιεί μόνο υπάρχουσες τάξεις CSS της οθόνης', () => {
    expect(ARXIKOS).toContain('className="odoni-lista"');
    expect(ARXIKOS).not.toContain('.css');
    for (const klasa of ['pilegma', 'odoni-xeiris-zeugos']) {
      expect(ARXIKOS).toContain(klasa);
    }
  });

  it('δεν εισάγει any, ts-ignore, ts-expect-error ή μη-null assertion', () => {
    expect(ARXIKOS).not.toMatch(/:\s*any\b/);
    expect(ARXIKOS).not.toContain('@ts-ignore');
    expect(ARXIKOS).not.toContain('@ts-expect-error');
    expect(ARXIKOS).not.toMatch(/!\s*[.;,)]/);
  });

  it('οι σχετικές εισαγωγές έχουν επέκταση .js', () => {
    expect(ARXIKOS).not.toMatch(/from '\.\.?\/[^']*[^s]'/);
  });
});

describe('eidopoiiseis-ypiresies — καθαρή επικύρωση', () => {
  it('η προεπιλογή λεπτών προειδοποίησης είναι μία από τις επιτρεπόμενες', () => {
    const proedapes = proedapes_eidopoiseis();
    expect(LEPTES_PROEIDOPOISIS).toContain(proedapes.leptaProeidopoisis);
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
  });

  it('η προεπιλογή ενεργοποίησης ακολουθεί την άδεια, όχι μαγική σταθερά', () => {
    expect(proedapes_eidopoiseis().einaiEnergies).toBe(false);
  });
});