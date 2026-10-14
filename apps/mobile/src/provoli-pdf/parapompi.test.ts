import { describe, it, expect } from 'vitest';
import {
  analise_parapompi,
  diadromi_provolis,
  pare_oli_parapompes,
  stilise_parapompi,
  PROTI_SELIDA,
} from './parapompi.js';

describe('analise_parapompi', () => {
  it('διαβάζει τη μορφή [[arxeio_id: σ. N]]', () => {
    expect(analise_parapompi('[[arx-1: σ. 3]]')).toEqual({ arxeio_id: 'arx-1', apo: 3, eos: 3 });
  });

  it('δέν υποχρεώνει τα κενά γύρω από τα άνω-κάτω τετράγωνα', () => {
    expect(analise_parapompi('[[arx-1:σ.3]]')).toEqual({ arxeio_id: 'arx-1', apo: 3, eos: 3 });
    expect(analise_parapompi('[[ arx-2 : σ. 12 ]]')).toEqual({ arxeio_id: 'arx-2', apo: 12, eos: 12 });
  });

  it('δέχεται και τη μεγαλύτερη μορφή «σελ.»', () => {
    expect(analise_parapompi('[[arx-1: σελ. 7]]')).toEqual({ arxeio_id: 'arx-1', apo: 7, eos: 7 });
  });

  it('διαβάζει εύρος σελίδων με dash, παύλα ή ηνωτική παύλα', () => {
    expect(analise_parapompi('[[arx-1: σ. 5–7]]')).toEqual({ arxeio_id: 'arx-1', apo: 5, eos: 7 });
    expect(analise_parapompi('[[arx-1: σ. 5-7]]')).toEqual({ arxeio_id: 'arx-1', apo: 5, eos: 7 });
    expect(analise_parapompi('[[arx-1: σ. 5—7]]')).toEqual({ arxeio_id: 'arx-1', apo: 5, eos: 7 });
  });

  it('βρίσκει την παραπομπή μέσα σε μεγαλύτερο κείμενο', () => {
    expect(analise_parapompi('βλ. υλικό [[arx-2: σ. 19]] για λεπτομέρειες')).toEqual({
      arxeio_id: 'arx-2',
      apo: 19,
      eos: 19,
    });
  });

  it('επιστρέφει null όταν δεν υπάρχει παραπομπή', () => {
    expect(analise_parapompi('απλό κείμενο χωρίς παραπομπή')).toBeNull();
    expect(analise_parapompi('[[arx-1]]')).toBeNull();
    expect(analise_parapompi('[[arx-1: χωρίς αριθμό]]')).toBeNull();
  });

  it('επιστρέφει null για ανέγκυρη σελίδα ή ανεστραμμένο εύρος', () => {
    expect(analise_parapompi('[[arx-1: σ. 0]]')).toBeNull();
    expect(analise_parapompi('[[arx-1: σ. -2]]')).toBeNull();
    expect(analise_parapompi('[[arx-1: σ. 8–3]]')).toBeNull();
  });

  it('η πρώτη σελίδα είναι πάντα 1', () => {
    expect(PROTI_SELIDA).toBe(1);
  });
});

describe('pare_oli_parapompes', () => {
  it('μαζεύει όλες τις παραπομπές με τη σειρά εμφάνισης', () => {
    const keimeno = 'Α [[arx-1: σ. 3]] και [[arx-2: σ. 9–10]] και [[arx-1: σ. 12]] τέλος.';
    expect(pare_oli_parapompes(keimeno)).toEqual([
      { arxeio_id: 'arx-1', apo: 3, eos: 3 },
      { arxeio_id: 'arx-2', apo: 9, eos: 10 },
      { arxeio_id: 'arx-1', apo: 12, eos: 12 },
    ]);
  });

  it('αγνοεί τα ψεύτικα αγκύλια χωρίς αριθμό σελίδας', () => {
    expect(pare_oli_parapompes('[[arx-1]] και [[arx-1: σ. 4]]')).toEqual([
      { arxeio_id: 'arx-1', apo: 4, eos: 4 },
    ]);
  });
});

describe('stilise_parapompi', () => {
  it('γράφει μονή σελίδα και εύρος στην κανονική μορφή', () => {
    expect(stilise_parapompi({ arxeio_id: 'arx-1', apo: 3, eos: 3 })).toBe('[[arx-1: σ. 3]]');
    expect(stilise_parapompi({ arxeio_id: 'arx-1', apo: 5, eos: 7 })).toBe('[[arx-1: σ. 5–7]]');
  });

  it('η εξόδος της διαβάζεται πίσω αναλλοίωτη', () => {
    const arxiki = { arxeio_id: 'arx-2', apo: 9, eos: 10 };
    expect(analise_parapompi(stilise_parapompi(arxiki))).toEqual(arxiki);
  });
});

describe('diadromi_provolis', () => {
  it('χτίζει τη διαδρομή με την πρώτη σελίδα της παραπομπής', () => {
    expect(diadromi_provolis({ arxeio_id: 'arx-1', apo: 3, eos: 7 })).toBe('/provoli/arx-1/3');
  });

  it('κωδικοποιεί ταυτότητες αρχείου με χαρακτήρες URL', () => {
    expect(diadromi_provolis({ arxeio_id: 'arx 1/a', apo: 1, eos: 1 })).toBe('/provoli/arx%201%2Fa/1');
  });

  it('κρατά backslash-looking external URLs σε εσωτερική, κωδικοποιημένη διαδρομή', () => {
    expect(diadromi_provolis({ arxeio_id: '\\\\evil.example', apo: 1, eos: 1 }))
      .toBe('/provoli/%5C%5Cevil.example/1');
  });
});
