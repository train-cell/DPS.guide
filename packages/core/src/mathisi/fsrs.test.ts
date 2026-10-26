import { describe, expect, it } from 'vitest';
import {
  arxiki_katastasi_fsrs,
  metatropi_vathmologias,
  PROEPILOGMENA_VARH_FSRS,
  ypologise_epomeni_epanalipsi_fsrs,
  ypologise_retrievability,
  type FsrsKatastasi,
} from './fsrs.js';

describe('FSRS-4 Spaced Repetition Core (@dps/core)', () => {
  const STATHERI_IMEROMINIA = new Date('2026-10-01T12:00:00Z');

  describe('arxiki_katastasi_fsrs', () => {
    it('δημιουργεί αρχική κατάσταση με μηδενικές τιμές και σωστή ημερομηνία', () => {
      const katastasi = arxiki_katastasi_fsrs(STATHERI_IMEROMINIA);
      expect(katastasi).toEqual({
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        lastReview: '2026-10-01',
      });
    });

    it('αν δεν δοθεί ημερομηνία, χρησιμοποιεί τη σημερινή ημερομηνία YYYY-MM-DD', () => {
      const katastasi = arxiki_katastasi_fsrs();
      expect(katastasi.lastReview).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(katastasi.reps).toBe(0);
      expect(katastasi.lapses).toBe(0);
    });
  });

  describe('metatropi_vathmologias', () => {
    it('αντιστοιχίζει σωστά τόσο αριθμούς όσο και λεκτικές ετικέτες', () => {
      expect(metatropi_vathmologias(1)).toBe(1);
      expect(metatropi_vathmologias('xana')).toBe(1);
      expect(metatropi_vathmologias(2)).toBe(2);
      expect(metatropi_vathmologias('diskolo')).toBe(2);
      expect(metatropi_vathmologias(3)).toBe(3);
      expect(metatropi_vathmologias('kalo')).toBe(3);
      expect(metatropi_vathmologias(4)).toBe(4);
      expect(metatropi_vathmologias('efkolo')).toBe(4);
    });
  });

  describe('ypologise_retrievability (Retrievability decay)', () => {
    const katastasi: FsrsKatastasi = {
      stability: 9.0,
      difficulty: 5.0,
      reps: 1,
      lapses: 0,
      lastReview: '2026-10-01',
    };

    it('την ημέρα της επανάληψης (t=0) η ανακλησιμότητα είναι ακριβώς 1.0 (100%)', () => {
      const r = ypologise_retrievability(katastasi, 0);
      expect(r).toBeCloseTo(1.0, 5);
    });

    it('όταν t = S (t = 9 ημέρες), η ανακλησιμότητα είναι ακριβώς 0.9 (90% target retention)', () => {
      const r = ypologise_retrievability(katastasi, 9);
      expect(r).toBeCloseTo(0.9, 5);
    });

    it('φθίνει γνησίως μονότονα όσο περνούν οι ημέρες', () => {
      const r0 = ypologise_retrievability(katastasi, 0);
      const r3 = ypologise_retrievability(katastasi, 3);
      const r9 = ypologise_retrievability(katastasi, 9);
      const r18 = ypologise_retrievability(katastasi, 18);
      const r30 = ypologise_retrievability(katastasi, 30);

      expect(r0).toBeGreaterThan(r3);
      expect(r3).toBeGreaterThan(r9);
      expect(r9).toBeGreaterThan(r18);
      expect(r18).toBeGreaterThan(r30);
      expect(r30).toBeGreaterThan(0);
    });

    it('διαχειρίζεται με ασφάλεια μηδενική σταθερότητα χωρίς διαίρεση με το μηδέν', () => {
      const arxiki = arxiki_katastasi_fsrs();
      expect(ypologise_retrievability(arxiki, 0)).toBe(1.0);
      expect(ypologise_retrievability(arxiki, 5)).toBe(0.0);
    });
  });

  describe('ypologise_epomeni_epanalipsi_fsrs - Πρώτη αξιολόγηση (First review)', () => {
    it('αρχικοποιεί σταθερότητα και δυσκολία με βάση τις παραμέτρους w0..w3 για κάθε βαθμό', () => {
      const arxiki = arxiki_katastasi_fsrs(STATHERI_IMEROMINIA);

      const rXana = ypologise_epomeni_epanalipsi_fsrs(arxiki, 'xana', STATHERI_IMEROMINIA);
      expect(rXana.nea_katastasi.stability).toBe(PROEPILOGMENA_VARH_FSRS[0]); // 0.4
      expect(rXana.nea_katastasi.lapses).toBe(1);
      expect(rXana.nea_katastasi.reps).toBe(1);
      expect(rXana.diastima_imeron).toBe(1);

      const rDiskolo = ypologise_epomeni_epanalipsi_fsrs(arxiki, 'diskolo', STATHERI_IMEROMINIA);
      expect(rDiskolo.nea_katastasi.stability).toBe(PROEPILOGMENA_VARH_FSRS[1]); // 0.6
      expect(rDiskolo.nea_katastasi.lapses).toBe(0);

      const rKalo = ypologise_epomeni_epanalipsi_fsrs(arxiki, 'kalo', STATHERI_IMEROMINIA);
      expect(rKalo.nea_katastasi.stability).toBe(PROEPILOGMENA_VARH_FSRS[2]); // 2.4
      expect(rKalo.diastima_imeron).toBe(2); // round(2.4)
      expect(rKalo.epomeni_imerominia).toBe('2026-10-03');

      const rEfkolo = ypologise_epomeni_epanalipsi_fsrs(arxiki, 'efkolo', STATHERI_IMEROMINIA);
      expect(rEfkolo.nea_katastasi.stability).toBe(PROEPILOGMENA_VARH_FSRS[3]); // 5.8
      expect(rEfkolo.diastima_imeron).toBe(6); // round(5.8)
      expect(rEfkolo.epomeni_imerominia).toBe('2026-10-07');
    });

    it('η δυσκολία είναι μεγαλύτερη στο Again και μικρότερη στο Easy', () => {
      const arxiki = arxiki_katastasi_fsrs(STATHERI_IMEROMINIA);
      const rAgain = ypologise_epomeni_epanalipsi_fsrs(arxiki, 1, STATHERI_IMEROMINIA);
      const rEasy = ypologise_epomeni_epanalipsi_fsrs(arxiki, 4, STATHERI_IMEROMINIA);

      expect(rAgain.nea_katastasi.difficulty).toBeGreaterThan(rEasy.nea_katastasi.difficulty);
    });
  });

  describe('ypologise_epomeni_epanalipsi_fsrs - Επαναληπτική αξιολόγηση & Interval increase', () => {
    it('αυξάνει το διάστημα επανάληψης στο Good και ακόμα περισσότερο στο Easy', () => {
      const katastasi: FsrsKatastasi = {
        stability: 3.0,
        difficulty: 4.5,
        reps: 2,
        lapses: 0,
        lastReview: '2026-10-01',
      };
      const tora = new Date('2026-10-04T12:00:00Z'); // 3 ημέρες μετά

      const apotelesmaDiskolo = ypologise_epomeni_epanalipsi_fsrs(katastasi, 2, tora);
      const apotelesmaKalo = ypologise_epomeni_epanalipsi_fsrs(katastasi, 3, tora);
      const apotelesmaEfkolo = ypologise_epomeni_epanalipsi_fsrs(katastasi, 4, tora);

      expect(apotelesmaEfkolo.nea_katastasi.stability).toBeGreaterThan(apotelesmaKalo.nea_katastasi.stability);
      expect(apotelesmaKalo.nea_katastasi.stability).toBeGreaterThan(apotelesmaDiskolo.nea_katastasi.stability);

      expect(apotelesmaEfkolo.diastima_imeron).toBeGreaterThan(apotelesmaKalo.diastima_imeron);
      expect(apotelesmaKalo.diastima_imeron).toBeGreaterThanOrEqual(apotelesmaDiskolo.diastima_imeron);
    });

    it('μηδενίζει / μειώνει τη σταθερότητα και αυξάνει τα lapses στο Again (reset on Again)', () => {
      const edraiaKatastasi: FsrsKatastasi = {
        stability: 14.0,
        difficulty: 3.5,
        reps: 4,
        lapses: 0,
        lastReview: '2026-10-01',
      };
      const tora = new Date('2026-10-15T12:00:00Z'); // 14 ημέρες μετά

      const apotelesmaAgain = ypologise_epomeni_epanalipsi_fsrs(edraiaKatastasi, 1, tora);

      // Τα lapses αυξήθηκαν κατά 1
      expect(apotelesmaAgain.nea_katastasi.lapses).toBe(1);
      expect(apotelesmaAgain.nea_katastasi.reps).toBe(5);

      // Η σταθερότητα έπεσε κάτω από την προηγούμενη σταθερότητα
      expect(apotelesmaAgain.nea_katastasi.stability).toBeLessThan(edraiaKatastasi.stability);

      // Το διάστημα επανέρχεται σε 1 ημέρα για άμεση επανάληψη
      expect(apotelesmaAgain.diastima_imeron).toBe(1);
      expect(apotelesmaAgain.epomeni_imerominia).toBe('2026-10-16');
    });

    it('είναι 100% pure και deterministic (ίδια είσοδος → πανομοιότυπη έξοδος)', () => {
      const katastasi: FsrsKatastasi = {
        stability: 5.0,
        difficulty: 4.0,
        reps: 2,
        lapses: 1,
        lastReview: '2026-10-01',
      };
      const tora = new Date('2026-10-06T12:00:00Z');

      const run1 = ypologise_epomeni_epanalipsi_fsrs(katastasi, 'kalo', tora);
      const run2 = ypologise_epomeni_epanalipsi_fsrs(katastasi, 'kalo', tora);

      expect(run1).toEqual(run2);
    });
  });
});
