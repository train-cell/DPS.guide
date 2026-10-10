import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TutorChat, {
  APANTISI_YPARXEIS_STO_YLIKO,
  apantisa_tutor,
  enotita_apo_xarti,
  kanonikopoiei,
  xairetisma_tutor,
} from './tutor.js';
import { pseudos_xartis } from '../../pseudomata/index.js';

function tutor_arxeio(): string {
  return readFileSync(fileURLToPath(new URL('./tutor.tsx', import.meta.url)), 'utf8');
}

/** Αποδίδει την οθόνη σε SSR μέσα σε MemoryRouter, χωρίς DOM και χωρίς @testing-library. */
function apostrophes_tutor(diadromi: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[diadromi]}>
      <Routes>
        <Route path="/tutor" element={<TutorChat />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('tutor — κανονικοποίηση κειμένου', () => {
  it('καθαρίζει τόνους, πεζοποιεί και ενώνει το τελικό σίγμα', () => {
    expect(kanonikopoiei('ΜΕΤΑΒΛΗΤΉ')).toBe('μεταβλητη');
    expect(kanonikopoiei('Παγίδες;')).toBe('παγιδεσ;');
    expect(kanonikopoiei('ΟΔΟΣ')).toBe('οδοσ');
  });
});

describe('tutor — enotita_apo_xarti', () => {
  it('βρίσκει την ενότητά του χάρτη από το id του query string', () => {
    expect(enotita_apo_xarti(pseudos_xartis(), 'en-2')?.titlos).toBe('Μεταβλητές και τύποι');
    expect(enotita_apo_xarti(pseudos_xartis(), 'en-4')?.id).toBe('en-4');
  });

  it('επιστρέφει null για κενό, whitespace ή άγνωστο id', () => {
    expect(enotita_apo_xarti(pseudos_xartis(), '')).toBeNull();
    expect(enotita_apo_xarti(pseudos_xartis(), '   ')).toBeNull();
    expect(enotita_apo_xarti(pseudos_xartis(), 'en-999')).toBeNull();
  });
});

describe('tutor — apantisa_tutor (ο κανόνας «Δεν υπάρχει στο υλικό»)', () => {
  it('απαντά σε «μεταβλητη» με εξήγηση μεταβλητής', () => {
    const apantisi = apantisa_tutor('Τι είναι μια μεταβλητη;');
    expect(apantisi).toContain('Μεταβλητή');
    expect(apantisi).not.toBe(APANTISI_YPARXEIS_STO_YLIKO);
  });

  it('απαντά σε «παγιδα» με ουσιαστική υπόδειξη', () => {
    const apantisi = apantisa_tutor('ποιες ειναι οι παγιδες;');
    expect(apantisi).toContain('παγίδες');
    expect(apantisi).not.toBe(APANTISI_YPARXEIS_STO_YLIKO);
  });

  it('ταιριάζει και με τόνους και με κεφαλαία γράμματα', () => {
    expect(apantisa_tutor('ΜΕΤΑΒΛΗΤΉ')).toBe(apantisa_tutor('μεταβλητη'));
    expect(apantisa_tutor('Παγίδα')).toBe(apantisa_tutor('παγιδα'));
  });

  it('επιστρέφει ακριβώς «Δεν υπάρχει στο υλικό» όταν τίποτα δεν ταιριάζει', () => {
    expect(apantisa_tutor('ποια είναι η πιθανότητα να βρωχτώ 6 σε τζιρό;')).toBe(
      APANTISI_YPARXEIS_STO_YLIKO
    );
    expect(apantisa_tutor('   ')).toBe(APANTISI_YPARXEIS_STO_YLIKO);
    expect(APANTISI_YPARXEIS_STO_YLIKO).toBe('Δεν υπάρχει στο υλικό');
  });
});

describe('tutor — xairetisma_tutor', () => {
  it('το αρχικό γράμμα ονομάζει την ενεργή ενότητα', () => {
    const enotita = enotita_apo_xarti(pseudos_xartis(), 'en-2');
    const gramma = xairetisma_tutor(enotita);
    expect(gramma.rolos).toBe('tutor');
    expect(gramma.keimeno).toContain('Μεταβλητές και τύποι');
  });

  it('χωρίς ενότητα μιλά για το μάθημα, χωρίς να εμφανίζει «undefined»', () => {
    const gramma = xairetisma_tutor(null);
    expect(gramma.keimeno).toContain('το μάθημα');
    expect(gramma.keimeno).not.toContain('undefined');
  });
});

describe('tutor — SSR της οθόνης', () => {
  it('αποδίδει την οθόνη με το υποχρεωτικό data-testid', () => {
    const html = apostrophes_tutor('/tutor?enotita=en-2');
    expect(html).toContain('data-testid="tutor-ekran"');
  });

  it('η αρχική απόδοση περνά από το OloniKatastasis σε κατάσταση φόρτωσης', () => {
    const html = apostrophes_tutor('/tutor?enotita=en-2');
    expect(html).toContain('data-testid="katastasi-fortosi"');
  });

  it('το ?enotita της διαδρομής εμφανίζεται στην κεφαλίδα πριν φορτωθεί ο χάρτης', () => {
    const html = apostrophes_tutor('/tutor?enotita=en-2');
    expect(html).toContain('Ενότητα: en-2');
    expect(html).toContain('pilegma');
  });

  it('χωρίς ?enotita η κεφαλίδα παραμένει ορατή με τοπική ένδειξη, όχι κενή', () => {
    const html = apostrophes_tutor('/tutor');
    expect(html).toContain('Ενότητα: γενικά');
  });
});

describe('tutor — συμβόλαιο data-testid στον πηγαίο κώδικα', () => {
  it('δηλώνει ακριβώς τα πέντε υποχρεωτικά testid', () => {
    const arxeio = tutor_arxeio();
    for (const testid of [
      'tutor-ekran',
      'tutor-imerologia',
      'tutor-paixidi',
      'tutor-apomilosi',
      'tutor-fortisi',
    ]) {
      expect(arxeio).toContain(`data-testid="${testid}"`);
    }
  });

  it('χρησιμοποιεί τις κλάσεις ιστορικού, φυσικής και κουμπιού αποστολής', () => {
    const arxeio = tutor_arxeio();
    for (const klasa of [
      'imerologia',
      'imerologia-gramma',
      'imerologia-bolakia',
      'imerologia-apantisi',
      'imerologia-paixidi',
      'imerologia-paixidi-gramma',
    ]) {
      expect(arxeio).toContain(klasa);
    }
  });

  it('κλειδώνει το κουμπί αποστολής όσο περιμένει η απάντηση', () => {
    const arxeio = tutor_arxeio();
    expect(arxeio).toContain('disabled={apostolto || trima.trim() === \'\'}');
    expect(arxeio).toContain('data-testid="tutor-fortisi"');
  });

  it('φυλάει τις ασύγχρονες ενημερώσεις με σημαία mounted', () => {
    const arxeio = tutor_arxeio();
    expect(arxeio).toContain('alive.current');
    expect(arxeio).toContain('clearTimeout');
  });

  it('δεν εισάγει inline style ούτε νέο αρχείο CSS', () => {
    const arxeio = tutor_arxeio();
    expect(arxeio).not.toContain('style={{');
    expect(arxeio).not.toContain(".css'");
    expect(arxeio).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('δεν χρησιμοποιεί any, ts-ignore, ts-expect-error ή μη-null assertion', () => {
    const arxeio = tutor_arxeio();
    expect(arxeio).not.toMatch(/:\s*any\b/);
    expect(arxeio).not.toContain('@ts-ignore');
    expect(arxeio).not.toContain('@ts-expect-error');
    expect(arxeio).not.toMatch(/!\s*[.;,)]/);
  });
});