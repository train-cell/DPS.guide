import { describe, it, expect } from 'vitest';
import { arxikopoiisi_mathisis, katagrafe_apotelesma, asthenis_ennoies } from './index.js';

describe('arxikopoiisi_mathisis', () => {
  it('starts every concept in box 1 with review tomorrow', () => {
    const res = arxikopoiisi_mathisis(['a', 'b'], '2026-10-12');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.timi).toEqual([
      { ennoia: 'a', kouti: 1, epomeni_epanalipsi: '2026-10-13', sosta_seiri: 0 },
      { ennoia: 'b', kouti: 1, epomeni_epanalipsi: '2026-10-13', sosta_seiri: 0 },
    ]);
  });

  it('rejects duplicate or empty concepts', () => {
    expect(arxikopoiisi_mathisis(['a', 'a'], '2026-10-12').ok).toBe(false);
    expect(arxikopoiisi_mathisis([''], '2026-10-12').ok).toBe(false);
    expect(arxikopoiisi_mathisis(['  '], '2026-10-12').ok).toBe(false);
  });

  it('rejects an invalid date', () => {
    for (const imerominia of ['oxi-mera', '2026-13-01', '2026-02-30', '2026-10-32']) {
      const res = arxikopoiisi_mathisis(['a'], imerominia);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    }
  });
});

describe('katagrafe_apotelesma', () => {
  it('advances the box on a correct answer', () => {
    const arxi = arxikopoiisi_mathisis(['a'], '2026-10-12');
    expect(arxi.ok).toBe(true);
    if (!arxi.ok) return;
    const res = katagrafe_apotelesma(arxi.timi, 'a', true, '2026-10-13');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.timi[0]).toEqual({ ennoia: 'a', kouti: 2, epomeni_epanalipsi: '2026-10-16', sosta_seiri: 1 });
  });

  it('caps at box 5', () => {
    let katastasi = arxikopoiisi_mathisis(['a'], '2026-10-12');
    expect(katastasi.ok).toBe(true);
    if (!katastasi.ok) return;
    for (let i = 0; i < 10; i += 1) {
      const epomeni = katagrafe_apotelesma(katastasi.timi, 'a', true, '2026-10-13');
      expect(epomeni.ok).toBe(true);
      if (!epomeni.ok) return;
      katastasi = epomeni;
    }
    expect(katastasi.timi[0]?.kouti).toBe(5);
    expect(katastasi.timi[0]?.epomeni_epanalipsi).toBe('2026-11-12');
    expect(katastasi.timi[0]?.sosta_seiri).toBe(10);
  });

  it('resets to box 1 on a wrong answer', () => {
    let katastasi = arxikopoiisi_mathisis(['a'], '2026-10-12');
    expect(katastasi.ok).toBe(true);
    if (!katastasi.ok) return;
    const sosto = katagrafe_apotelesma(katastasi.timi, 'a', true, '2026-10-13');
    expect(sosto.ok).toBe(true);
    if (!sosto.ok) return;
    const lathos = katagrafe_apotelesma(sosto.timi, 'a', false, '2026-10-16');
    expect(lathos.ok).toBe(true);
    if (!lathos.ok) return;
    expect(lathos.timi[0]).toEqual({ ennoia: 'a', kouti: 1, epomeni_epanalipsi: '2026-10-17', sosta_seiri: 0 });
  });

  it('does not mutate the input or touch other concepts', () => {
    const arxi = arxikopoiisi_mathisis(['a', 'b'], '2026-10-12');
    expect(arxi.ok).toBe(true);
    if (!arxi.ok) return;
    const snapshot = JSON.parse(JSON.stringify(arxi.timi));
    const res = katagrafe_apotelesma(arxi.timi, 'a', true, '2026-10-13');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(arxi.timi).toEqual(snapshot);
    expect(res.timi[1]).toEqual(snapshot[1]);
  });

  it('rejects an unknown concept', () => {
    const arxi = arxikopoiisi_mathisis(['a'], '2026-10-12');
    expect(arxi.ok).toBe(true);
    if (!arxi.ok) return;
    const res = katagrafe_apotelesma(arxi.timi, 'fantasma', true, '2026-10-13');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('rejects an invalid date', () => {
    const arxi = arxikopoiisi_mathisis(['a'], '2026-10-12');
    expect(arxi.ok).toBe(true);
    if (!arxi.ok) return;
    expect(katagrafe_apotelesma(arxi.timi, 'a', true, 'pote').ok).toBe(false);
  });

  it('is deterministic', () => {
    const arxi = arxikopoiisi_mathisis(['a', 'b'], '2026-10-12');
    expect(arxi.ok).toBe(true);
    if (!arxi.ok) return;
    const ena = katagrafe_apotelesma(arxi.timi, 'a', true, '2026-10-13');
    const dyo = katagrafe_apotelesma(arxi.timi, 'a', true, '2026-10-13');
    expect(dyo).toEqual(ena);
  });
});

describe('asthenis_ennoies', () => {
  it('returns concepts in boxes 1-2 sorted', () => {
    const arxi = arxikopoiisi_mathisis(['b', 'a', 'c'], '2026-10-12');
    expect(arxi.ok).toBe(true);
    if (!arxi.ok) return;
    const vima1 = katagrafe_apotelesma(arxi.timi, 'a', true, '2026-10-13');
    expect(vima1.ok).toBe(true);
    if (!vima1.ok) return;
    const vima2 = katagrafe_apotelesma(vima1.timi, 'a', true, '2026-10-16');
    expect(vima2.ok).toBe(true);
    if (!vima2.ok) return;
    expect(asthenis_ennoies(vima2.timi)).toEqual(['b', 'c']);
  });
});
