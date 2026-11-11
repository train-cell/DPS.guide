import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { EikonidioKapsoulis, KapsouliNavigisis, STOIXEIA_KAPSOULIS } from './kapsouli-navigisis.js';

describe('EikonidioKapsoulis — εικονίδια πλοήγησης', () => {
  it('απευθύνει όλα τα γνωστά kleidi με τα SVG τους', () => {
    for (const stoixeio of STOIXEIA_KAPSOULIS) {
      const markup = renderToStaticMarkup(<EikonidioKapsoulis kleidi={stoixeio.kleidi} fallbackGlyph="?" />);
      expect(markup).toContain('<svg');
      expect(markup).toContain('aria-hidden="true"');
    }
  });

  it('επιστρέφει το fallback glyph για άγνωστο kleidi', () => {
    const markup = renderToStaticMarkup(<EikonidioKapsoulis kleidi="mi_gnwsto" fallbackGlyph="◌" />);
    expect(markup).toContain('<span>◌</span>');
  });
});

describe('KapsouliNavigisis — κάψουλα πλοήγησης', () => {
  it('εμφανίζει όλα τα stoicheia με ετικέτα και εικονίδιο', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <KapsouliNavigisis />
      </MemoryRouter>
    );
    for (const stoixeio of STOIXEIA_KAPSOULIS) {
      expect(markup).toContain(`data-testid="kapsouli-${stoixeio.kleidi}"`);
      expect(markup).toContain(stoixeio.etiketa);
    }
  });

  it('δεν ενεργοποιεί κανένα link όταν δεν υπάρχει router ενεργό', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <KapsouliNavigisis />
      </MemoryRouter>
    );
    expect(markup).toContain('kapsouli-stoicheio');
    expect(markup).not.toContain('kapsouli-stoicheio-energo');
  });

  it('επισημαίνει ενεργό link όταν η διαδρομή ταιριάζει', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/simera']}>
        <KapsouliNavigisis />
      </MemoryRouter>
    );
    expect(markup).toContain('kapsouli-stoicheio-energo');
    expect(markup).toContain('data-testid="kapsouli-simera"');
  });

  it('εμφανίζει τα επιπλέον akseis', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <KapsouliNavigisis akseis={<button type="button">Πρόσθετο</button>} />
      </MemoryRouter>
    );
    expect(markup).toContain('Πρόσθετο');
  });
});
