import { describe, expect, it } from 'vitest';
import {
  ypologise_streak_me_pagwma,
  ypologise_diasosi_streak_blitz,
  type KatastasiStreak,
} from './streak-freeze.js';

describe('ypologise_streak_me_pagwma', () => {
  it('υπολογίζει συνεχόμενο streak όταν ο χρήστης έχει μελετήσει σήμερα και τις προηγούμενες ημέρες', () => {
    const hmerominies = ['2026-10-25', '2026-10-26', '2026-10-27'];
    const pagwmata: string[] = [];
    const simera = '2026-10-27';

    const apotelesma = ypologise_streak_me_pagwma(hmerominies, pagwmata, simera, 2);

    expect(apotelesma.trexwnStreak).toBe(3);
    expect(apotelesma.megistoStreak).toBe(3);
    expect(apotelesma.xrisimopoihmenaTokens).toBe(0);
    expect(apotelesma.kindynosDiakopis).toBe(false);
  });

  it('εντοπίζει κίνδυνο διακοπής όταν ο χρήστης μελέτησε χθες αλλά όχι ακόμα σήμερα', () => {
    const hmerominies = ['2026-10-25', '2026-10-26'];
    const pagwmata: string[] = [];
    const simera = '2026-10-27';

    const apotelesma = ypologise_streak_me_pagwma(hmerominies, pagwmata, simera, 1);

    expect(apotelesma.trexwnStreak).toBe(2);
    expect(apotelesma.kindynosDiakopis).toBe(true);
    expect(apotelesma.xrisimopoihmenaTokens).toBe(0);
  });

  it('χρησιμοποιεί διαθέσιμο freeze token όταν υπάρχει κενή ενδιάμεση ημέρα', () => {
    // 24 και 26 μελέτη, 25 κενή ημέρα
    const hmerominies = ['2026-10-24', '2026-10-26', '2026-10-27'];
    const pagwmata: string[] = [];
    const simera = '2026-10-27';

    const apotelesma = ypologise_streak_me_pagwma(hmerominies, pagwmata, simera, 2);

    expect(apotelesma.trexwnStreak).toBe(4); // 27, 26, 25 (freeze), 24
    expect(apotelesma.xrisimopoihmenaTokens).toBe(1);
    expect(apotelesma.kindynosDiakopis).toBe(false);
  });

  it('διακόπτει το streak αν δεν επαρκούν τα tokens για να καλυφθεί το κενό', () => {
    const hmerominies = ['2026-10-20', '2026-10-26', '2026-10-27'];
    const pagwmata: string[] = [];
    const simera = '2026-10-27';

    // 0 διαθέσιμα tokens, το κενό μεταξύ 20 και 26 είναι τεράστιο
    const apotelesma = ypologise_streak_me_pagwma(hmerominies, pagwmata, simera, 0);

    expect(apotelesma.trexwnStreak).toBe(2); // 27, 26
    expect(apotelesma.xrisimopoihmenaTokens).toBe(0);
    expect(apotelesma.megistoStreak).toBe(2);
  });

  it('αναγνωρίζει ήδη καταγεγραμμένα παγώματα χωρίς να καταναλώνει νέα tokens', () => {
    const hmerominies = ['2026-10-25', '2026-10-27'];
    const pagwmata = ['2026-10-26'];
    const simera = '2026-10-27';

    const apotelesma = ypologise_streak_me_pagwma(hmerominies, pagwmata, simera, 1);

    expect(apotelesma.trexwnStreak).toBe(3);
    expect(apotelesma.xrisimopoihmenaTokens).toBe(0);
  });

  it('διαχειρίζεται κενό ιστορικό με μηδενικό streak', () => {
    const apotelesma = ypologise_streak_me_pagwma([], [], '2026-10-27', 2);
    expect(apotelesma.trexwnStreak).toBe(0);
    expect(apotelesma.megistoStreak).toBe(0);
    expect(apotelesma.xrisimopoihmenaTokens).toBe(0);
    expect(apotelesma.kindynosDiakopis).toBe(false);
  });
});

describe('ypologise_diasosi_streak_blitz', () => {
  const arxikiKatastasi: KatastasiStreak = {
    trexwnStreak: 5,
    megistoStreak: 10,
    xrisimopoihmenaTokens: 0,
    diathesimaTokens: 1,
    kindynosDiakopis: true,
    pagwmenesHmerominies: [],
    teleutaiaImeraMeletis: '2026-10-26',
  };

  it('σώζει το streak και εξουδετερώνει τον κίνδυνο διακοπής όταν το blitz quiz πετύχει', () => {
    const simera = '2026-10-27';
    const neaKatastasi = ypologise_diasosi_streak_blitz(true, simera, arxikiKatastasi);

    expect(neaKatastasi.kindynosDiakopis).toBe(false);
    expect(neaKatastasi.trexwnStreak).toBe(6);
    expect(neaKatastasi.teleutaiaImeraMeletis).toBe(simera);
    expect(neaKatastasi.diathesimaTokens).toBe(1); // Δεν χρεώνεται token
  });

  it('διατηρεί τον κίνδυνο διακοπής όταν το blitz quiz αποτύχει', () => {
    const simera = '2026-10-27';
    const neaKatastasi = ypologise_diasosi_streak_blitz(false, simera, arxikiKatastasi);

    expect(neaKatastasi.kindynosDiakopis).toBe(true);
    expect(neaKatastasi.trexwnStreak).toBe(5);
  });
});
