import { describe, it, expect } from 'vitest';
import { prompt_tutor, EKDOSI_PROMPT_P4, MEGISTO_MIKOS_ISTORIKOU } from '../src/prompts/index.js';
import type { LeitourgiaTutor } from '../src/prompts/index.js';
import { ftiaxe_enotita } from './voitheia.js';

const LEITOURGIES: LeitourgiaTutor[] = ['exigisi', 'exetasi_me', 'kathodigisi_askisis'];

function eisodos_tutor(leitourgia: LeitourgiaTutor) {
  return {
    enotita: ftiaxe_enotita(),
    odigos: '## 🎯 Στόχοι\nΝα ξέρεις τι είναι λίστα. [[arx-1:2]]',
    istoriko: [
      { rolos: 'xristis' as const, keimeno: 'Τι είναι λίστα;' },
      { rolos: 'montelo' as const, keimeno: 'Λίστα είναι ακολουθία στοιχείων. [[arx-1:2]]' },
    ],
    leitourgia,
    erotisi: 'Και οι δένδρες;',
  };
}

describe('prompt_tutor (P4)', () => {
  it('επιστρέφει αίτηση με έκδοση prompt p4 και σχήμα απάντηση + παραπομπές', () => {
    const aitisi = prompt_tutor(eisodos_tutor('exigisi'));
    expect(aitisi.ekdosi_prompt).toBe('p4@1');
    expect(aitisi.ekdosi_prompt).toBe(EKDOSI_PROMPT_P4);

    const egkyro = aitisi.sisma.safeParse({
      apantisi: 'Κείμενο απάντησης με παραπομπή [[arx-1:2]].',
      parapompes: [{ arxeio_id: 'arx-1', selida: 2 }],
    });
    expect(egkyro.success).toBe(true);

    const akyro = aitisi.sisma.safeParse({ apantisi: 'χωρίς παραπομπές' });
    expect(akyro.success).toBe(false);
  });

  it('το sistima περιγράφει και τις τρεις λειτουργίες', () => {
    const { sistima } = prompt_tutor(eisodos_tutor('exigisi'));
    for (const leitourgia of LEITOURGIES) {
      expect(sistima).toContain(leitourgia);
    }
  });

  it('η kathodigisi_askisis δίνει υποδείξεις και όχι πλήρη λύση', () => {
    const { sistima } = prompt_tutor(eisodos_tutor('kathodigisi_askisis'));
    expect(sistima).toContain('υποδείξεις');
    expect(sistima).toContain('πλήρη λύση');
    expect(sistima).toContain('ώσπου να το ζητήσει');
  });

  it('απανά «Δεν υπάρχει στο υλικό» όταν κάτι δεν τεκμηριώνεται', () => {
    const { sistima } = prompt_tutor(eisodos_tutor('exigisi'));
    expect(sistima).toContain('Δεν υπάρχει στο υλικό');
  });

  it('δεν βαθμολογεί αριθμητικές απαντήσεις: η σύγκριση γίνεται deterministic', () => {
    const { sistima } = prompt_tutor(eisodos_tutor('exetasi_me'));
    expect(sistima).toContain('ΔΕΝ βαθμολογείς');
    expect(sistima).toContain('deterministic σύγκριση');
    expect(sistima).toContain('δεν μπορώ να επαληθεύσω');
  });

  it('το xristis περιέχει ενότητα, οδηγό, ιστορικό και τρέχουσα ερώτηση', () => {
    const { xristis } = prompt_tutor(eisodos_tutor('exigisi'));
    expect(xristis).toContain('enotita-1');
    expect(xristis).toContain('Δομές δεδομένων');
    expect(xristis).toContain('# # 🎯 Στόχοι');
    expect(xristis).toContain('Τι είναι λίστα;');
    expect(xristis).toContain('Λίστα είναι ακολουθία στοιχείων.');
    expect(xristis).toContain('Και οι δένδρες;');
    expect(xristis).toContain('leitourgia: exigisi');
  });

  it('κάθε λειτουργία εμφανίζεται με τη σειρά της στη δομή της αίτησης', () => {
    const aitisi = prompt_tutor(eisodos_tutor('exetasi_me'));
    expect(aitisi.xristis).toContain('exetasi_me');
    expect(aitisi.xristis).toContain('Και οι δένδρες;');
  });

  it('περιορίζει το ιστορικό στις MEGISTO_MIKOS_ISTORIKOU τελευταίες στροφές', () => {
    const megisto = MEGISTO_MIKOS_ISTORIKOU + 5;
    const istoriko = Array.from({ length: megisto }, (_, i) => ({
      rolos: (i % 2 === 0 ? 'xristis' : 'montelo') as const,
      keimeno: `στροφή-${i}`,
    }));
    const { xristis } = prompt_tutor({ ...eisodos_tutor('exigisi'), istoriko });
    expect(xristis).not.toContain('στροφή-0');
    expect(xristis).toContain(`στροφή-${megisto - 1}`);
  });

  it('είναι ντετερμινιστικό για πανομοιότυπη είσοδο', () => {
    expect(prompt_tutor(eisodos_tutor('exigisi'))).toEqual(prompt_tutor(eisodos_tutor('exigisi')));
    expect(prompt_tutor(eisodos_tutor('exigisi'))).not.toEqual(
      prompt_tutor(eisodos_tutor('exetasi_me'))
    );
  });

  it('snapshot P4', () => {
    const aitisi = prompt_tutor(eisodos_tutor('exigisi'));
    expect({
      ekdosi_prompt: aitisi.ekdosi_prompt,
      sistima: aitisi.sistima,
      xristis: aitisi.xristis,
    }).toMatchSnapshot();
  });
});
