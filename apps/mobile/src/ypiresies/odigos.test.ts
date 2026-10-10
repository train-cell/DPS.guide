import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core';
import {
  LEKIKIA_TMIMATON,
  analise_odigo_md,
  diadromi_odigou,
  fortose_odigo_apo_apothiki,
} from './odigos.js';
import { pseudos_odigos_md } from '../pseudomata/index.js';

/** Σπέρνει έναν ψεύτικο οδηγό στη μνήμη και επιστρέφει την αποθήκη. */
async function apothiki_me_odigo(enotita_id: string): Promise<MnimiApothiki> {
  const apothiki = new MnimiApothiki();
  const md = pseudos_odigos_md(enotita_id);
  if (md !== null) {
    await apothiki.grapse_keimeno(diadromi_odigou('ΠΛΗ201', enotita_id), md);
  }
  return apothiki;
}

describe('analise_odigo_md', () => {
  it('διαβάζει πίσω αναλλοίωτο το Markdown που παράγει ο σπόρος (round-trip)', () => {
    for (const enotita_id of ['en-1', 'en-2', 'en-3', 'en-4']) {
      const md = pseudos_odigos_md(enotita_id);
      expect(md).not.toBeNull();
      const odigos = analise_odigo_md(enotita_id, md ?? '');
      expect(odigos).not.toBeNull();
      if (odigos === null) {
        continue;
      }
      expect(odigos.enotita_id).toBe(enotita_id);
      expect(Object.keys(odigos.tmimata)).toHaveLength(LEKIKIA_TMIMATON.length);
      for (const kleidi of LEKIKIA_TMIMATON) {
        expect(odigos.tmimata[kleidi].keimena.length).toBeGreaterThan(0);
        expect(odigos.tmimata[kleidi].parapompi).toMatch(/^\[\[arx-\d+/);
      }
    }
  });

  it('παίρνει τον τίτλο από την επικεφαλίδα πρώτου επιπέδου', () => {
    const md = pseudos_odigos_md('en-2') ?? '';
    expect(analise_odigo_md('en-2', md)?.titlos).toBe('Μεταβλητές και τύποι');
  });

  it('επιστρέφει null όταν λείπει έστω ένα από τα επτά τμήματα', () => {
    const md = pseudos_odigos_md('en-1') ?? '';
    const xoris_theoria = md.replace(/## 🔬 Θεωρία[\s\S]*?(?=## ⚠️ Παγίδες)/, '');
    expect(analise_odigo_md('en-1', xoris_theoria)).toBeNull();
  });

  it('επιστρέφει null για τμήμα χωρίς παραπομπή ή χωρίς κείμενο', () => {
    const md = pseudos_odigos_md('en-1') ?? '';
    const xoris_parapompi = md.replace('[[arx-1: σ. 3]]', '');
    expect(analise_odigo_md('en-1', xoris_parapompi)).toBeNull();
  });

  it('αγνοεί τις υποεπικεφαλίδες και τα κενά μεταξύ τμημάτων', () => {
    const md = pseudos_odigos_md('en-3') ?? '';
    const me_ypokefalides = md.replace(
      '- Να διαλέγεις ανάμεσα σε if και elif όταν η συνθήκη είναι αμοιβαία αποκληστική.',
      '- Να διαλέγεις ανάμεσα σε if και elif όταν η συνθήκη είναι αμοιβαία αποκληστική.\n### Υποεπικεφαλίδα\n### Άλλη υποεπικεφαλίδα'
    );
    const arxikos = analise_odigo_md('en-3', md);
    const neos = analise_odigo_md('en-3', me_ypokefalides);
    expect(neos?.tmimata.stoxoi.keimena).toEqual(arxikos?.tmimata.stoxoi.keimena);
    expect(neos?.tmimata.stoxoi.keimena).not.toContain('### Υποεπικεφαλίδα');
  });
});

describe('fortose_odigo_apo_apothiki', () => {
  it('φορτώνει τον οδηγό από τα αρχεία του §5.3', async () => {
    const apothiki = await apothiki_me_odigo('en-2');
    const apokrisis = await fortose_odigo_apo_apothiki(apothiki, 'ΠΛΗ201', 'en-2');
    expect(apokrisis.katastasi).toBe('etimo');
    if (apokrisis.katastasi === 'etimo') {
      expect(apokrisis.dedomena.titlos).toBe('Μεταβλητές και τύποι');
      expect(Object.keys(apokrisis.dedomena.tmimata)).toHaveLength(7);
    }
  });

  it('οδηγός που δεν παράχθηκε ακόμη είναι κανονική κενή κατάσταση, όχι σφάλμα', async () => {
    const apokrisis = await fortose_odigo_apo_apothiki(new MnimiApothiki(), 'ΠΛΗ201', 'en-2');
    expect(apokrisis.katastasi).toBe('adeio');
  });

  it('χαλασμένος οδηγός δίνει MI_EGKYRO_SXIMA, ποτέ μισά δεδομένα', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(diadromi_odigou('ΠΛΗ201', 'en-2'), '## 🎯 Στόχοι\n\n- μόνο ένα τμήμα\n');
    const apokrisis = await fortose_odigo_apo_apothiki(apothiki, 'ΠΛΗ201', 'en-2');
    expect(apokrisis.katastasi).toBe('sfalma');
    if (apokrisis.katastasi === 'sfalma') {
      expect(apokrisis.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});

describe('diadromi_odigou', () => {
  it('ακολουθεί το layout §5.3 του κρυφού φακέλου μαθήματος', () => {
    expect(diadromi_odigou('ΠΛΗ201', 'en-1')).toBe('ΠΛΗ201/.spoudes/odigoi/en-1.md');
  });
});
