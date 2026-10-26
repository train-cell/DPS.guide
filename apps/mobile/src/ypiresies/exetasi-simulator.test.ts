import { describe, expect, it } from 'vitest';
import {
  ftiaxe_dokimastiki_exetasi,
  vathmologise_exetasi,
  type AutoelegchosErwtisi,
  type DokimastikiExetasi,
} from './exetasi-simulator.js';

describe('Mock Exam Simulator - Ypiresies (exetasi-simulator.ts)', () => {
  const deigmaErwtiseon: AutoelegchosErwtisi[] = [
    {
      erwtisi: 'Τι είναι το Dijkstra algorithm;',
      apantisi: 'Αλγόριθμος εύρεσης συντομότερου μονοπατιού',
      ennoia: 'Γράφοι',
      enotita_id: 'grafos-1',
    },
    {
      erwtisi: 'Ποια είναι η χρονική πολυπλοκότητα του QuickSort στη μέση περίπτωση;',
      apantisi: 'O(n log n)',
      ennoia: 'Αλγόριθμοι Ταξινόμησης',
      enotita_id: 'taxinomisi-1',
    },
    {
      erwtisi: 'Τι είναι ένας δυαδικός σωρός (Binary Heap);',
      apantisi: 'Πλήρες δυαδικό δέντρο με ιδιότητα σωρού',
      ennoia: 'Δομές Δεδομένων',
      enotita_id: 'domes-1',
    },
    {
      erwtisi: 'Πότε έχουμε χειρότερη περίπτωση στο QuickSort;',
      apantisi: 'Όταν το pivot είναι το ελάχιστο ή μέγιστο στοιχείο O(n^2)',
      ennoia: 'Αλγόριθμοι Ταξινόμησης',
      enotita_id: 'taxinomisi-1',
    },
    {
      erwtisi: 'Τι είναι το Bellman-Ford;',
      apantisi: 'Αλγόριθμος συντομότερου μονοπατιού με αρνητικά βάρη',
      ennoia: 'Γράφοι',
      enotita_id: 'grafos-1',
    },
    {
      erwtisi: 'Τι είναι ο πίνακας κατακερματισμού (Hash Table);',
      apantisi: 'Δομή δεδομένων άμεσης πρόσβασης O(1) μέση περίπτωση',
      ennoia: 'Δομές Δεδομένων',
      enotita_id: 'domes-1',
    },
  ];

  describe('ftiaxe_dokimastiki_exetasi', () => {
    it('προτεραιοποιεί ερωτήσεις υψηλής απόδοσης με βάση το apodosi map', () => {
      const apodosi: Record<string, number> = {
        'taxinomisi-1': 45, // Υψηλότερη απόδοση
        'grafos-1': 30,     // Μεσαία απόδοση
        'domes-1': 10,      // Χαμηλή απόδοση
      };

      const exetasi = ftiaxe_dokimastiki_exetasi('CS-201', deigmaErwtiseon, apodosi, 3);

      expect(exetasi.kodikos_mathimatos).toBe('CS-201');
      expect(exetasi.erwtiseis).toHaveLength(3);

      // Οι 2 πρώτες πρέπει να είναι από ταξινόμηση (απόδοση 45)
      expect(exetasi.erwtiseis[0]?.enotita_id).toBe('taxinomisi-1');
      expect(exetasi.erwtiseis[1]?.enotita_id).toBe('taxinomisi-1');
      // Η 3η πρέπει να είναι από γράφους (απόδοση 30)
      expect(exetasi.erwtiseis[2]?.enotita_id).toBe('grafos-1');

      // Έλεγχος scores
      expect(exetasi.erwtiseis[0]?.apodosi_score).toBe(45);
      expect(exetasi.erwtiseis[2]?.apodosi_score).toBe(30);
    });

    it('αν δεν δοθεί apodosi, διατηρεί τη σταθερή σειρά των ερωτήσεων', () => {
      const exetasi = ftiaxe_dokimastiki_exetasi('CS-201', deigmaErwtiseon, undefined, 4);
      expect(exetasi.erwtiseis).toHaveLength(4);
      expect(exetasi.erwtiseis[0]?.erwtisi).toBe(deigmaErwtiseon[0]?.erwtisi);
      expect(exetasi.erwtiseis[1]?.erwtisi).toBe(deigmaErwtiseon[1]?.erwtisi);
      expect(exetasi.erwtiseis[0]?.apodosi_score).toBe(0);
    });

    it('παράγει 4 επιλογές πολλαπλής επιλογής συμπεριλαμβανομένης της σωστής', () => {
      const exetasi = ftiaxe_dokimastiki_exetasi('CS-201', deigmaErwtiseon, undefined, 2);
      for (const q of exetasi.erwtiseis) {
        expect(q.epiloges.length).toBeGreaterThanOrEqual(2);
        expect(q.epiloges).toContain(q.apantisi);
      }
    });

    it('διατηρεί προϋπάρχουσες επιλογές αν παρέχονται στην είσοδο', () => {
      const erwtiseisMeEpiloges: AutoelegchosErwtisi[] = [
        {
          erwtisi: '2 + 2 = ?',
          apantisi: '4',
          ennoia: 'Μαθηματικά',
          epiloges: ['3', '4', '5'],
        },
      ];
      const exetasi = ftiaxe_dokimastiki_exetasi('MATH-101', erwtiseisMeEpiloges, undefined, 1);
      expect(exetasi.erwtiseis[0]?.epiloges).toEqual(['3', '4', '5']);
    });

    it('υπολογίζει το χρόνο εξέτασης ανάλογα με το πλήθος των ερωτήσεων', () => {
      const exetasi5 = ftiaxe_dokimastiki_exetasi('CS-201', deigmaErwtiseon, undefined, 5);
      expect(exetasi5.xronos_lepta).toBe(10); // 5 * 2
    });
  });

  describe('vathmologise_exetasi', () => {
    const exetasi: DokimastikiExetasi = {
      kodikos_mathimatos: 'CS-201',
      erwtiseis: [
        {
          id: 1,
          erwtisi: 'Ερώτηση 1',
          apantisi: 'Σωστό Α',
          ennoia: 'Γράφοι',
          epiloges: ['Σωστό Α', 'Λάθος 1', 'Λάθος 2'],
          apodosi_score: 10,
        },
        {
          id: 2,
          erwtisi: 'Ερώτηση 2',
          apantisi: 'Σωστό Β',
          ennoia: 'Γράφοι',
          epiloges: ['Σωστό Β', 'Λάθος 1', 'Λάθος 2'],
          apodosi_score: 10,
        },
        {
          id: 3,
          erwtisi: 'Ερώτηση 3',
          apantisi: 'Σωστό Γ',
          ennoia: 'Δέντρα',
          epiloges: ['Σωστό Γ', 'Λάθος 1', 'Λάθος 2'],
          apodosi_score: 5,
        },
        {
          id: 4,
          erwtisi: 'Ερώτηση 4',
          apantisi: 'Σωστό Δ',
          ennoia: 'Δέντρα',
          epiloges: ['Σωστό Δ', 'Λάθος 1', 'Λάθος 2'],
          apodosi_score: 5,
        },
      ],
      xronos_lepta: 10,
      dimiourgithike: '2026-10-26T20:00:00Z',
    };

    it('υπολογίζει άριστο σκορ 100% όταν όλες οι απαντήσεις είναι σωστές', () => {
      const apantiseis = {
        1: 'Σωστό Α',
        2: 'Σωστό Β',
        3: 'Σωστό Γ',
        4: 'Σωστό Δ',
      };
      const apotelesma = vathmologise_exetasi(exetasi, apantiseis);

      expect(apotelesma.teliko_skor).toBe(100);
      expect(apotelesma.sostes_apantiseis).toBe(4);
      expect(apotelesma.lathos_apantiseis).toBe(0);
      expect(apotelesma.epitixia).toBe(true);
      expect(apotelesma.analysi_ana_ennoia['Γράφοι']?.pososto).toBe(100);
      expect(apotelesma.analysi_ana_ennoia['Δέντρα']?.pososto).toBe(100);
    });

    it('υπολογίζει μερικό σκορ και σωστή κατανομή ανά έννοια', () => {
      const apantiseis = {
        1: 'Σωστό Α', // Σωστό (Γράφοι: 1/2 = 50%)
        2: 'Λάθος',   // Λάθος
        3: 'Σωστό Γ', // Σωστό (Δέντρα: 2/2 = 100%)
        4: 'Σωστό Δ', // Σωστό
      };
      const apotelesma = vathmologise_exetasi(exetasi, apantiseis);

      expect(apotelesma.teliko_skor).toBe(75); // 3/4 = 75%
      expect(apotelesma.sostes_apantiseis).toBe(3);
      expect(apotelesma.lathos_apantiseis).toBe(1);
      expect(apotelesma.epitixia).toBe(true);

      expect(apotelesma.analysi_ana_ennoia['Γράφοι']).toEqual({
        synolo: 2,
        sostes: 1,
        pososto: 50,
      });
      expect(apotelesma.analysi_ana_ennoia['Δέντρα']).toEqual({
        synolo: 2,
        sostes: 2,
        pososto: 100,
      });
    });

    it('διαχειρίζεται μηδενικό σκορ και αποτυχία', () => {
      const apantiseis = {
        1: 'Λάθος',
        2: 'Λάθος',
        3: 'Λάθος',
        4: 'Λάθος',
      };
      const apotelesma = vathmologise_exetasi(exetasi, apantiseis);

      expect(apotelesma.teliko_skor).toBe(0);
      expect(apotelesma.sostes_apantiseis).toBe(0);
      expect(apotelesma.lathos_apantiseis).toBe(4);
      expect(apotelesma.epitixia).toBe(false);
    });

    it('είναι case-insensitive και αγνοεί περιττά κενά διαστήματα', () => {
      const apantiseis = {
        1: '  σωστό α  ',
        2: 'σωστό β',
        3: 'ΣΩΣΤΟ Γ',
        4: 'Σωστό Δ',
      };
      const apotelesma = vathmologise_exetasi(exetasi, apantiseis);
      expect(apotelesma.teliko_skor).toBe(100);
    });

    it('επιστρέφει ασφαλές αποτέλεσμα όταν η εξέταση δεν έχει ερωτήσεις', () => {
      const adeiaExetasi: DokimastikiExetasi = {
        kodikos_mathimatos: 'EMPTY',
        erwtiseis: [],
        xronos_lepta: 5,
        dimiourgithike: '2026-10-26T20:00:00Z',
      };
      const apotelesma = vathmologise_exetasi(adeiaExetasi, {});
      expect(apotelesma.teliko_skor).toBe(0);
      expect(apotelesma.synolo_erwtiseon).toBe(0);
    });
  });
});
