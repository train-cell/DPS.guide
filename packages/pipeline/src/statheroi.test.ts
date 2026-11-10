import { describe, expect, it } from 'vitest';
import {
  arxeio_apodosis,
  arxeio_eurethriou,
  arxeio_keimenou,
  arxeio_meta_odigou,
  arxeio_odigou,
  arxeio_perigrammatos,
  arxeio_proodhou,
  arxeio_synomilias,
  arxeio_xarti,
  KATALYMMA_ARXEION,
  KATALYMMA_KACHE_LLM,
  KATALYMMA_ODIGON,
  KATALYMMA_KEIMENON,
  KATALYMMA_PERIGRAMMATON,
  KATALYMMA_YPOKEIMENON,
  KATALYMMA_SYNOMILION,
  me_riza,
  proorismos_kache_llm,
} from './statheroi.js';

describe('statheroi — διαδρομές αρχείων', () => {
  it('δίνει τις διαδρομές που ορίζονται στο §5.3', () => {
    expect(arxeio_proodhou('PLI101')).toBe('PLI101/proodhos.json');
    expect(arxeio_eurethriou('PLI101')).toBe(`PLI101/${KATALYMMA_YPOKEIMENON}/eurethrio-arxeion.json`);
    expect(arxeio_xarti('PLI101')).toBe(`PLI101/${KATALYMMA_YPOKEIMENON}/xartis.json`);
    expect(arxeio_keimenou('PLI101', 'arx-1')).toBe(`PLI101/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_KEIMENON}/arx-1.json`);
    expect(arxeio_perigrammatos('PLI101', 'arx-1')).toBe(
      `PLI101/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_PERIGRAMMATON}/arx-1.json`
    );
    expect(arxeio_odigou('PLI101', 'enot-1')).toBe(`PLI101/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_ODIGON}/enot-1.md`);
    expect(arxeio_meta_odigou('PLI101', 'enot-1')).toBe(
      `PLI101/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_ODIGON}/enot-1.meta.json`
    );
    expect(arxeio_synomilias('PLI101', 'enot-1')).toBe(
      `PLI101/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_SYNOMILION}/enot-1.jsonl`
    );
    expect(proorismos_kache_llm('PLI101')).toBe(`PLI101/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_KACHE_LLM}`);
    expect(arxeio_apodosis('PLI101')).toBe(`PLI101/${KATALYMMA_YPOKEIMENON}/apodosi.json`);
  });

  it('περιέχει όλα τα σταθερά φάκελα', () => {
    expect(KATALYMMA_YPOKEIMENON).toBe('.spoudes');
    expect(KATALYMMA_ARXEION).toBe('arxeia');
    expect(KATALYMMA_PERIGRAMMATON).toBe('perigrammata');
    expect(KATALYMMA_KEIMENON).toBe('keimeno');
    expect(KATALYMMA_ODIGON).toBe('odigoi');
    expect(KATALYMMA_SYNOMILION).toBe('synomilies');
    expect(KATALYMMA_KACHE_LLM).toBe('cache/llm');
  });

  it('προσθέτει και αφαιρεί τη ρίζα', () => {
    expect(me_riza('', 'arxeia/x.pdf')).toBe('arxeia/x.pdf');
    expect(me_riza('.spoudes', 'arxeia/x.pdf')).toBe('.spoudes/arxeia/x.pdf');
  });
});
