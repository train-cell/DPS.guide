import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Karta, Pilegma, MetrikosRing } from './karta.js';

describe('Karta — αναγλυφή κάρτα', () => {
  it('αποδίδει τίτλο, υπόκείμενο και stoicheia', () => {
    const markup = renderToStaticMarkup(
      <Karta titlos="Τίτλος" ypokeimeno="Υπόκείμενο" stoixeia={<span>Στοιχεία</span>} />
    );
    expect(markup).toContain('karta-titlos');
    expect(markup).toContain('Τίτλος');
    expect(markup).toContain('karta-ypokeimeno');
    expect(markup).toContain('Υπόκείμενο');
    expect(markup).toContain('Στοιχεία');
  });

  it('δεν αποδίδει το κουτί όταν λείπουν και τα δύο', () => {
    const markup = renderToStaticMarkup(<Karta />);
    expect(markup).not.toContain('odoni-xeiris');
    expect(markup).not.toContain('karta-titlos');
    expect(markup).not.toContain('karta-ypokeimeno');
  });

  it('αποδίδει τα akseis χωρίς τίτλο', () => {
    const markup = renderToStaticMarkup(
      <Karta akseis={<button type="button">Ακύρωση</button>} stoixeia={<span>Στοιχεία</span>} />
    );
    expect(markup).toContain('odoni-xeiris');
    expect(markup).toContain('Ακύρωση');
    expect(markup).not.toContain('karta-titlos');
  });

  it('εμφανίζει μόνο το stoixeia όταν δεν υπάρχουν τίτλος ή akseis', () => {
    const markup = renderToStaticMarkup(<Karta stoixeia={<span>Μόνο εδώ</span>} />);
    expect(markup).toContain('Μόνο εδώ');
    expect(markup).not.toContain('odoni-xeiris');
  });
});

describe('Pilegma — ετικέτα μετρικού', () => {
  it('αποδίδει το κείμενο', () => {
    expect(renderToStaticMarkup(<Pilegma keimeno="25.5%" />)).toContain('25.5%');
  });

  it('προσθέτει την εντονότερη κλάση μόνο όταν ζητηθεί', () => {
    expect(renderToStaticMarkup(<Pilegma keimeno="25.5%" entono />)).toContain(
      'pilegma-entono'
    );
    expect(renderToStaticMarkup(<Pilegma keimeno="25.5%" />)).not.toContain('pilegma-entono');
  });
});

describe('MetrikosRing — δακτύλιος προόδου', () => {
  it('υπολογίζει το ποσοστό και το aria-label', () => {
    const markup = renderToStaticMarkup(
      <MetrikosRing pososto={0.75} ariaEtiketa="Πρόοδος" />
    );
    expect(markup).toContain('ring-pososto');
    expect(markup).toContain('75%');
    expect(markup).toContain('aria-label="Πρόοδος: 75%"');
  });

  it('κομπριμάρει το pososto εκτός ορίων', () => {
    const markup = renderToStaticMarkup(
      <MetrikosRing pososto={1.5} ariaEtiketa="Μέγιστο" />
    );
    expect(markup).toContain('100%');
    expect(renderToStaticMarkup(<MetrikosRing pososto={-0.5} ariaEtiketa="Ελάχιστο" />)).toContain(
      '0%'
    );
  });
});
