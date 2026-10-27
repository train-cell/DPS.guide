import { describe, expect, it } from 'vitest';
import {
  ypologise_fwnitiki_omoiotita,
  kanonikopoiise_fwnitika,
  ypologise_levenshtein,
  ypologise_omoiotita_levenshtein,
  KATWFLI_EPITYXIAS_FWNITIKIS,
} from './fwnitiko-matching.js';

describe('fwnitiko-matching', () => {
  describe('kanonikopoiise_fwnitika', () => {
    it('αφαιρεί τόνους και διαλυτικά από ελληνικούς χαρακτήρες', () => {
      const eiserxomeno = 'Άυλος, εΐδα, μάθηση, πρωινό, ιδέα!';
      const anamenomeno = 'αυλοσ ειδα μαθηση πρωινο ιδεα';
      expect(kanonikopoiise_fwnitika(eiserxomeno)).toBe(anamenomeno);
    });

    it('μετατρέπει κεφαλαία σε πεζά και κανονικοποιεί τελικό σίγμα', () => {
      expect(kanonikopoiise_fwnitika('ΑΛΓΟΡΙΘΜΟΣ')).toBe('αλγοριθμοσ');
      expect(kanonikopoiise_fwnitika('Αλγόριθμος')).toBe('αλγοριθμοσ');
    });

    it('αφαιρεί σημεία στίξης, παρενθέσεις και πολλαπλά κενά', () => {
      const eiserxomeno = '  Στοίβα (Stack)...   ή Ουρά; \n ';
      expect(kanonikopoiise_fwnitika(eiserxomeno)).toBe('στοιβα stack η ουρα');
    });

    it('διαχειρίζεται κενές συμβολοσειρές', () => {
      expect(kanonikopoiise_fwnitika('')).toBe('');
      expect(kanonikopoiise_fwnitika('   ')).toBe('');
    });
  });

  describe('ypologise_levenshtein & ypologise_omoiotita_levenshtein', () => {
    it('υπολογίζει μηδενική απόσταση για πανομοιότυπα κείμενα', () => {
      expect(ypologise_levenshtein('δομη', 'δομη')).toBe(0);
      expect(ypologise_omoiotita_levenshtein('δομη', 'δομη')).toBe(1);
    });

    it('υπολογίζει σωστή απόσταση Levenshtein για απλές αντικαταστάσεις/προσθήκες', () => {
      expect(ypologise_levenshtein('γατα', 'κοτα')).toBe(2);
      expect(ypologise_levenshtein('α', '')).toBe(1);
      expect(ypologise_levenshtein('', 'β')).toBe(1);
    });

    it('επιστρέφει 1 όταν και τα δύο strings είναι κενά', () => {
      expect(ypologise_omoiotita_levenshtein('', '')).toBe(1);
    });
  });

  describe('ypologise_fwnitiki_omoiotita', () => {
    it('αναγνωρίζει ακριβή απάντηση με 100% επιτυχία', () => {
      const apotelesma = ypologise_fwnitiki_omoiotita(
        'Δυαδική Αναζήτηση',
        'Δυαδική Αναζήτηση',
        ['δυαδική', 'αναζήτηση']
      );

      expect(apotelesma.epityxia).toBe(true);
      expect(apotelesma.posostoOmoiotitas).toBe(100);
      expect(apotelesma.vretheisanLexeis).toEqual(['δυαδική', 'αναζήτηση']);
    });

    it('αγνοεί διαφορές σε τόνους, κεφαλαία και στίξη', () => {
      const apotelesma = ypologise_fwnitiki_omoiotita(
        'δυαδικη αναζητηση!',
        'ΔΥΑΔΙΚΗ ΑΝΑΖΗΤΗΣΗ',
        ['δυαδική', 'αναζήτηση']
      );

      expect(apotelesma.epityxia).toBe(true);
      expect(apotelesma.posostoOmoiotitas).toBe(100);
      expect(apotelesma.vretheisanLexeis.length).toBe(2);
    });

    it('επιτυγχάνει όταν ο χρήστης απαντάει περιφραστικά αλλά περιλαμβάνει όλες τις λέξεις-κλειδιά', () => {
      const apotelesma = ypologise_fwnitiki_omoiotita(
        'Είναι η δυαδική αναζήτηση με λογαριθμικό χρόνο',
        'Δυαδική αναζήτηση',
        ['δυαδική', 'αναζήτηση']
      );

      expect(apotelesma.epityxia).toBe(true);
      expect(apotelesma.posostoOmoiotitas).toBeGreaterThanOrEqual(KATWFLI_EPITYXIAS_FWNITIKIS);
      expect(apotelesma.vretheisanLexeis).toEqual(['δυαδική', 'αναζήτηση']);
    });

    it('αναγνωρίζει λέξεις-κλειδιά ακόμα και με μικρό φωνητικό σφάλμα (fuzzy tolerance)', () => {
      const apotelesma = ypologise_fwnitiki_omoiotita(
        'δυαδικη αναζιτηση',
        'δυαδική αναζήτηση',
        ['δυαδική', 'αναζήτηση']
      );

      expect(apotelesma.epityxia).toBe(true);
      expect(apotelesma.posostoOmoiotitas).toBeGreaterThanOrEqual(70);
      expect(apotelesma.vretheisanLexeis).toContain('δυαδική');
    });

    it('αποτυγχάνει όταν η απάντηση είναι εντελώς λανθασμένη', () => {
      const apotelesma = ypologise_fwnitiki_omoiotita(
        'Ουρά προτεραιότητας και σωρός',
        'Δυαδική αναζήτηση',
        ['δυαδική', 'αναζήτηση']
      );

      expect(apotelesma.epityxia).toBe(false);
      expect(apotelesma.posostoOmoiotitas).toBeLessThan(70);
      expect(apotelesma.vretheisanLexeis).toEqual([]);
    });

    it('χειρίζεται κενή απάντηση χρήστη με ασφάλεια (0% ομοιότητα, αποτυχία)', () => {
      const apotelesma = ypologise_fwnitiki_omoiotita(
        '',
        'Στοίβα',
        ['στοίβα']
      );

      expect(apotelesma.epityxia).toBe(false);
      expect(apotelesma.posostoOmoiotitas).toBe(0);
      expect(apotelesma.vretheisanLexeis).toEqual([]);
    });

    it('λειτουργεί ορθά όταν δεν έχουν δοθεί λέξεις-κλειδιά (μόνο Levenshtein στόχου)', () => {
      const apotelesmaSosto = ypologise_fwnitiki_omoiotita(
        'αλγόριθμος dijkstra',
        'Αλγόριθμος Dijkstra',
        []
      );
      expect(apotelesmaSosto.epityxia).toBe(true);
      expect(apotelesmaSosto.posostoOmoiotitas).toBe(100);

      const apotelesmaLathos = ypologise_fwnitiki_omoiotita(
        'κάτι άλλο εντελώς',
        'Αλγόριθμος Dijkstra',
        []
      );
      expect(apotelesmaLathos.epityxia).toBe(false);
      expect(apotelesmaLathos.posostoOmoiotitas).toBeLessThan(70);
    });
  });
});
