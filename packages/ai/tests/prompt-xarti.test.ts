import { describe, it, expect } from 'vitest';
import { prompt_xarti, EKDOSI_PROMPT_P2 } from '../src/prompts/index.js';
import { ftiaxe_enotita, ftiaxe_perigramma, ftiaxe_tmima } from './voitheia.js';

function eisodos_xarti() {
  return {
    kodikos_mathimatos: 'PLI101',
    dimiourgithike: '2026-10-09T10:00:00.000Z',
    perigrammata: [
      ftiaxe_perigramma('arx-1', 'Σημειώσεις Δομές', [
        ftiaxe_tmima('Εισαγωγή', 1, 5),
        ftiaxe_tmima('Ορισμοί', 6, 10),
      ]),
      ftiaxe_perigramma('arx-2', 'Διαφάνειες Δομές', [
        ftiaxe_tmima('Λίστες', 3, 7),
      ]),
    ],
  };
}

describe('prompt_xarti (P2)', () => {
  it('επιστρέφει αίτηση με έκδοση prompt p2 και σχήμα XartisMathimatos', () => {
    const aitisi = prompt_xarti(eisodos_xarti());
    expect(aitisi.ekdosi_prompt).toBe('p2@2');
    expect(aitisi.ekdosi_prompt).toBe(EKDOSI_PROMPT_P2);
    const egkyro = aitisi.sisma.safeParse({
      kodikos_mathimatos: 'PLI101',
      enotites: [],
      ekdosi_prompt: EKDOSI_PROMPT_P2,
      dimiourgithike: '2026-10-09T10:00:00.000Z',
    });
    expect(egkyro.success).toBe(true);
  });

  it('το xristis περιέχει τίτλους, εύρη σελίδων, έννοιες και τύπους από κάθε περίγραμμα', () => {
    const { xristis } = prompt_xarti(eisodos_xarti());
    expect(xristis).toContain('Σημειώσεις Δομές');
    expect(xristis).toContain('Διαφάνειες Δομές');
    expect(xristis).toContain('arx-1');
    expect(xristis).toContain('arx-2');
    expect(xristis).toContain('1-5');
    expect(xristis).toContain('6-10');
    expect(xristis).toContain('3-7');
    expect(xristis).toContain('έννοια Εισαγωγή');
    expect(xristis).toContain('έννοια Λίστες');
    expect(xristis).toContain('theoria');
    expect(xristis).toContain('PLI101');
    expect(xristis).toContain('2026-10-09T10:00:00.000Z');
  });

  it('το xristis περιέχει αποκλειστικά πεδία περιγράμματος, όχι κείμενο σελίδων', () => {
    const { xristis } = prompt_xarti(eisodos_xarti());
    expect(xristis).not.toContain('keimeno');
    expect(xristis).not.toContain('arithmos');
    expect(xristis).not.toContain('lekseis');
    expect(xristis).not.toContain('xoris_keimeno');
    expect(xristis).not.toContain('selides:');
  });

  it('το xristis δεν περιέχει ποτέ πλήρες κείμενο σελίδων', () => {
    const perigramma_me_kimeno = {
      ...eisodos_xarti().perigrammata[0],
      keimeno_selidon: 'ΜΗΣΕΝΔΕΤΙΚΟ ΚΕΙΜΕΝΟ ΣΕΛΙΔΑΣ',
    };
    const aitisi = prompt_xarti({
      ...eisodos_xarti(),
      perigrammata: [perigramma_me_kimeno],
    });
    expect(aitisi.xristis).not.toContain('ΜΗΣΕΝΔΕΤΙΚΟ ΚΕΙΜΕΝΟ ΣΕΛΙΔΑΣ');
  });

  it('το σχημα δέχεται ενότητα με id, τίτλο, πηγές και παραπομπές', () => {
    const aitisi = prompt_xarti(eisodos_xarti());
    const apantisi = aitisi.sisma.safeParse({
      kodikos_mathimatos: 'PLI101',
      enotites: [ftiaxe_enotita({ id: 'enotita-1', titlos: 'Λίστες' })],
      ekdosi_prompt: 'p2@2',
      dimiourgithike: '2026-10-09T10:00:00.000Z',
    });
    expect(apantisi.success).toBe(true);
  });

  it('το sistima περιέχει τους κανόνες συγχώνευσης και ισχύος προαπαιτούμενων', () => {
    const { sistima } = prompt_xarti(eisodos_xarti());
    expect(sistima).toContain('Μην επινοείς');
    expect(sistima).toContain('Συγχωνεύεις');
    expect(sistima).toContain('ίδιο θέμα');
    expect(sistima).toContain('proapaitoumenes');
    expect(sistima).toContain('enotita_id');
    expect(sistima).toContain('isxys');
    expect(sistima).toContain('isxyri');
    expect(sistima).toContain('asthenis');
    expect(sistima).toContain('XartisMathimatos');
    expect(sistima).toContain(EKDOSI_PROMPT_P2);
    expect(sistima).toContain('ασφαλές αναγνωριστικό διαδρομής');
  });

  it('το sistima αναφέρει ότι ο αριθμός λεπτών υπολογίζεται έξω από το LLM', () => {
    const { sistima } = prompt_xarti(eisodos_xarti());
    expect(sistima).toContain('lepta_ektimisi');
    expect(sistima).toContain('apodosi_exetasis');
    expect(sistima).toContain('null');
  });

  it('είναι ντετερμινιστικό για πανομοιότυπη είσοδο', () => {
    expect(prompt_xarti(eisodos_xarti())).toEqual(prompt_xarti(eisodos_xarti()));
  });

  it('snapshot P2', () => {
    const aitisi = prompt_xarti(eisodos_xarti());
    expect({
      ekdosi_prompt: aitisi.ekdosi_prompt,
      sistima: aitisi.sistima,
      xristis: aitisi.xristis,
    }).toMatchSnapshot();
  });
});
