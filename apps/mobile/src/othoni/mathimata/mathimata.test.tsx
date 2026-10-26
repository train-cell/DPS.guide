import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import Mathimata, {
  KartaMathimatos,
  DentroArxeionMathimatos,
  ProodosSygxronismou,
  STADIA_SYGXRONISMOU,
  morfopoiise_megethos_arxeiou,
} from './mathimata.js';
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
    for (const testid of ['mathimata-ekran', 'mathimata-karta', 'mathimata-lista', 'mathimata-sygxronismos']) {
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

  it('η morfopoiise_megethos_arxeiou μορφοποιεί σωστά bytes σε KB και MB', () => {
    expect(morfopoiise_megethos_arxeiou(null)).toBe('Άγνωστο');
    expect(morfopoiise_megethos_arxeiou(undefined)).toBe('Άγνωστο');
    expect(morfopoiise_megethos_arxeiou(512)).toBe('0.5 KB');
    expect(morfopoiise_megethos_arxeiou(1024)).toBe('1.0 KB');
    expect(morfopoiise_megethos_arxeiou(1024 * 500)).toBe('500.0 KB');
    expect(morfopoiise_megethos_arxeiou(1024 * 1024)).toBe('1.0 MB');
    expect(morfopoiise_megethos_arxeiou(1024 * 1024 * 5.5)).toBe('5.5 MB');
  });

  it('η οθόνη περιλαμβάνει Empty state CTA που οδηγεί στο /proedri', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(pigi).toContain('to="/proedri"');
    expect(pigi).toContain('mathimata-keno-cta');
    expect(pigi).toContain('Σύνδεση στο eClass');
  });

  it('το DentroArxeionMathimatos εξάγεται και χρησιμοποιεί το fortose_eurethrio', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(typeof DentroArxeionMathimatos).toBe('function');
    expect(pigi).toContain('fortose_eurethrio');
    expect(pigi).toContain('/provoli/');
    expect(pigi).toContain('arxeio-pdf-link');
  });

  describe('ProodosSygxronismou — αναλυτική πρόοδος συγχρονισμού (Stream 3)', () => {
    it('περιλαμβάνει και τα τρία απαιτούμενα στάδια συγχρονισμού', () => {
      expect(STADIA_SYGXRONISMOU).toEqual([
        'Σύνδεση στο LMS & ανάκτηση λίστας μαθημάτων...',
        'Έλεγχος νέων αρχείων & λήψη...',
        'Κρυπτογράφηση & αποθήκευση στο vault...',
      ]);
    });

    it('αποδίδει το component με data-testid="mathimata-proodos-sygxronismou", progress bar και ποσοστό', () => {
      const html = renderToStaticMarkup(<ProodosSygxronismou stadio={1} pososto={33} />);
      expect(html).toContain('data-testid="mathimata-proodos-sygxronismou"');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuenow="33"');
      expect(html).toContain('33%');
      expect(html).toContain('ion-progress-bar');
      expect(html).toContain('Σύνδεση στο LMS &amp; ανάκτηση λίστας μαθημάτων...');
      expect(html).toContain('Έλεγχος νέων αρχείων &amp; λήψη...');
      expect(html).toContain('Κρυπτογράφηση &amp; αποθήκευση στο vault...');
    });

    it('αποδίδει σωστά ένδειξη ολοκλήρωσης σταδίων στο στάδιο 2 και 3', () => {
      const html2 = renderToStaticMarkup(<ProodosSygxronismou stadio={2} pososto={66} />);
      expect(html2).toContain('aria-valuenow="66"');
      expect(html2).toContain('66%');
      expect(html2).toContain('Στάδιο 2 από 3');

      const html3 = renderToStaticMarkup(<ProodosSygxronismou stadio={3} pososto={100} />);
      expect(html3).toContain('aria-valuenow="100"');
      expect(html3).toContain('100%');
      expect(html3).toContain('Στάδιο 3 από 3');
    });

    it('η πηγή της οθόνης περιλαμβάνει το testid της αναλυτικής προόδου και τα testids', () => {
      const pigi = readFileSync(MONI_PIGIS, 'utf8');
      expect(pigi).toContain('mathimata-proodos-sygxronismou');
      expect(pigi).toContain('ProodosSygxronismou');
      for (const testid of [
        'mathimata-ekran',
        'mathimata-karta',
        'mathimata-lista',
        'mathimata-sygxronismos',
        'mathimata-keno-cta',
      ]) {
        expect(pigi).toContain(`"${testid}"`);
      }
    });
  });
});
