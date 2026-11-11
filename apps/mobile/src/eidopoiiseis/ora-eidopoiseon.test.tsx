// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Katastasi } from '../kathstasi/index.js';
import type { EidopoiisiProgrammatismeni, RytheseisEidopoiseon } from './eidopoiiseis-typoi.js';
import { OraEidopoiseon } from './ora-eidopoiseon.js';

afterEach(cleanup);

const PROEDREIS: EidopoiisiProgrammatismeni[] = [
  {
    id: 1,
    kleidiEnotitas: 'en-1',
    titlos: 'Προγραμματισμένη',
    soma: 'Σώμα μηνύματος',
    otan: new Date('2026-11-01T10:00:00.000Z'),
  },
  {
    id: 2,
    kleidiEnotitas: 'en-2',
    titlos: 'Δεύτερη',
    soma: 'Σώμα δεύτερου μηνύματος',
    otan: new Date('2026-11-02T11:00:00.000Z'),
  },
];

const RYTHEISEIS: RytheseisEidopoiseon = {
  einaiEnergies: true,
  leptaProeidopoisis: 15,
};

function katastasi_dedomenon(): Katastasi<EidopoiisiProgrammatismeni[]> {
  return { katastasi: 'etimo', dedomena: PROEDREIS };
}

interface Handlers {
  readonly allaze_lepta: (lepta: number) => void;
  readonly zitise_adeia: () => void;
  readonly dokimi: () => void;
  readonly akiro_oles: () => void;
  readonly epanalipsi: () => void;
}

function buildHandlers(): Handlers {
  const logs: string[] = [];
  const handlers = {
    allaze_lepta: (lepta: number) => logs.push(`allaze_lepta(${lepta})`),
    zitise_adeia: () => logs.push('zitise_adeia'),
    dokimi: () => logs.push('dokimi'),
    akiro_oles: () => logs.push('akiro_oles'),
    epanalipsi: () => logs.push('epanalipsi'),
  };
  return { ...handlers, logs };
}

function renderOraEidopoiseon(handlers: Handlers, props: Partial<React.ComponentProps<typeof OraEidopoiseon>> = {}) {
  return renderToStaticMarkup(
    <OraEidopoiseon
      katastasi={katastasi_dedomenon()}
      adia={'granted'}
      rytheseis={RYTHEISEIS}
      onoma="Μαθήματα"
      {...handlers}
      {...props}
    />
  );
}

