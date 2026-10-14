import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import {
  diadromi_eurethriou,
  diadromi_arxeiou,
  fortose_eurethrio,
  fortose_pdf,
  kilise_selida,
} from './provoli-ypiresies.js';
import { ftiaxe_synthetiko_pdf } from '../../test-fixtures/synthetiko-pdf.js';
import type { Arxeio } from '@dps/core';

/** Φτιάχνει ένα ευρετήριο με δύο αρχεία και τα bytesof τους σε in-memory αποθήκευση. */
async function ftiaxe_apothiki_me_arxeia(): Promise<MnimiApothiki> {
  const apothiki = new MnimiApothiki();
  const eurethrio: Arxeio[] = [
    {
      id: 'arx-1',
      kodikos_mathimatos: 'PLI201',
      diadromi: 'PLI201/arxeia/syntheta/arx-1.pdf',
      url: 'https://thales.cs.unipi.gr/courses/PLI201/arx-1.pdf',
      megethos: null,
      imerominia: null,
      etag: null,
      sha256: null,
      diplotypo_tou: 'pdf',
    },
  ];
  await apothiki.grapse_keimeno(diadromi_eurethriou('PLI201'), JSON.stringify(eurethrio));
  await apothiki.grapse_dyadiko('PLI201/arxeia/syntheta/arx-1.pdf', ftiaxe_synthetiko_pdf(3));
  return apothiki;
}

describe('diadromi_eurethriou', () => {
  it('ακολουθεί το layout §5.3 του κρυφού φακέλου μαθήματος', () => {
    expect(diadromi_eurethriou('PLI201')).toBe('PLI201/.spoudes/eurethrio-arxeion.json');
  });
});

describe('fortose_eurethrio', () => {
  it('διαβάζει τα αρχεία ενός μαθήματος', async () => {
    const apothiki = await ftiaxe_apothiki_me_arxeia();
    const eurethrio = await fortose_eurethrio(apothiki, 'PLI201');
    expect(eurethrio.ok).toBe(true);
    if (eurethrio.ok) {
      expect(eurethrio.timi.map((a) => a.id)).toEqual(['arx-1']);
    }
  });

  it('missing ευρετήριο σημαίνει κενή λίστα, όχι σφάλμα', async () => {
    const eurethrio = await fortose_eurethrio(new MnimiApothiki(), 'PLI201');
    expect(eurethrio.ok).toBe(true);
    if (eurethrio.ok) {
      expect(eurethrio.timi).toHaveLength(0);
    }
  });

  it('χαλασμένο ευρετήριο δίνει MI_EGKYRO_SXIMA και όχι ψεύτικα δεδομένα', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(diadromi_eurethriou('PLI201'), '{ όχι λίsta');
    const eurethrio = await fortose_eurethrio(apothiki, 'PLI201');
    expect(eurethrio.ok).toBe(false);
    if (!eurethrio.ok) {
      expect(eurethrio.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});

describe('diadromi_arxeiou', () => {
  it('βρίσκει τη διαδρομή από το ευρετήριο', async () => {
    const apothiki = await ftiaxe_apothiki_me_arxeia();
    const diadromi = await diadromi_arxeiou(apothiki, 'PLI201', 'arx-1');
    expect(diadromi.ok).toBe(true);
    if (diadromi.ok) {
      expect(diadromi.timi).toBe('PLI201/arxeia/syntheta/arx-1.pdf');
    }
  });

  it('άγνωστο id δίνει DEN_VRETHIKE', async () => {
    const apothiki = await ftiaxe_apothiki_me_arxeia();
    const diadromi = await diadromi_arxeiou(apothiki, 'PLI201', 'den-yparxei');
    expect(diadromi.ok).toBe(false);
    if (!diadromi.ok) {
      expect(diadromi.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });
});

describe('fortose_pdf', () => {
  it('επιστρέφει τα byteof του αρχείου', async () => {
    const apothiki = await ftiaxe_apothiki_me_arxeia();
    const dyadiko = await fortose_pdf(apothiki, 'PLI201', 'arx-1');
    expect(dyadiko.ok).toBe(true);
    if (dyadiko.ok) {
      expect(new TextDecoder('latin1').decode(dyadiko.timi).startsWith('%PDF-1.4')).toBe(true);
    }
  });

  it('άγνωστο αρχείο δίνει DEN_VRETHIKE, ποτέ κενό αρχείο', async () => {
    const dyadiko = await fortose_pdf(new MnimiApothiki(), 'PLI201', 'arx-1');
    expect(dyadiko.ok).toBe(false);
    if (!dyadiko.ok) {
      expect(dyadiko.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });
});

describe('kilise_selida', () => {
  it('κρατά έγκυρη σελίδα όπως δίνεται', () => {
    expect(kilise_selida(3, 12)).toBe(3);
    expect(kilise_selida(12, 12)).toBe(12);
  });

  it('σφηνώνει την πρώτη και την τελευταία σελίδα', () => {
    expect(kilise_selida(0, 12)).toBe(1);
    expect(kilise_selida(-5, 12)).toBe(1);
    expect(kilise_selida(99, 12)).toBe(12);
  });

  it('σε άκυρο σύνολο σελίδων πέφτει στην πρώτη', () => {
    expect(kilise_selida(4, 0)).toBe(1);
    expect(kilise_selida(Number.NaN, 12)).toBe(1);
  });

  it('κόβει τα δεκαδικά αντί να απορρίπτει', () => {
    expect(kilise_selida(3.9, 12)).toBe(3);
  });
});
