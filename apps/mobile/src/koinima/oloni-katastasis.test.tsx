import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Katastasi } from '../kathstasi/index.js';
import { etimo } from '../kathstasi/katastasi.js';
import { OloniKatastasis } from './oloni-katastasis.js';

/** Προτιμώμενη κατάσταση έτοιμων δεδομένων για τα tests. */
function dedomena(): Katastasi<string[]> {
  return etimo(['ένα', 'δύο']);
}

describe('OloniKatastasis — τρεις καταστάσεις', () => {
  it('αποδίδει φόρτωση με το spinner', () => {
    const markup = renderToStaticMarkup(
      <OloniKatastasis katastasi={{ katastasi: 'fortosi' }} children={(() => null)} />
    );
    expect(markup).toContain('data-testid="katastasi-fortosi"');
  });

  it('αποδίδει κενό αποτέλεσμα με προεπιλεγμένο μήνυμα', () => {
    const markup = renderToStaticMarkup(
      <OloniKatastasis katastasi={{ katastasi: 'adeio' }} children={(() => null)} />
    );
    expect(markup).toContain('data-testid="katastasi-adeio"');
    expect(markup).toContain('Τίποτα ακόμη');
    expect(markup).toContain('Δεν υπάρχει τίποτα να δείξουμε ακόμη.');
  });

  it('αποδίδει κενό αποτέλεσμα με προσαρμοσμένο μήνυμα', () => {
    const markup = renderToStaticMarkup(
      <OloniKatastasis katastasi={{ katastasi: 'adeio' }} adeioMinima="Κενό" children={(() => null)} />
    );
    expect(markup).toContain('Κενό');
  });

  it('δεν αποδίδει την πρόσθετη ενέργεια όταν λείπει', () => {
    const markup = renderToStaticMarkup(
      <OloniKatastasis katastasi={{ katastasi: 'adeio' }} children={(() => null)} />
    );
    expect(markup).not.toContain('katastasi-aksi');
  });

  it('αποδίδει την πρόσθετη ενέργεια όταν δίνεται', () => {
    const markup = renderToStaticMarkup(
      <OloniKatastasis
        katastasi={{ katastasi: 'adeio' }}
        adeioAksi={<button type="button">Φόρτωση</button>}
        children={(() => null)}
      />
    );
    expect(markup).toContain('katastasi-aksi');
    expect(markup).toContain('Φόρτωση');
  });

  it('αποδίδει σφάλμα με κωδικό και μήνυμα', () => {
    const markup = renderToStaticMarkup(
      <OloniKatastasis
        katastasi={{
          katastasi: 'sfalma',
          sfalma: { kodikos: 'DIKTYO', minima: 'Δεν υπάρχει σύνδεση' },
        }}
        children={(() => null)}
      />
    );
    expect(markup).toContain('data-testid="katastasi-sfalma"');
    expect(markup).toContain('DIKTYO');
    expect(markup).toContain('Δεν υπάρχει σύνδεση');
  });

  it('επαναφέρει τα δεδομένα μέσω των children', () => {
    const markup = renderToStaticMarkup(
      <OloniKatastasis katastasi={dedomena()} children={(data) => <ul>{data.map((d) => <li key={d} />)}</ul>} />
    );
    expect(markup).toContain('<li');
  });
});