describe('OraEidopoiseon — κάρτα ειδοποιήσεων', () => {
  it('αποδίδει τον διακόπτη, το κείμενο άδειας και activation για πλήρες onoma', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers);
    expect(markup).toContain('data-testid="eidopoiseis-enaktopoieseis"');
    expect(markup).toContain('role="switch"');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain('Ενεργοποίηση για «Μαθήματα»');
    expect(markup).toContain('Άδεια: δοθείσα');
    expect(markup).toContain('Ενεργές');
  });

  it('αποδίδει κείμενο activation για κενό onoma', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers, { onoma: '' });
    expect(markup).toContain('Ενεργοποίηση των τοπικών ειδοποιήσεων.');
  });

  it('αποδίδει όλα τα option της επιλογής λεπτών', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers);
    expect(markup).toContain('data-testid="eidopoiseis-lekseis"');
    expect(markup).toContain('value="15"');
    expect(markup).toContain('value="30"');
    expect(markup).toContain('value="60"');
    expect(markup).toContain('value="120"');
    expect(markup).toContain('value="1440"');
    expect(markup).toContain('15 λεπτά πριν');
    expect(markup).toContain('1 ώρα πριν');
    expect(markup).toContain('1 ημέρα πριν');
  });

  it('αποδίδει τον αριθμό των προγραμματισμένων ειδοποιήσεων', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers);
    expect(markup).toContain('data-testid="eidopoiseis-metrikos"');
    expect(markup).toContain('Σε αναμονή: 2');
  });

  it('αποδίδει κενή κατάσταση όταν δεν υπάρχει λίστα', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers, {
      katastasi: { katastasi: 'adeio' } as unknown as Katastasi<EidopoiisiProgrammatismeni[]>,
    });
    expect(markup).toContain('data-testid="eidopoiseis-ekran"');
    expect(markup).toContain('Δεν υπάρχει προγραμματισμένη υπενθύμιση αυτή τη στιγμή.');
  });

  it('αποδίδει σφάλμα με την ετικέτα επανάληψης', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers, {
      katastasi: {
        katastasi: 'sfalma',
        sfalma: { kodikos: 'DIKTYO', minima: 'Δεν υπάρχει σύνδεση' },
      } as unknown as Katastasi<EidopoiisiProgrammatismeni[]>,
    });
    expect(markup).toContain('Δεν υπάρχει σύνδεση');
    expect(markup).toContain('Δοκίμασε ξανά');
  });

  it('αποδίδει ένα επιπλέον μήνυμα ενέργειας όταν υπάρχει', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers, { apotel: 'Επιτυχής αποστολή' });
    expect(markup).toContain('Επιτυχής αποστολή');
  });

  it('αποδίδει μήνυμα ενέργειας όταν υπάρχει, και δεν το εμφανίζει όταν είναι null', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers, { apotel: 'Επιτυχής αποστολή' });
    expect(markup).toContain('Επιτυχής αποστολή');
    const markup2 = renderOraEidopoiseon(handlers, { apotel: null });
    expect(markup2).not.toContain('Επιτυχής αποστολή');
  });

  it('αποδίδει τη λίστα με τα προγραμματισμένα μηνύματα', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers);
    expect(markup).toContain('data-testid="eidopoiseis-lista"');
    expect(markup).toContain('Προγραμματισμένη');
    expect(markup).toContain('Δεύτερη');
    expect(markup).toContain('Υπενθύμιση en-1');
    expect(markup).toContain('Υπενθύμιση en-2');
  });

  it('αποδίδει τα κουμπιά δοκιμής και ακύρωσης', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers);
    expect(markup).toContain('data-testid="eidopoiseis-dokimi"');
    expect(markup).toContain('data-testid="eidopoiseis-akiro-oles"');
    expect(markup).toContain('Δοκιμή ειδοποίησης');
    expect(markup).toContain('Ακύρωση όλων');
  });

  it('καλεί το allaze_lepta όταν αλλάξει η επιλογή λεπτών', () => {
    const handlers = buildHandlers();
    render(
      <OraEidopoiseon
        katastasi={katastasi_dedomenon()}
        adia={'granted'}
        rytheseis={RYTHEISEIS}
        onoma="Μαθήματα"
        {...handlers}
      />
    );

    const select = screen.getByTestId('eidopoiseis-lekseis');
    fireEvent.change(select, { target: { value: '30' } });

    expect(handlers.logs).toContain('allaze_lepta(30)');
  });

  it('καλύπτει τις κλάσεις όταν το switch είναι ανενεργό', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers, {
      rytheseis: { ...RYTHEISEIS, einaiEnergies: false },
    });
    expect(markup).toContain('data-testid="eidopoiseis-enaktopoieseis"');
    expect(markup).toContain('Ανενεργές');
    expect(markup).toContain('aria-checked="false"');
  });

  it('αποδίδει "Άδεια: άγνωστη" όταν λείπει η άδεια', () => {
    const handlers = buildHandlers();
    const markup = renderOraEidopoiseon(handlers, {
      adia: null,
      rytheseis: { ...RYTHEISEIS, einaiEnergies: false },
    });
    expect(markup).toContain('Άδεια: άγνωστη');
    expect(markup).toContain('disabled');
    expect(markup).toContain('Ανενεργές');
    expect(markup).toContain('aria-checked="false"');
  });
});
