import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core';
import { DIADROMI_MATHIMATON, fortose_mathimata_apo_apothiki } from './mathimata.js';
import { diadromi_synomilias, fortose_synomilia_apo_apothiki } from './synomilia.js';
import { pseudos_mathimata } from '../pseudomata/index.js';

describe('fortose_mathimata_apo_apothiki', () => {
  it('φορτώνει τη λίστα μαθημάτων από τη ρίζα του §5.3', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(DIADROMI_MATHIMATON, JSON.stringify(pseudos_mathimata()));
    const apokrisis = await fortose_mathimata_apo_apothiki(apothiki);
    expect(apokrisis.katastasi).toBe('etimo');
    if (apokrisis.katastasi === 'etimo') {
      expect(apokrisis.dedomena).toHaveLength(1);
      expect(apokrisis.dedomena[0]?.kodikos).toBe('ΠΛΗ201');
    }
  });

  it('πριν τον πρώτο συγχρονισμό είναι κενή κατάσταση, ποτέ ψεύτικη λίστα', async () => {
    const apokrisis = await fortose_mathimata_apo_apothiki(new MnimiApothiki());
    expect(apokrisis.katastasi).toBe('adeio');
  });

  it('μη-λίστα JSON δίνει MI_EGKYRO_SXIMA', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(DIADROMI_MATHIMATON, JSON.stringify({ oxi: 'lista' }));
    const apokrisis = await fortose_mathimata_apo_apothiki(apothiki);
    expect(apokrisis.katastasi).toBe('sfalma');
    if (apokrisis.katastasi === 'sfalma') {
      expect(apokrisis.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('κενή λίστα είναι κενή κατάσταση', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(DIADROMI_MATHIMATON, '[]');
    const apokrisis = await fortose_mathimata_apo_apothiki(apothiki);
    expect(apokrisis.katastasi).toBe('adeio');
  });
});

describe('fortose_synomilia_apo_apothiki', () => {
  it('διαβάζει το ιστορικό από το JSONL του §5.3 με τη σειρά των γραμμών', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      diadromi_synomilias('ΠΛΗ201', 'en-1'),
      [
        JSON.stringify({ rolos: 'tutor', keimeno: 'Γεια σου' }),
        JSON.stringify({ rolos: 'xristis', keimeno: 'Τι είναι αλγόριθμος;' }),
        JSON.stringify({ rolos: 'tutor', keimeno: 'Η ιδέα της λύσης' }),
      ].join('\n')
    );
    const grammata = await fortose_synomilia_apo_apothiki(apothiki, 'ΠΛΗ201', 'en-1');
    expect(grammata).toHaveLength(3);
    expect(grammata[0]?.rolos).toBe('tutor');
    expect(grammata[2]?.keimeno).toBe('Η ιδέα της λύσης');
  });

  it('απουσία αρχείου σημαίνει άδειο ιστορικό', async () => {
    const grammata = await fortose_synomilia_apo_apothiki(new MnimiApothiki(), 'ΠΛΗ201', 'en-1');
    expect(grammata).toEqual([]);
  });

  it('αγνοεί τις χαλασμένες γραμμές και τα κενά, χωρίς να σκοτώνει τη συνομιλία', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      diadromi_synomilias('ΠΛΗ201', 'en-1'),
      [
        JSON.stringify({ rolos: 'tutor', keimeno: 'έγκυρο' }),
        '{ χαλασμένο json',
        '',
        JSON.stringify({ rolos: 'akros', keimeno: 'άγνωστος ρόλος' }),
      ].join('\n')
    );
    const grammata = await fortose_synomilia_apo_apothiki(apothiki, 'ΠΛΗ201', 'en-1');
    expect(grammata).toHaveLength(1);
    expect(grammata[0]?.keimeno).toBe('έγκυρο');
  });
});
