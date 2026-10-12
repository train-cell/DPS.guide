import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TutorChat, {
  APANTISI_YPARXEIS_STO_YLIKO,
  DRASEIS_TUTOR,
  EROTISEIS_QUIZ,
  apantisa_tutor,
  apantisi_drasis,
  apantisi_me_llm_i_topika,
  axiologise_quiz,
  diamorfose_erotisi_quiz,
  einai_aitima_quiz,
  enotita_apo_xarti,
  entopise_epilogi_apantisis,
  kanonikopoiei,
  pare_erotisi_quiz,
  xairetisma_tutor,
} from './tutor.js';
import { pseudos_xartis } from '../../pseudomata/index.js';
import { ftiaxe_periballon } from '../../periballon/index.js';
import { MockLlm } from '@dps/core';

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

describe('tutor — xairetisma_tutor με σύνδεση μαθήματος', () => {
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

  it('αναφέρει το συγκεκριμένο ενεργό μάθημα και την ενότητα', () => {
    const enotita = enotita_apo_xarti(pseudos_xartis(), 'en-1');
    const gramma = xairetisma_tutor(enotita, 'ΠΛΗ201');
    expect(gramma.keimeno).toContain('ΠΛΗ201');
    expect(gramma.keimeno).toContain('Βασικές αρχές και ιστορικό');
  });

  it('υποστηρίζει όλα τα μαθήματα πληροφορικής (ΠΛΗ101, ΠΛΗ302, ΠΛΗ204)', () => {
    expect(xairetisma_tutor(null, 'ΠΛΗ101').keimeno).toContain('ΠΛΗ101');
    expect(xairetisma_tutor(null, 'ΠΛΗ302').keimeno).toContain('ΠΛΗ302');
    expect(xairetisma_tutor(null, 'ΠΛΗ204').keimeno).toContain('ΠΛΗ204');
  });
});

describe('tutor — Grounded Reasoning ανά μάθημα', () => {
  it('απαντά σε ερωτήσεις Δομών Δεδομένων (ΠΛΗ101)', () => {
    const apantisiStoiVa = apantisa_tutor('Τι είναι η στοίβα;', { kodikosMathimatos: 'ΠΛΗ101' });
    expect(apantisiStoiVa).toContain('LIFO');
    expect(apantisiStoiVa).toContain('[[arx-1: σ. 8]]');

    const apantisiOura = apantisa_tutor('Πώς λειτουργεί η ουρά;', { kodikosMathimatos: 'ΠΛΗ101' });
    expect(apantisiOura).toContain('FIFO');
    expect(apantisiOura).toContain('[[arx-1: σ. 12]]');
  });

  it('απαντά σε ερωτήσεις Βάσεων Δεδομένων (ΠΛΗ302)', () => {
    const apantisiSql = apantisa_tutor('Πώς γράφεται ένα select query στην SQL;', {
      kodikosMathimatos: 'ΠΛΗ302',
    });
    expect(apantisiSql).toContain('SELECT');
    expect(apantisiSql).toContain('[[arx-1: σ. 10]]');

    const apantisiAcid = apantisa_tutor('Ποιες είναι οι ιδιότητες ACID;', {
      kodikosMathimatos: 'ΠΛΗ302',
    });
    expect(apantisiAcid).toContain('Ατομικότητα');
    expect(apantisiAcid).toContain('[[arx-1: σ. 30]]');
  });

  it('απαντά σε ερωτήσεις Αρχιτεκτονικής Υπολογιστών (ΠΛΗ204)', () => {
    const apantisiCpu = apantisa_tutor('Ποια είναι τα μέρη της CPU;', {
      kodikosMathimatos: 'ΠΛΗ204',
    });
    expect(apantisiCpu).toContain('ALU');
    expect(apantisiCpu).toContain('[[arx-1: σ. 4]]');

    const apantisiCache = apantisa_tutor('Τι είναι η κρυφή μνήμη Cache;', {
      kodikosMathimatos: 'ΠΛΗ204',
    });
    expect(apantisiCache).toContain('SRAM');
    expect(apantisiCache).toContain('[[arx-1: σ. 14]]');
  });
});

