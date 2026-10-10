import { describe, expect, it } from 'vitest';
import { ektelese_ergaleio, kanonikopoie_imeronomeni } from '../src/tutor/index.js';
import { ergaleia_mathimatos as toolbox } from './tutor-voitheia.js';

describe('ErgaleiaTutor', () => {
  it('anoixe_selida επιστρέφει το κείμενο της σελίδας και την παραπομπή', () => {
    const apotelesma = toolbox().anoixe_selida({ arxeio_id: 'arx-1', selida: 4 });
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.keimeno).toContain('Ο δείκτης δείχνει');
    expect(apotelesma.timi.parapompi).toEqual({ arxeio_id: 'arx-1', selida: 4 });
    expect(apotelesma.timi.erotisi).toBeNull();
  });

  it('anoixe_selida αποτυγχάνει ρητά όταν η σελίδα δεν υπάρχει', () => {
    const apotelesma = toolbox().anoixe_selida({ arxeio_id: 'arx-1', selida: 77 });
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(apotelesma.sfalma.minima).toContain('77');
  });

  it('anoixe_selida αποτυγχάνει όταν η σελίδα δεν έχει κείμενο', () => {
    const apotelesma = toolbox().anoixe_selida({ arxeio_id: 'arx-2', selida: 9 });
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.minima).toContain('δεν έχει κείμενο');
  });

  it('vres_ennoia βρίσκει ορισμό ανεξάρτητα από πεζογραφία, τόνο και κενά', () => {
    const apotelesma = toolbox().vres_ennoia({ ennoia: '  ΛΊΣΤΑ ' });
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.keimeno).toBe('Λίστα είναι ακολουθία στοιχείων.');
    expect(apotelesma.timi.parapompi).toEqual({ arxeio_id: 'arx-1', selida: 2 });
  });

  it('vres_ennoia αποτυγχάνει όταν ο ορισμός δεν αντιστοιχεί σε ενότητα της ύλης', () => {
    const apotelesma = toolbox().vres_ennoia({ ennoia: 'ξένος όρος' });
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.minima).toContain('δεν αντιστοιχεί σε ενότητα');
  });

  it('vres_ennoia αποτυγχάνει όταν δεν υπάρχει ορισμός', () => {
    const apotelesma = toolbox().vres_ennoia({ ennoia: 'συνέλιξη' });
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('ftiaxe_erotisi επιστρέφει την ερώτηση της ενότητας μαζί με την αναμενόμενη τιμή', () => {
    const apotelesma = toolbox().ftiaxe_erotisi({ enotita_id: 'enotita-1' });
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.erotisi?.apantisi_dekdomeni).toBe('3.14');
    expect(apotelesma.timi.parapompi).toEqual({ arxeio_id: 'arx-1', selida: 4 });
  });

  it('ftiaxe_erotisi αποτυγχάνει σε άγνωστη ενότητα', () => {
    const apotelesma = toolbox().ftiaxe_erotisi({ enotita_id: 'enotita-999' });
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.minima).toContain('enotita-999');
  });

  it('ftiaxe_erotisi αποτυγχάνει σε ενότητα χωρίς διαθέσιμες ερωτήσεις', () => {
    const apotelesma = toolbox().ftiaxe_erotisi({ enotita_id: 'enotita-2' });
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(apotelesma.sfalma.minima).toContain('διαθέσιμη ερώτηση');
  });

  it('kanonikopoie_imeronomeni ενώνει το κείμενο σε NFC και πεζοποιεί το', () => {
    expect(kanonikopoie_imeronomeni('λίστα'.normalize('NFD'))).toBe('λίστα');
    expect(kanonikopoie_imeronomeni('  Δομές \n Δεδομένων  ')).toBe('δομές δεδομένων');
  });
});

describe('ektelese_ergaleio', () => {
  const ergaleia = toolbox();

  it('δρομολογεί την anoixe_selida', () => {
    const apotelesma = ektelese_ergaleio(ergaleia, {
      onoma: 'anoixe_selida',
      arguments: { arxeio_id: 'arx-1', selida: 4 },
    });
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.onoma).toBe('anoixe_selida');
  });

  it('δρομολογεί την vres_ennoia', () => {
    const apotelesma = ektelese_ergaleio(ergaleia, {
      onoma: 'vres_ennoia',
      arguments: { ennoia: 'λίστα' },
    });
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.onoma).toBe('vres_ennoia');
  });

  it('δρομολογεί την ftiaxe_erotisi', () => {
    const apotelesma = ektelese_ergaleio(ergaleia, {
      onoma: 'ftiaxe_erotisi',
      arguments: { enotita_id: 'enotita-1' },
    });
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.onoma).toBe('ftiaxe_erotisi');
  });

  it('απορρίπτει άγνωστο όνομα εργαλείου με ρητό σφάλμα χωρίς εξαίρεση', () => {
    const apotelesma = ektelese_ergaleio(ergaleia, { onoma: 'agios_eis', arguments: {} });
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect((apotelesma.sfalma.aitia as { onoma: string }).onoma).toBe('agios_eis');
  });

  it('απορρίπτει ορίσματα λάθους τύπου', () => {
    const apotelesma = ektelese_ergaleio(ergaleia, {
      onoma: 'anoixe_selida',
      arguments: { arxeio_id: 'arx-1', selida: 'τέσσερα' },
    });
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('απορρίπτει αίτημα που δεν είναι αντικείμενο', () => {
    const apotelesma = ektelese_ergaleio(ergaleia, 'anoixe_selida');
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect((apotelesma.sfalma.aitia as { onoma: string }).onoma).toBe('άγνωστο');
  });

  it('μεταδίδει το σφάλμα του εργαλείου χωρίς να το μετατρέψει σε άλλο', () => {
    const apotelesma = ektelese_ergaleio(ergaleia, {
      onoma: 'vres_ennoia',
      arguments: { ennoia: 'συνέλιξη' },
    });
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });
});