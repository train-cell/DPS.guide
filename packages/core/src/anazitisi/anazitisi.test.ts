import { describe, expect, it } from 'vitest';
import {
  ftiaxe_eurethrio_keimenou,
  prosthese_eggrafo_eurethriou,
  diagrapse_eggrafo_eurethriou,
  anazitise_keimeno,
  katharise_keimeno_anazitisis,
  tokenise_keimeno,
  ypologise_idf_bm25,
  ypologise_oro_bm25,
} from './anazitisi.js';
import type { EggrafoEurethriou } from './typoi.js';

describe('anazitisi — Local Full-Text Search Engine', () => {
  describe('καθαρισμός κειμένου και tokenization (ακρίβεια, τόνοι, κενά)', () => {
    it('αφαιρεί ελληνικούς τόνους και διαλυτικά και μετατρέπει σε πεζά', () => {
      expect(katharise_keimeno_anazitisis('Άλγόριθμοι & Δομές')).toBe('αλγοριθμοι & δομεσ');
      expect(katharise_keimeno_anazitisis('ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ ΣΕ C++')).toBe('προγραμματισμοσ σε c++');
      expect(katharise_keimeno_anazitisis('μαΐστρος πραΰνω')).toBe('μαιστροσ πραυνω');
    });

    it('αντιμετωπίζει πολλαπλά κενά, διαστήματα και σημεία στίξης στο tokenise_keimeno', () => {
      const tokens = tokenise_keimeno('   Εισαγωγή   στην   Επιστήμη   Υπολογιστών! (CS-101)... ');
      expect(tokens).toEqual(['εισαγωγη', 'στην', 'επιστημη', 'υπολογιστων', 'cs', '101']);
    });

    it('επιστρέφει κενό πίνακα για κενά ή μόνο σημεία στίξης', () => {
      expect(tokenise_keimeno('')).toEqual([]);
      expect(tokenise_keimeno('   \t\n  ')).toEqual([]);
      expect(tokenise_keimeno('...;;;---!@#$%^&*()')).toEqual([]);
    });
  });

  describe('διαχείριση ευρετηρίου (προσθήκη, ενημέρωση, διαγραφή)', () => {
    it('δημιουργεί άδειο ευρετήριο', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();
      expect(eurethrio.eggrafa.size).toBe(0);
      expect(eurethrio.antistrafoEurethrio.size).toBe(0);
      expect(eurethrio.synolikoMikos).toBe(0);
    });

    it('προσθέτει έγγραφο και υπολογίζει σωστά το ανεστραμμένο ευρετήριο', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();
      const eggrafo: EggrafoEurethriou = {
        id: 'doc-1',
        titlos: 'Διακριτά Μαθηματικά',
        keimeno: 'Θεωρία γραφημάτων και συνδυαστική ανάλυση.',
      };

      prosthese_eggrafo_eurethriou(eurethrio, eggrafo);
      expect(eurethrio.eggrafa.size).toBe(1);
      expect(eurethrio.eggrafa.get('doc-1')).toBe(eggrafo);
      expect(eurethrio.antistrafoEurethrio.has('διακριτα')).toBe(true);
      expect(eurethrio.antistrafoEurethrio.has('γραφηματων')).toBe(true);
    });

    it('ενημερώνει υπάρχον έγγραφο όταν ξαναπροστεθεί με το ίδιο ID', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'doc-1',
        titlos: 'Έκδοση 1',
        keimeno: 'Παλιό περιεχόμενο φυσικής.',
      });

      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'doc-1',
        titlos: 'Έκδοση 2',
        keimeno: 'Νέο περιεχόμενο χημείας.',
      });

      expect(eurethrio.eggrafa.size).toBe(1);
      expect(eurethrio.antistrafoEurethrio.has('φυσικησ')).toBe(false);
      expect(eurethrio.antistrafoEurethrio.has('χημειασ')).toBe(true);
    });

    it('διαγράφει έγγραφο και καθαρίζει τα tokens από το ανεστραμμένο ευρετήριο', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'doc-1',
        keimeno: 'Μοναδική λέξη',
      });

      expect(diagrapse_eggrafo_eurethriou(eurethrio, 'doc-1')).toBe(true);
      expect(eurethrio.eggrafa.size).toBe(0);
      expect(eurethrio.antistrafoEurethrio.has('μοναδικη')).toBe(false);
      expect(diagrapse_eggrafo_eurethriou(eurethrio, 'doc-1')).toBe(false);
    });
  });

  describe('μαθηματικοί υπολογισμοί BM25-lite', () => {
    it('ypologise_idf_bm25 παράγει θετική μη-μηδενική τιμή IDF για υπαρκτά έγγραφα', () => {
      const idf = ypologise_idf_bm25(10, 2);
      expect(idf).toBeGreaterThan(0);
      // Σπάνιοι όροι έχουν υψηλότερο IDF από συχνούς όρους
      const idfSpanio = ypologise_idf_bm25(100, 2);
      const idfSyxno = ypologise_idf_bm25(100, 80);
      expect(idfSpanio).toBeGreaterThan(idfSyxno);
    });

    it('ypologise_oro_bm25 επιβραβεύει υψηλότερη συχνότητα όρου με κορεσμό', () => {
      const scoreTf1 = ypologise_oro_bm25(1, 20, 20, 1.5);
      const scoreTf5 = ypologise_oro_bm25(5, 20, 20, 1.5);
      expect(scoreTf5).toBeGreaterThan(scoreTf1);
      // Ο διπλασιασμός δεν είναι γραμμικός λόγω κορεσμού BM25
      expect(scoreTf5).toBeLessThan(scoreTf1 * 5);
    });
  });

  describe('αναζήτηση κειμένου & ταξινόμηση συνάφειας (relevancy sorting)', () => {
    it('αναζητά με ακρίβεια και αγνοεί τόνους/πεζά-κεφαλαία', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'math-1',
        titlos: 'Αλγόριθμοι και Πολυπλοκότητα',
        keimeno: 'Ανάλυση ασυμπτωτικής συμπεριφοράς και πολυπλοκότητα αλγορίθμων ταξινόμησης.',
      });
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'math-2',
        titlos: 'Βάσεις Δεδομένων',
        keimeno: 'Σχεσιακό μοντέλο και γλώσσα SQL.',
      });

      // Αναζήτηση χωρίς τόνους
      const apotelesmata1 = anazitise_keimeno(eurethrio, 'αλγοριθμοι');
      expect(apotelesmata1).toHaveLength(1);
      expect(apotelesmata1[0]?.eggrafoId).toBe('math-1');
      expect(apotelesmata1[0]?.vathmologia).toBeGreaterThan(0);

      // Αναζήτηση με κεφαλαία και τόνους
      const apotelesmata2 = anazitise_keimeno(eurethrio, 'ΑΛΓΟΡΙΘΜΟΙ');
      expect(apotelesmata2).toHaveLength(1);
      expect(apotelesmata2[0]?.eggrafoId).toBe('math-1');

      // Αναζήτηση με τελικό σίγμα
      const apotelesmata3 = anazitise_keimeno(eurethrio, 'αλγόριθμος');
      expect(apotelesmata3.length).toBeGreaterThanOrEqual(1);
    });

    it('ταξινομεί τα αποτελέσματα κατά συνάφεια (relevancy): τίτλος και συχνότητα υπερισχύουν', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();

      // Έγγραφο 1: Περιέχει τον όρο στον τίτλο (boost 2x)
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'doc-titlos',
        titlos: 'Λειτουργικά Συστήματα',
        keimeno: 'Εισαγωγή στη διαχείριση μνήμης και διεργασιών.',
      });

      // Έγγραφο 2: Απλή αναφορά στο κείμενο
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'doc-keimeno',
        titlos: 'Πληροφορική 1',
        keimeno: 'Σε αυτό το μάθημα αναφέρονται συνοπτικά τα λειτουργικά συστήματα.',
      });

      // Έγγραφο 3: Άσχετο έγγραφο
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'doc-asxeto',
        titlos: 'Ηλεκτρονικά',
        keimeno: 'Κυκλώματα και δίοδοι.',
      });

      const apotelesmata = anazitise_keimeno(eurethrio, 'λειτουργικά συστήματα');
      expect(apotelesmata).toHaveLength(2);
      expect(apotelesmata[0]?.eggrafoId).toBe('doc-titlos');
      expect(apotelesmata[1]?.eggrafoId).toBe('doc-keimeno');
      expect(apotelesmata[0]?.vathmologia).toBeGreaterThan(apotelesmata[1]?.vathmologia ?? 0);
    });

    it('υποστηρίζει αναζήτηση με πολλαπλούς όρους και αναφέρει τους ταιριασμένους όρους', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'doc-a',
        titlos: 'Δίκτυα Υπολογιστών',
        keimeno: 'Πρωτόκολλα TCP IP και δρομολόγηση πακέτων.',
      });

      const res = anazitise_keimeno(eurethrio, 'TCP πρωτόκολλα');
      expect(res).toHaveLength(1);
      expect(res[0]?.eggrafoId).toBe('doc-a');
      expect(res[0]?.tairiasmenoiOroi).toContain('tcp');
      expect(res[0]?.tairiasmenoiOroi).toContain('πρωτοκολλα');
    });

    it('υποστηρίζει prefix search για όρους μήκους >= 3', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'doc-kryptografia',
        titlos: 'Ασφάλεια',
        keimeno: 'Κρυπτογραφία και συμμετρικοί αλγόριθμοι κρυπτογράφησης.',
      });

      const res = anazitise_keimeno(eurethrio, 'κρυπτο');
      expect(res.length).toBeGreaterThanOrEqual(1);
      expect(res[0]?.eggrafoId).toBe('doc-kryptografia');
    });

    it('σέβεται το όριο αποτελεσμάτων (orio)', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();
      for (let i = 1; i <= 20; i++) {
        prosthese_eggrafo_eurethriou(eurethrio, {
          id: `mathima-${i}`,
          titlos: `Μάθημα ${i}`,
          keimeno: 'Κοινό περιεχόμενο μελέτης.',
        });
      }

      const resDefault = anazitise_keimeno(eurethrio, 'μελέτης');
      expect(resDefault).toHaveLength(10); // default orio = 10

      const resCustom = anazitise_keimeno(eurethrio, 'μελέτης', 5);
      expect(resCustom).toHaveLength(5);
    });

    it('επιστρέφει κενό πίνακα για άκυρα ή κενά ερωτήματα και άδειο ευρετήριο', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();
      expect(anazitise_keimeno(eurethrio, 'τεστ')).toEqual([]);

      prosthese_eggrafo_eurethriou(eurethrio, {
        id: '1',
        keimeno: 'δοκιμή',
      });

      expect(anazitise_keimeno(eurethrio, '')).toEqual([]);
      expect(anazitise_keimeno(eurethrio, '   ')).toEqual([]);
      expect(anazitise_keimeno(eurethrio, '???!!!')).toEqual([]);
      expect(anazitise_keimeno(eurethrio, 'δοκιμή', 0)).toEqual([]);
      expect(anazitise_keimeno(eurethrio, 'δοκιμή', -5)).toEqual([]);
      expect(anazitise_keimeno(eurethrio, 'εντελώς_άγνωστη_λέξη_xyz')).toEqual([]);
    });

    it('εγγυάται ντετερμινιστική κατάταξη σε ισοβαθμίες (tie-breaker με id)', () => {
      const eurethrio = ftiaxe_eurethrio_keimenou();
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'doc-b',
        keimeno: 'ακριβώς ίδιο κείμενο',
      });
      prosthese_eggrafo_eurethriou(eurethrio, {
        id: 'doc-a',
        keimeno: 'ακριβώς ίδιο κείμενο',
      });

      const res = anazitise_keimeno(eurethrio, 'κείμενο');
      expect(res).toHaveLength(2);
      expect(res[0]?.vathmologia).toBe(res[1]?.vathmologia);
      // doc-a πρέπει να προηγείται του doc-b λόγω αλφαβητικού tie-breaker
      expect(res[0]?.eggrafoId).toBe('doc-a');
      expect(res[1]?.eggrafoId).toBe('doc-b');
    });
  });
});
