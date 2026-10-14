import { describe, it, expect } from 'vitest';
import {
  pare_xarti_mathimatos,
  pseudos_xartis,
  lepita_aristeias,
  pososto_aristeias,
} from './pseudomata.js';
import { pseudos_odigos_md, pseudos_synomilia_jsonl } from './odigos-md.js';
import { analise_odigo_md, LEKIKIA_TMIMATON } from '../../src/ypiresies/odigos.js';
import { epikyrose_odigo } from '@dps/core';

describe('pseudomata — χάρτες μαθημάτων', () => {
  const MATHIMATA = ['ΠΛΗ201', 'ΠΛΗ101', 'ΠΛΗ302', 'ΠΛΗ204'] as const;

  it('παράγει πλήρεις χάρτες και για τα 4 μαθήματα με 4 ενότητες το καθένα', () => {
    for (const kodikos of MATHIMATA) {
      const xartis = pare_xarti_mathimatos(kodikos);
      expect(xartis.kodikos_mathimatos).toBe(kodikos);
      expect(xartis.enotites).toHaveLength(4);
      expect(xartis.ekdosi_prompt).toBe('xartis-mock-v1');
      expect(typeof xartis.dimiourgithike).toBe('string');

      for (const enotita of xartis.enotites) {
        expect(enotita.id).toBeTruthy();
        expect(enotita.titlos).toBeTruthy();
        expect(enotita.piges.length).toBeGreaterThan(0);
        expect(enotita.ennoies.length).toBeGreaterThan(0);
        expect(enotita.seira).toBeGreaterThanOrEqual(1);
        expect(enotita.lepta_ektimisi).toBeGreaterThan(0);
        expect(enotita.apodosi_exetasis).toBeGreaterThan(0);
      }
    }
  });

  it('η pare_xarti_mathimatos επιστρέφει ΠΛΗ201 για άγνωστο κωδικό', () => {
    const xartis = pare_xarti_mathimatos('AGNOSTO');
    expect(xartis.kodikos_mathimatos).toBe('ΠΛΗ201');
    expect(xartis.enotites).toHaveLength(4);
  });

  it('η pseudos_xartis διατηρεί 100% συμβατότητα με το ΠΛΗ201', () => {
    const xartis = pseudos_xartis();
    expect(xartis.kodikos_mathimatos).toBe('ΠΛΗ201');
    expect(xartis.enotites.map((e) => e.id)).toEqual(['en-1', 'en-2', 'en-3', 'en-4']);
  });

  it('οι υπολογισμοί λεπτών και ποσοστού αριστείας λειτουργούν σωστά', () => {
    const enotites = pare_xarti_mathimatos('ΠΛΗ101').enotites;
    const synolo = lepita_aristeias(enotites);
    expect(synolo).toBe(60 + 75 + 90 + 90);

    expect(pososto_aristeias(enotites, ['en-ds-1', 'en-ds-2'])).toBe(0.5);
    expect(pososto_aristeias([], [])).toBe(0);
  });
});

describe('odigos-md — οδηγοί μελέτης και για τα 4 μαθήματα', () => {
  const ANAMENOMENA = {
    ΠΛΗ201: ['en-1', 'en-2', 'en-3', 'en-4'],
    ΠΛΗ101: ['en-ds-1', 'en-ds-2', 'en-ds-3', 'en-ds-4'],
    ΠΛΗ302: ['en-db-1', 'en-db-2', 'en-db-3', 'en-db-4'],
    ΠΛΗ204: ['en-arch-1', 'en-arch-2', 'en-arch-3', 'en-arch-4'],
  } as const;

  it('παράγει πλήρες Markdown και για τις 16 ενότητες με και τα 7 τμήματα', () => {
    for (const [kodikos, ids] of Object.entries(ANAMENOMENA)) {
      const xartis = pare_xarti_mathimatos(kodikos);
      for (const enotita_id of ids) {
        const enotita = xartis.enotites.find((e) => e.id === enotita_id);
        expect(enotita).toBeDefined();

        const md = pseudos_odigos_md(enotita_id, kodikos);
        expect(md).not.toBeNull();
        if (md === null || enotita === undefined) {
          continue;
        }

        expect(md).toContain(`# ${enotita.titlos}`);

        const analise = analise_odigo_md(enotita_id, md);
        expect(analise).not.toBeNull();
        if (analise === null) {
          continue;
        }

        expect(Object.keys(analise.tmimata)).toHaveLength(LEKIKIA_TMIMATON.length);
        for (const kleidi of LEKIKIA_TMIMATON) {
          expect(analise.tmimata[kleidi].keimena.length).toBeGreaterThan(0);
          expect(analise.tmimata[kleidi].parapompi).toMatch(/^\[\[arx-\d+/);
        }

        // Επικύρωση μέσω @dps/core
        const epikyrosi = epikyrose_odigo(md, enotita.piges);
        expect(epikyrosi.ok).toBe(true);

        // Αυτοέλεγχος περιέχει ερωτήσεις και απαντήσεις (quiz)
        const autoelegchosKeimena = analise.tmimata.autoelegchos.keimena;
        expect(autoelegchosKeimena.length).toBeGreaterThanOrEqual(2);
        if (kodikos !== 'ΠΛΗ201') {
          for (const k of autoelegchosKeimena) {
            expect(k).toContain('Ερώτηση:');
            expect(k).toContain('Απάντηση:');
          }
        }
      }
    }
  });

  it('η pseudos_odigos_md λειτουργεί και χωρίς παράμετρο kodikos (αυτόματος εντοπισμός)', () => {
    for (const ids of Object.values(ANAMENOMENA)) {
      for (const enotita_id of ids) {
        const md = pseudos_odigos_md(enotita_id);
        expect(md).not.toBeNull();
      }
    }
    expect(pseudos_odigos_md('mh-yparxousa')).toBeNull();
  });

  it('η pseudos_synomilia_jsonl παράγει έγκυρο JSONL tutor για όλες τις ενότητες', () => {
    for (const [kodikos, ids] of Object.entries(ANAMENOMENA)) {
      for (const enotita_id of ids) {
        const jsonl = pseudos_synomilia_jsonl(enotita_id, kodikos);
        expect(jsonl).not.toBeNull();
        if (jsonl === null) {
          continue;
        }
        const parsed = JSON.parse(jsonl.trim());
        expect(parsed.rolos).toBe('tutor');
        expect(parsed.keimeno).toContain('Γεια σου, ρώτα με για την ενότητα');
      }
    }
  });
});
