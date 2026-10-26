import { describe, expect, it } from 'vitest';
import type { Enotita } from '../contracts/montela.js';
import type { Checkin } from '../programma/index.js';
import type { ProodhosXristi } from './mastery.js';
import { ypologise_katastasi_mastery } from './mastery.js';

describe('mastery — Knowledge Gap & Mastery Calculation', () => {
  const enotita1: Enotita = {
    id: 'en-1',
    titlos: 'Εισαγωγή και Αρχές',
    piges: [],
    ennoies: ['Έννοια Α', 'Έννοια Β'],
    proapaitoumenes: [],
    seira: 1,
    lepta_ektimisi: 60,
    apodosi_exetasis: 20,
  };

  const enotita2: Enotita = {
    id: 'en-2',
    titlos: 'Δομές Δεδομένων',
    piges: [],
    ennoies: ['Δέντρα'],
    proapaitoumenes: [],
    seira: 2,
    lepta_ektimisi: 40,
    apodosi_exetasis: 30,
  };

  const enotitaXorisEnnoies: Enotita = {
    id: 'en-3',
    titlos: 'Γενική Επανάληψη',
    piges: [],
    ennoies: [],
    proapaitoumenes: [],
    seira: 3,
    lepta_ektimisi: null,
    apodosi_exetasis: null,
  };

  it('επιστρέφει κενό αντικείμενο όταν δεν υπάρχουν ενότητες', () => {
    const apotelesma = ypologise_katastasi_mastery([], [], {});
    expect(apotelesma).toEqual({});
  });

  it('επιστρέφει 0 για ενότητα χωρίς καμία μελέτη ή checkin', () => {
    const apotelesma = ypologise_katastasi_mastery([enotita1], [], {});
    expect(apotelesma['en-1']).toBe(0);
  });

  it('υπολογίζει μερικό σκορ ανάλογα με τα καταγεγραμμένα λεπτά μελέτης', () => {
    const checkins: Checkin[] = [
      {
        enotita_id: 'en-1',
        imerominia: '2026-10-25',
        pragmatika_lepta: 30, // 30/60 λεπτά = 0.5 χρόνος, χωρίς Leitner -> (0.5 * 0.5 + 0.5 * 0) * 100 = 25
        oloklirothike: false,
      },
    ];
    const apotelesma = ypologise_katastasi_mastery([enotita1], checkins, {});
    expect(apotelesma['en-1']).toBe(25);
  });

  it('δίνει πλήρη χρόνο (1.0) όταν η ενότητα είναι στις aristeiesEnotiton', () => {
    const proodos: ProodhosXristi = {
      aristeiesEnotiton: ['en-1'],
      // Χωρίς καταστάσεις μάθησης για έννοιες: einaiOlokliromeni δίνει 0.2 ανά έννοια
      // posostoXronou = 1.0, posostoLeitner = 0.2 -> (0.5 * 1.0 + 0.5 * 0.2) * 100 = 60
    };
    const apotelesma = ypologise_katastasi_mastery([enotita1], [], proodos);
    expect(apotelesma['en-1']).toBe(60);
  });

  it('φτάνει στο 100% όταν η ενότητα έχει ολοκληρωθεί και όλες οι έννοιες είναι στο κουτί 5', () => {
    const proodos: ProodhosXristi = {
      aristeiesEnotiton: ['en-1'],
      katastasiMathisis: [
        { ennoia: 'Έννοια Α', kouti: 5, epomeni_epanalipsi: '2026-11-20', sosta_seiri: 5 },
        { ennoia: 'Έννοια Β', kouti: 5, epomeni_epanalipsi: '2026-11-20', sosta_seiri: 5 },
      ],
    };
    const apotelesma = ypologise_katastasi_mastery([enotita1], [], proodos);
    expect(apotelesma['en-1']).toBe(100);
  });

  it('συνδυάζει σωστά διαφορετικά κουτιά Leitner', () => {
    const proodos: ProodhosXristi = {
      checkins: [
        {
          enotita_id: 'en-1',
          imerominia: '2026-10-26',
          pragmatika_lepta: 60, // 60/60 -> 1.0
          oloklirothike: true,
        },
      ],
      katastasiMathisis: [
        { ennoia: 'Έννοια Α', kouti: 3, epomeni_epanalipsi: '2026-11-01', sosta_seiri: 3 }, // 3/5 = 0.6
        { ennoia: 'Έννοια Β', kouti: 5, epomeni_epanalipsi: '2026-11-20', sosta_seiri: 5 }, // 5/5 = 1.0
        // Μέσος όρος Leitner = 0.8
        // Τελικό = 0.5 * 1.0 + 0.5 * 0.8 = 0.9 -> 90
      ],
    };
    const apotelesma = ypologise_katastasi_mastery([enotita1], [], proodos);
    expect(apotelesma['en-1']).toBe(90);
  });

  it('χειρίζεται ενότητα χωρίς έννοιες (βασίζεται 100% στο χρόνο μελέτης)', () => {
    const checkins: Checkin[] = [
      {
        enotita_id: 'en-3',
        imerominia: '2026-10-26',
        pragmatika_lepta: 15, // lepta_ektimisi default 30 -> 15/30 = 0.5 -> 50%
        oloklirothike: false,
      },
    ];
    const apotelesma = ypologise_katastasi_mastery([enotitaXorisEnnoies], checkins, {});
    expect(apotelesma['en-3']).toBe(50);
  });

  it('όλα τα σκορ παραμένουν αυστηρά εντός του εύρους [0, 100]', () => {
    const checkins: Checkin[] = [
      {
        enotita_id: 'en-2',
        imerominia: '2026-10-26',
        pragmatika_lepta: 500, // Υπερβαίνει κατά πολύ την εκτίμηση των 40 λεπτών
        oloklirothike: true,
      },
    ];
    const proodos: ProodhosXristi = {
      aristeiesEnotiton: ['en-2'],
      katastasiMathisis: [
        { ennoia: 'Δέντρα', kouti: 5, epomeni_epanalipsi: '2026-11-20', sosta_seiri: 10 },
      ],
    };
    const apotelesma = ypologise_katastasi_mastery([enotita2], checkins, proodos);
    expect(apotelesma['en-2']).toBe(100);
    expect(apotelesma['en-2']).toBeLessThanOrEqual(100);
    expect(apotelesma['en-2']).toBeGreaterThanOrEqual(0);
  });
});
