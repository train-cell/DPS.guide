import { describe, it, expect } from 'vitest';
import {
  ELAXISTI_KLIMAKA,
  MEGISTI_KLIMAKA,
  antigrafo_dyadikon,
  einai_pdf,
  kilise_klimaka,
} from './pdf-ypiresies.js';

describe('einai_pdf', () => {
  it('αναγνωρίζει την υπογεγραμμένη επικεφαλίδα %PDF', () => {
    expect(einai_pdf(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))).toBe(true);
  });

  it('απορρίπτει κενά, κομμένα και μη-PDF δεδομένα', () => {
    expect(einai_pdf(new Uint8Array([]))).toBe(false);
    expect(einai_pdf(new Uint8Array([0x25, 0x50]))).toBe(false);
    expect(einai_pdf(new TextEncoder().encode('PNG89a...'))).toBe(false);
  });
});

describe('kilise_klimaka', () => {
  it('κρατά έγκυρη κλίμακα όπως δίνεται', () => {
    expect(kilise_klimaka(1.5)).toBe(1.5);
    expect(kilise_klimaka(ELAXISTI_KLIMAKA)).toBe(ELAXISTI_KLIMAKA);
    expect(kilise_klimaka(MEGISTI_KLIMAKA)).toBe(MEGISTI_KLIMAKA);
  });

  it('σφηνώνει τις ακραίες τιμές και πέφτει στο 1 για μη-αριθμό', () => {
    expect(kilise_klimaka(0.01)).toBe(ELAXISTI_KLIMAKA);
    expect(kilise_klimaka(99)).toBe(MEGISTI_KLIMAKA);
    expect(kilise_klimaka(Number.NaN)).toBe(1);
  });
});

describe('antigrafo_dyadikon', () => {
  it('επιστρέφει πίνακα με ίδιο περιεχόμενο και διαφορετική ταυτότητα', () => {
    const arxiko = new Uint8Array([1, 2, 3, 4]);
    const antigrafo = antigrafo_dyadikon(arxiko);
    expect(antigrafo).not.toBe(arxiko);
    expect([...antigrafo]).toEqual([...arxiko]);
  });

  it('το αντίγραφο παραμένει αναλλοίωτο όταν το πρωτότυπο «αδειάζει» (detach του worker)', () => {
    const arxiko = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const antigrafo = antigrafo_dyadikon(arxiko);
    arxiko.fill(0);
    expect([...antigrafo]).toEqual([0x25, 0x50, 0x44, 0x46]);
  });
});
