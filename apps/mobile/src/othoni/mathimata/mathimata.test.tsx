import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import Mathimata, { KartaMathimatos } from './mathimata.js';
import { pseudos_mathimata } from '../../../test-fixtures/pseudomata/index.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';

const MONI_PIGIS = fileURLToPath(new URL('./mathimata.tsx', import.meta.url));

/** Τυλίγει ένα στοιχείο σε MemoryRouter ώστε τα Link να αποδίδουν href. */
function apoidefsi(stoixeio: ReactElement): string {
  return renderToStaticMarkup(me_periballon_test(<MemoryRouter>{stoixeio}</MemoryRouter>));
}

/** Αντιγράφει τη διαφύγαση HTML που κάνει το renderToStaticMarkup στο κείμενο. */
function xekseki(keimeno: string): string {
  return keimeno.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

describe('mathimata — οθόνη λίστας μαθημάτων', () => {
  it('στο αρχικό render δείχνει την κατάσταση φόρτωσης του OloniKatastasis', () => {
    const html = apoidefsi(<Mathimata />);
    expect(html).toContain('data-testid="mathimata-ekran"');
    expect(html).toContain('data-testid="katastasi-fortosi"');
  });

  it('η κάρτα μαθήματος δείχνει τίτλο, κωδικό και την ετικέτα συγχρονισμένου', () => {
    const mathima = pseudos_mathimata()[0];
    expect(mathima).toBeDefined();
    if (mathima === undefined) {
      return;
    }
    const html = apoidefsi(<KartaMathimatos mathima={mathima} />);
    expect(html).toContain('data-testid="mathimata-karta"');
    expect(html).toContain('href="/xartis"');
    expect(html).toContain(mathima.kodikos);
    expect(html).toContain(xekseki(mathima.titlos));
    expect(html).toContain('Συγχρονισμένο');
  });

  it('οι υποχρεωτικές data-testid υπάρχουν στην πηγή της οθόνης', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    for (const testid of ['mathimata-ekran', 'mathimata-karta', 'mathimata-lista']) {
      expect(pigi).toContain(`"${testid}"`);
    }
  });

  it('η κάρτα δείχνει την ετικέτα Ενεργό όταν einaiTrexon είναι true', () => {
    const mathima = pseudos_mathimata()[0];
    expect(mathima).toBeDefined();
    if (mathima === undefined) return;
    const html = apoidefsi(<KartaMathimatos mathima={mathima} einaiTrexon={true} />);
    expect(html).toContain('Ενεργό');
  });

  it('η οθόνη χρησιμοποιεί το xrisiApothekisis και καλεί allaxe_kodiko_mathimatos', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(pigi).toContain('xrisiApothekisis');
    expect(pigi).toContain('allaxe_kodiko_mathimatos(mathima.kodikos)');
  });

  it('η οθόνη περιλαμβάνει πεδίο αναζήτησης και κάψουλες φιλτραρίσματος', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(pigi).toContain('mathimata-anazitisi-kouti');
    expect(pigi).toContain('type="search"');
    expect(pigi).toContain('kapsoules-filtra-mpara');
    expect(pigi).toContain('Συγχρονισμένα');
    expect(pigi).toContain('Εκκρεμή');
  });
});
