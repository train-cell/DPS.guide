import { describe, expect, it } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import { pare_tilemetria_arxeio, katharise_tilemetria } from '../tilemetria/tilemetria.js';
import {
  apothikefse_apodosi,
  diadromi_apodosis,
  diadromi_thematon,
  fortose_apodosi,
  fortose_themata_arxeia,
  ypologise_kai_apothikefse_apodosi,
} from './themata.js';

describe('themata ypiresia — διαδρομές και αρχεία', () => {
  it('επιστρέφει τις σωστές διαδρομές vault', () => {
    expect(diadromi_thematon('PLH101')).toBe('PLH101/themata');
    expect(diadromi_apodosis('PLH101')).toBe('PLH101/apodosi.json');
  });

  it('fortose_themata_arxeia βρίσκει τα διαθέσιμα αρχεία θεμάτων', async () => {
    const apothiki = new MnimiApothiki();
    expect(await fortose_themata_arxeia(apothiki, 'PLH101')).toEqual([]);

    await apothiki.grapse_keimeno('PLH101/themata/2023_fev.pdf', 'dummy pdf');
    await apothiki.grapse_keimeno('PLH101/themata/2024_ioun.pdf', 'dummy pdf');
    await apothiki.grapse_keimeno('PLH101/allo_arxeio.txt', 'other file');

    const arxeia = await fortose_themata_arxeia(apothiki, 'PLH101');
    expect(arxeia).toHaveLength(2);
    expect(arxeia).toContain('PLH101/themata/2023_fev.pdf');
    expect(arxeia).toContain('PLH101/themata/2024_ioun.pdf');
  });
});

describe('themata ypiresia — ανάγνωση και αποθήκευση απόδοσης', () => {
  it('fortose_apodosi επιστρέφει κενό αντικείμενο αν λείπει το αρχείο', async () => {
    const apothiki = new MnimiApothiki();
    const apodosi = await fortose_apodosi(apothiki, 'PLH101');
    expect(apodosi).toEqual({});
  });

  it('fortose_apodosi διαβάζει και αναλύει σωστά το apodosi.json', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      diadromi_apodosis('PLH101'),
      JSON.stringify({ 'en-1': 15, 'en-2': 25 })
    );

    const apodosi = await fortose_apodosi(apothiki, 'PLH101');
    expect(apodosi).toEqual({ 'en-1': 15, 'en-2': 25 });
  });

  it('fortose_apodosi χειρίζεται χαλασμένο JSON επιστρέφοντας κενό αντικείμενο', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(diadromi_apodosis('PLH101'), '{ mh egkyro json');

    const apodosi = await fortose_apodosi(apothiki, 'PLH101');
    expect(apodosi).toEqual({});
  });

  it('apothikefse_apodosi αποθηκεύει σωστά την απόδοση στο vault', async () => {
    const apothiki = new MnimiApothiki();
    const apotelesma = await apothikefse_apodosi(apothiki, 'PLH101', { 'en-1': 30 });
    expect(apotelesma.ok).toBe(true);

    const fortomeno = await fortose_apodosi(apothiki, 'PLH101');
    expect(fortomeno).toEqual({ 'en-1': 30 });
  });
});

describe('themata ypiresia — υπολογισμός και αποθήκευση (50/50 boundary)', () => {
  it('ypologise_kai_apothikefse_apodosi υπολογίζει ντετερμινιστικά και αποθηκεύει', async () => {
    const apothiki = new MnimiApothiki();
    const antistoixiseis = [
      { enotita_id: 'en-1', monades: 10 },
      { enotita_id: 'en-2', monades: 20 },
      { enotita_id: 'en-1', monades: 5 },
    ];

    const apotelesma = await ypologise_kai_apothikefse_apodosi(apothiki, 'PLH101', antistoixiseis);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;

    expect(apotelesma.timi).toEqual({ 'en-1': 15, 'en-2': 20 });

    const apothikevmeno = await fortose_apodosi(apothiki, 'PLH101');
    expect(apothikevmeno).toEqual({ 'en-1': 15, 'en-2': 20 });
  });

  it('ypologise_kai_apothikefse_apodosi απορρίπτει άκυρη είσοδο χωρίς να αποθηκεύσει', async () => {
    const apothiki = new MnimiApothiki();
    const antistoixiseis = [
      { enotita_id: '', monades: 10 },
    ];

    const apotelesma = await ypologise_kai_apothikefse_apodosi(apothiki, 'PLH101', antistoixiseis);
    expect(apotelesma.ok).toBe(false);

    const yparxei = await apothiki.yparxei(diadromi_apodosis('PLH101'));
    expect(yparxei).toBe(false);
  });

  it('ypologise_kai_apothikefse_apodosi καταγράφει τηλεμετρία με me_tilemetria', async () => {
    katharise_tilemetria();
    const apothiki = new MnimiApothiki();
    const antistoixiseis = [{ enotita_id: 'en-1', monades: 10 }];

    await ypologise_kai_apothikefse_apodosi(apothiki, 'PLH101', antistoixiseis);

    const logs = pare_tilemetria_arxeio();
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs[0]?.minima).toBe('[START] ypologise_kai_apothikefse_apodosi');
    expect(logs[1]?.minima).toBe('[SUCCESS] ypologise_kai_apothikefse_apodosi');
    expect(logs[0]?.metadedomena?.['spanId']).toBe(logs[1]?.metadedomena?.['spanId']);
  });
});