describe('tutor — Quick Action Bar', () => {
  it('περιλαμβάνει ακριβώς τις 4 προβλεπόμενες γρήγορες ενέργειες', () => {
    expect(DRASEIS_TUTOR.map((d) => d.titlos)).toEqual([
      '🎯 Quiz Μαθήματος',
      '💡 Εξήγηση Ύλης',
      '⚠️ SOS Εξεταστικής',
      '🧪 Λυμένη Άσκηση',
    ]);
  });

  it('παρέχει σύνοψη ύλης ανά μάθημα (💡 Εξήγηση Ύλης)', () => {
    const yli = apantisi_drasis('💡 Εξήγηση Ύλης', 'ΠΛΗ201');
    expect(yli).toContain('Σύνοψη Ύλης ΠΛΗ201');
    expect(yli).toContain('[[arx-1: σ. 1–28]]');
  });

  it('παρέχει SOS παγίδες εξεταστικής (⚠️ SOS Εξεταστικής)', () => {
    const sos = apantisi_drasis('⚠️ SOS Εξεταστικής', 'ΠΛΗ201');
    expect(sos).toContain('SOS Παγίδες Εξεταστικής');
    expect(sos).toContain('[[arx-1: σ. 10]]');
  });

  it('παρέχει λυμένη άσκηση (🧪 Λυμένη Άσκηση)', () => {
    const askisi = apantisi_drasis('🧪 Λυμένη Άσκηση', 'ΠΛΗ201');
    expect(askisi).toContain('Λυμένη Άσκηση');
    expect(askisi).toContain('athroisma_zygon');
    expect(askisi).toContain('[[arx-1: σ. 21]]');
  });
});

describe('tutor — Interactive Quiz Engine', () => {
  it('αναγνωρίζει αιτήματα έναρξης quiz («quiz», «κουιζ», «τεστ», «εξετασε με»)', () => {
    expect(einai_aitima_quiz('quiz')).toBe(true);
    expect(einai_aitima_quiz('Κάνε μου ένα κουίζ')).toBe(true);
    expect(einai_aitima_quiz('εξέτασέ με')).toBe(true);
    expect(einai_aitima_quiz('τεστ ενότητας')).toBe(true);
    expect(einai_aitima_quiz('τι είναι μεταβλητή;')).toBe(false);
  });

  it('εντοπίζει επιλογές απάντησης χρήστη (Α, Β, Γ, Δ, A, B, C, D)', () => {
    expect(entopise_epilogi_apantisis('Α')).toBe('A');
    expect(entopise_epilogi_apantisis('a')).toBe('A');
    expect(entopise_epilogi_apantisis('επιλογή β')).toBe('B');
    expect(entopise_epilogi_apantisis('Γ')).toBe('Γ');
    expect(entopise_epilogi_apantisis('Δ')).toBe('Δ');
    expect(entopise_epilogi_apantisis('δεν ξέρω')).toBeNull();
  });

  it('επιλέγει και μορφοποιεί ερώτηση quiz για το ενεργό μάθημα', () => {
    const erotisi = pare_erotisi_quiz('ΠΛΗ201', 'en-2');
    expect(erotisi.kodikosMathimatos).toBe('ΠΛΗ201');
    expect(erotisi.sostiEpilogi).toBe('B');

    const keimeno = diamorfose_erotisi_quiz(erotisi, 'ΠΛΗ201', 'Μεταβλητές και τύποι');
    expect(keimeno).toContain('🎯 Quiz Μαθήματος');
    expect(keimeno).toContain('5 / 2');
    expect(keimeno).toContain('A)');
    expect(keimeno).toContain('B)');
    expect(keimeno).toContain('👉 Απάντησε με το γράμμα της επιλογής σου');
  });

  it('αξιολογεί σωστή απάντηση με σκορ 1/1, ανάλυση και παραπομπή', () => {
    const erotisi = pare_erotisi_quiz('ΠΛΗ201', 'en-2');
    const apotelesma = axiologise_quiz(erotisi, 'B');
    expect(apotelesma).toContain('✅ Σωστά!');
    expect(apotelesma).toContain('Σκορ: 1/1 (100%)');
    expect(apotelesma).toContain('[[arx-1: σ. 14]]');
  });

  it('αξιολογεί λάθος απάντηση με σκορ 0/1, υπόδειξη της σωστής και παραπομπή', () => {
    const erotisi = pare_erotisi_quiz('ΠΛΗ201', 'en-2');
    const apotelesma = axiologise_quiz(erotisi, 'A');
    expect(apotelesma).toContain('❌ Λάθος απάντηση.');
    expect(apotelesma).toContain('Η σωστή επιλογή είναι η B');
    expect(apotelesma).toContain('Σκορ: 0/1 (0%)');
    expect(apotelesma).toContain('[[arx-1: σ. 14]]');
  });

  it('καλύπτει ερωτήσεις quiz για όλα τα μαθήματα (ΠΛΗ201, ΠΛΗ101, ΠΛΗ302, ΠΛΗ204)', () => {
    const q101 = pare_erotisi_quiz('ΠΛΗ101');
    expect(q101.kodikosMathimatos).toBe('ΠΛΗ101');

    const q302 = pare_erotisi_quiz('ΠΛΗ302');
    expect(q302.kodikosMathimatos).toBe('ΠΛΗ302');

    const q204 = pare_erotisi_quiz('ΠΛΗ204');
    expect(q204.kodikosMathimatos).toBe('ΠΛΗ204');

    const qCustom = pare_erotisi_quiz('CS101');
    expect(qCustom.kodikosMathimatos).toBe('CS101');
    expect(qCustom.erotisi).toContain('CS101');
    expect(qCustom.sostiEpilogi).toBe('A');

    const q101Bst = pare_erotisi_quiz('ΠΛΗ101', 'en-ds-3');
    expect(q101Bst.sostiEpilogi).toBe('Γ');
    const axiologisiG = axiologise_quiz(q101Bst, 'Γ');
    expect(axiologisiG).toContain('✅ Σωστά!');
  });
});

