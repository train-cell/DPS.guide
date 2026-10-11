import { describe, it, expect } from 'vitest';
import {
  metatropi_megethous_se_bytes,
  analysi_portfolio_html,
  analysi_fakelou_html,
} from '../../src/crawl/parsing-html.js';

describe('parsing-html (L15)', () => {
  it('μετατρέπει ποικίλες μορφές μεγέθους σε bytes', () => {
    expect(metatropi_megethous_se_bytes(null)).toBeNull();
    expect(metatropi_megethous_se_bytes('')).toBeNull();
    expect(metatropi_megethous_se_bytes('-')).toBeNull();
    expect(metatropi_megethous_se_bytes('invalid')).toBeNull();
    expect(metatropi_megethous_se_bytes('1024')).toBe(1024);
    expect(metatropi_megethous_se_bytes('1024 bytes')).toBe(1024);
    expect(metatropi_megethous_se_bytes('2.5 KB')).toBe(Math.round(2.5 * 1024));
    expect(metatropi_megethous_se_bytes('1,8 MB')).toBe(Math.round(1.8 * 1024 * 1024));
    expect(metatropi_megethous_se_bytes('1 GB')).toBe(1024 * 1024 * 1024);
  });

  it('αναλύει portfolio με ποικίλους συνδέσμους και φιλτράρει συστημικούς', () => {
    const html = `
      <div>
        <a href="/courses/PLI101/">Μάθημα Πληροφορικής</a>
        <a href="/courses/MAIN/">System Main</a>
        <a href="/courses/PLI101/logout">Logout Link</a>
        <a href="/courses/ANA100/"></a>
      </div>
    `;
    const mathimata = analysi_portfolio_html(html);
    expect(mathimata.length).toBe(2);
    expect(mathimata[0]?.kodikos).toBe('PLI101');
    expect(mathimata[0]?.titlos).toBe('Μάθημα Πληροφορικής');
    expect(mathimata[1]?.kodikos).toBe('ANA100');
    expect(mathimata[1]?.titlos).toBe('Μάθημα ANA100');
  });

  it('αναλύει portfolio με JSON μορφή', () => {
    const json = JSON.stringify([
      { kodikos: 'PLI101', titlos: 'Τίτλος', url: 'https://...', epilegmeno: true },
    ]);
    const mathimata = analysi_portfolio_html(json);
    expect(mathimata.length).toBe(1);
    expect(mathimata[0]?.kodikos).toBe('PLI101');
  });

  it('αναλύει φάκελο με JSON μορφή', () => {
    const json = JSON.stringify([
      { typos: 'fakelos', onoma: '01', diadromi: '01/', url: 'https://...' },
      { typos: 'arxeio', onoma: 'a.pdf', diadromi: 'a.pdf', url: 'https://...', megethos: 100, imerominia: null },
    ]);
    const res = analysi_fakelou_html(json, 'https://...');
    expect(res.fakeloi.length).toBe(1);
    expect(res.arxeia.length).toBe(1);
  });

  it('αναλύει φάκελο με απλούς συνδέσμους <a> (χωρίς πίνακα <tr>)', () => {
    const html = `
      <div>
        <a href="/courses/PLI101/document/arxeio.pdf">arxeio.pdf</a>
        <a href="/courses/PLI101/document/01-fakelos/?openDir=/01-fakelos">01-fakelos</a>
        <a href="/courses/PLI101/document/02-fakelos/">02-fakelos</a>
        <a href="#anchor">Anchor</a>
        <a href="javascript:void(0)">JS</a>
        <a href="/courses/PLI101/document/parentDir">..</a>
      </div>
    `;
    const res = analysi_fakelou_html(html, 'https://thales.cs.unipi.gr/courses/PLI101/document/');
    expect(res.arxeia.length).toBe(1);
    expect(res.arxeia[0]?.onoma).toBe('arxeio.pdf');
    expect(res.fakeloi.length).toBe(2);
    expect(res.fakeloi[0]?.onoma).toBe('01-fakelos');
    expect(res.fakeloi[1]?.onoma).toBe('02-fakelos');
  });
});
