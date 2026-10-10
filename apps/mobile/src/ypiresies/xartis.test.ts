import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core';
import { diadromi_xarti, fortose_xartis_apo_apothiki } from './xartis.js';
import { pseudos_xartis } from '../pseudomata/index.js';

describe('diadromi_xarti', () => {
  it('ακολουθεί το layout §5.3 του κρυφού φακέλου μαθήματος', () => {
    expect(diadromi_xarti('ΠΛΗ201')).toBe('ΠΛΗ201/.spoudes/xartis.json');
  });
});

describe('fortose_xartis_apo_apothiki', () => {
  it('φορτώνει τον χάρτη από τα αρχεία του §5.3', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(diadromi_xarti('ΠΛΗ201'), JSON.stringify(pseudos_xartis()));
    const apokrisis = await fortose_xartis_apo_apothiki(apothiki, 'ΠΛΗ201');
    expect(apokrisis.katastasi).toBe('etimo');
    if (apokrisis.katastasi === 'etimo') {
      expect(apokrisis.dedomena.enotites).toHaveLength(4);
    }
  });

  it('μάθημα χωρίς ανάλυση είναι κανονική κενή κατάσταση, ποτέ ψεύτικος χάρτης', async () => {
    const apokrisis = await fortose_xartis_apo_apothiki(new MnimiApothiki(), 'ΠΛΗ201');
    expect(apokrisis.katastasi).toBe('adeio');
  });

  it('χάρτης χωρίς ενότητες είναι επίσης κενή κατάσταση', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      diadromi_xarti('ΠΛΗ201'),
      JSON.stringify({ ...pseudos_xartis(), enotites: [] })
    );
    const apokrisis = await fortose_xartis_apo_apothiki(apothiki, 'ΠΛΗ201');
    expect(apokrisis.katastasi).toBe('adeio');
  });

  it('χαλασμένο JSON δίνει MI_EGKYRO_SXIMA και όχι κενή οθόνη', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(diadromi_xarti('ΠΛΗ201'), '{ όχι json');
    const apokrisis = await fortose_xartis_apo_apothiki(apothiki, 'ΠΛΗ201');
    expect(apokrisis.katastasi).toBe('sfalma');
    if (apokrisis.katastasi === 'sfalma') {
      expect(apokrisis.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});
