import { describe, expect, it } from 'vitest';
import {
  parage_akronymio_kai_leikseis,
  kataskevase_prompt_mnemonikou,
  type MnemonikoAitima,
} from './paragwgi-mnemonikou.js';

describe('parage_akronymio_kai_leikseis', () => {
  it('παράγει ακρωνύμιο και σωστή κατανομή για βασικούς όρους', () => {
    const oroi = ['Δίκτυα', 'Πληροφορική', 'Συστήματα'];
    const apotelesma = parage_akronymio_kai_leikseis(oroi);

    expect(apotelesma.akronymio).toBe('ΔΠΣ');
    expect(apotelesma.katanomi).toEqual({
      Δ: ['Δίκτυα'],
      Π: ['Πληροφορική'],
      Σ: ['Συστήματα'],
    });
  });

  it('διαχειρίζεται ελληνικούς τόνους και πεζά γράμματα', () => {
    const oroi = ['άλγοριθμος', 'έννοια', 'όριο', 'υπολογιστής'];
    const apotelesma = parage_akronymio_kai_leikseis(oroi);

    expect(apotelesma.akronymio).toBe('ΑΕΟΥ');
    expect(apotelesma.katanomi.Α).toEqual(['άλγοριθμος']);
    expect(apotelesma.katanomi.Ε).toEqual(['έννοια']);
    expect(apotelesma.katanomi.Ο).toEqual(['όριο']);
    expect(apotelesma.katanomi.Υ).toEqual(['υπολογιστής']);
  });

  it('ομαδοποιεί πολλαπλούς όρους που ξεκινούν με το ίδιο αρχικό γράμμα', () => {
    const oroi = ['Δέντρο', 'Δίκτυο', 'Γράφος'];
    const apotelesma = parage_akronymio_kai_leikseis(oroi);

    expect(apotelesma.akronymio).toBe('ΔΔΓ');
    expect(apotelesma.katanomi.Δ).toEqual(['Δέντρο', 'Δίκτυο']);
    expect(apotelesma.katanomi.Γ).toEqual(['Γράφος']);
  });

  it('αγνοεί περιττά κενά διαστήματα και κενές συμβολοσειρές', () => {
    const oroi = ['  Πίνακας  ', '', '   ', 'Ουρά'];
    const apotelesma = parage_akronymio_kai_leikseis(oroi);

    expect(apotelesma.akronymio).toBe('ΠΟ');
    expect(apotelesma.katanomi).toEqual({
      Π: ['Πίνακας'],
      Ο: ['Ουρά'],
    });
  });

  it('επιστρέφει κενό ακρωνύμιο και κενή κατανομή για άδειο πίνακα εισόδου', () => {
    const apotelesma = parage_akronymio_kai_leikseis([]);
    expect(apotelesma.akronymio).toBe('');
    expect(apotelesma.katanomi).toEqual({});
  });
});

describe('kataskevase_prompt_mnemonikou', () => {
  it('παράγει αυστηρό prompt για είδος akronymio με μηδενικά LLM math hallucinations', () => {
    const aitima: MnemonikoAitima = {
      oroi: ['Δυαδική Αναζήτηση', 'Πολυπλοκότητα', 'Στοίβα'],
      eidos: 'akronymio',
      thema: 'Δομές Δεδομένων',
    };

    const prompt = kataskevase_prompt_mnemonikou(aitima);

    expect(prompt).toContain('DPS Mnemonic Co-Pilot');
    expect(prompt).toContain('ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ');
    expect(prompt).toContain('χωρίς αλλοίωση');
    expect(prompt).toContain('ΑΚΡΩΝΥΜΙΟ ΣΤΟΧΟΣ: ΔΠΣ');
    expect(prompt).toContain('Δυαδική Αναζήτηση');
    expect(prompt).toContain('Πολυπλοκότητα');
    expect(prompt).toContain('Στοίβα');
    expect(prompt).toContain('ΘΕΜΑΤΙΚΟ ΠΛΑΙΣΙΟ: Δομές Δεδομένων');
  });

  it('παράγει εξειδικευμένο prompt για peg_system', () => {
    const aitima: MnemonikoAitima = {
      oroi: ['Πρώτος', 'Δεύτερος', 'Τρίτος'],
      eidos: 'peg_system',
    };

    const prompt = kataskevase_prompt_mnemonikou(aitima);

    expect(prompt).toContain('Peg System');
    expect(prompt).toContain('άγκιστρα');
    expect(prompt).toContain('1. Πρώτος');
    expect(prompt).toContain('2. Δεύτερος');
    expect(prompt).toContain('3. Τρίτος');
  });

  it('παράγει εξειδικευμένο prompt για istoria (narrative chaining)', () => {
    const aitima: MnemonikoAitima = {
      oroi: ['Semaphore', 'Mutex', 'Deadlock'],
      eidos: 'istoria',
      perigrafi_orwn: {
        Deadlock: 'Αδιέξοδο διεργασιών',
      },
    };

    const prompt = kataskevase_prompt_mnemonikou(aitima);

    expect(prompt).toContain('Μνημονική Ιστορία');
    expect(prompt).toContain('Semaphore');
    expect(prompt).toContain('Mutex');
    expect(prompt).toContain('Deadlock');
    expect(prompt).toContain('Αδιέξοδο διεργασιών');
  });
});