describe('tutor — Σύνδεση με LLM Port & AI Hardware Vault', () => {
  it('χρησιμοποιεί την αυθεντική AI απάντηση όταν υπάρχει API key στο Vault', async () => {
    const mockLlm = new MockLlm();
    mockLlm.orise_keimeno('Τι είναι αλγόριθμος;', 'Αυθεντική απάντηση Gemini AI από το cloud.');
    const periballon = ftiaxe_periballon({ llm: mockLlm });
    await periballon.mystika.vale('llm_api_key', 'vault-ai-secret-key-12345');

    const apantisi = await apantisi_me_llm_i_topika(
      'Τι είναι αλγόριθμος;',
      periballon,
      'ΠΛΗ201',
      null,
      null,
      []
    );

    expect(apantisi.keimeno).toBe('Αυθεντική απάντηση Gemini AI από το cloud.');
    expect(apantisi.neoQuiz).toBeNull();
  });

  it('ενεργοποιεί τη grounded reasoning engine σε offline / default mock λειτουργία', async () => {
    const periballon = ftiaxe_periballon(); // fake mystika χωρίς key, default MockLlm
    const apantisi = await apantisi_me_llm_i_topika(
      'Τι είναι μια μεταβλητή;',
      periballon,
      'ΠΛΗ201',
      null,
      null,
      []
    );

    expect(apantisi.keimeno).toContain('Μεταβλητή είναι ένα όνομα που δεσμεύει θέση στη μνήμη');
  });

  it('διαχειρίζεται πλήρη κύκλο quiz μέσω apantisi_me_llm_i_topika', async () => {
    const periballon = ftiaxe_periballon();
    // 1. Έναρξη quiz
    const quizStart = await apantisi_me_llm_i_topika(
      'quiz',
      periballon,
      'ΠΛΗ201',
      null,
      null,
      []
    );
    expect(quizStart.keimeno).toContain('🎯 Quiz Μαθήματος');
    expect(quizStart.neoQuiz).not.toBeNull();

    // 2. Απάντηση quiz
    const quizAnswer = await apantisi_me_llm_i_topika(
      'A',
      periballon,
      'ΠΛΗ201',
      null,
      quizStart.neoQuiz,
      []
    );
    expect(quizAnswer.keimeno).toContain('Σκορ:');
    expect(quizAnswer.neoQuiz).toBeNull();
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

  it('περιλαμβάνει τις κλάσεις της μπάρας γρήγορων ενεργειών', () => {
    const arxeio = tutor_arxeio();
    expect(arxeio).toContain('tutor-draseis-mpara');
    expect(arxeio).toContain('tutor-drasis-koumpi');
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