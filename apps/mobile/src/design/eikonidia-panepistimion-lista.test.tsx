import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EikonidioPanepistimiou, PANEPISTIMIA_LISTA } from './eikonidia-panepistimion.js';

/**
 * Εισαγωγές μόνο για το branching test: το `tmima` είναι κενό, ώστε να καλυφθεί
 * η πλευρά `p.tmima && p.tmima.length > 0` που στο production dataset δεν υπάρχει.
 */
vi.mock('@dps/core', () => ({
  LISTA_PANEPISTIMION: [
    {
      id: 'unipi_cs',
      onoma: 'Πανεπιστήμιο Πειραιώς',
      syntomi_onomasia: 'ΠΑΠΕΙ',
      tmima: 'Τμήμα Πληροφορικής',
      poli: 'Πειραιάς',
      perioxh: 'athina',
      kategoria: 'pliroforiki_stem',
      base_url: 'https://thales.cs.unipi.gr',
      typos_lms: 'openeclass',
      typos_auth: 'topiki',
      xromata: { vasiko: '#0a2540', tonismeno: '#206095' },
      syntomo_eikonidio: 'unipi_cs',
    },
    {
      id: 'uoa_dit',
      onoma: 'Εθνικό και Καποδιστριακό Πανεπιστήμιο Αθηνών',
      syntomi_onomasia: 'ΕΚΠΑ',
      tmima: '',
      poli: 'Αθήνα',
      perioxh: 'athina',
      kategoria: 'pliroforiki_stem',
      base_url: 'https://eclass.uoa.gr',
      typos_lms: 'openeclass',
      typos_auth: 'cas',
      xromata: { vasiko: '#1a365d', tonismeno: '#2b6cb0' },
      syntomo_eikonidio: 'uoa',
    },
  ],
}));

describe('PANEPISTIMIA_LISTA — perigrafi', () => {
  it('χρησιμοποιεί το tmima όταν υπάρχει', () => {
    const perigrafi = PANEPISTIMIA_LISTA.find((p) => p.id === 'unipi_cs')?.perigrafi;
    expect(perigrafi).toBe('Τμήμα Πληροφορικής & eClass ΠΑΠΕΙ');
  });

  it('χρησιμοποιεί το onoma όταν λείπει το tmima', () => {
    const perigrafi = PANEPISTIMIA_LISTA.find((p) => p.id === 'uoa')?.perigrafi;
    expect(perigrafi).toBe('Εθνικό και Καποδιστριακό Πανεπιστήμιο Αθηνών');
  });

  it('αποδίδει το eikonidio για τα στοιχεία της λίστας', () => {
    for (const p of PANEPISTIMIA_LISTA) {
      const markup = renderToStaticMarkup(<EikonidioPanepistimiou id={p.id} />);
      expect(markup).toContain(`data-testid="eikonidio-panepistimiou-${p.id === 'uoa_dit' ? 'uoa' : p.id}"`);
    }
  });
});
