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

  it('portfolio: JSON αντικείμενο (όχι πίνακας) → δεν βρίσκει μαθήματα', () => {
    expect(analysi_portfolio_html(JSON.stringify({ key: 'value' }))).toEqual([]);
  });

  it('portfolio: μη σύνδεσμος μαθήματος → παραλείπεται', () => {
    const html = '<a href="/other/thing/">Αλλού</a>';
    expect(analysi_portfolio_html(html)).toEqual([]);
  });

  it('portfolio: διπλό κωδικό μαθήματος → μόνο μία φορά', () => {
    const html = `
      <a href="/courses/PLI101/">Πρώτος</a>
      <a href="/courses/PLI101/">Δεύτερος</a>
    `;
    expect(analysi_portfolio_html(html).length).toBe(1);
  });

  it('portfolio: base_url διαφορετικό από το VASIKO_URL_ECLASS → χρησιμοποιείται', () => {
    const html = '<a href="/courses/PLI101/">Τίτλος</a>';
    const mathimata = analysi_portfolio_html(html, 'https://other.example.com');
    expect(mathimata[0]?.url).toBe('https://other.example.com/courses/PLI101/');
  });

  it('φάκελος: JSON αντικείμενο (όχι πίνακας) → κενό αποτέλεσμα', () => {
    const res = analysi_fakelou_html(JSON.stringify({ key: 'value' }), 'https://...');
    expect(res.fakeloi.length).toBe(0);
    expect(res.arxeia.length).toBe(0);
  });

  it('φάκελος: JSON με null item → παραλείπεται', () => {
    const res = analysi_fakelou_html(JSON.stringify([null]), 'https://...');
    expect(res.fakeloi.length).toBe(0);
    expect(res.arxeia.length).toBe(0);
  });

  it('φάκελος: JSON με ριζικό φάκελο (diadromi "") → δεν προστίθεται', () => {
    const res = analysi_fakelou_html(
      JSON.stringify([{ typos: 'fakelos', onoma: 'root', diadromi: '' }]),
      'https://...'
    );
    expect(res.fakeloi.length).toBe(0);
  });

  it('φάκελος: JSON με ελλείποντα πεδία → κενά ονόματα/URL', () => {
    const res = analysi_fakelou_html(JSON.stringify([{ typos: 'fakelos' }]), 'https://...');
    expect(res.fakeloi.length).toBe(1);
    expect(res.fakeloi[0]).toEqual({ onoma: '', url: '', rel_path: '' });
  });

  it('φάκελος: JSON με άλλον τύπο → παραλείπεται', () => {
    const res = analysi_fakelou_html(JSON.stringify([{ typos: 'arxeios' }]), 'https://...');
    expect(res.fakeloi.length).toBe(0);
    expect(res.arxeia.length).toBe(0);
  });

  it('φάκελος: JSON με μη αριθμητικό megethos και μη string imerominia', () => {
    const res = analysi_fakelou_html(
      JSON.stringify([
        { typos: 'arxeio', onoma: 'a.pdf', diadromi: 'a.pdf', url: 'https://...', megethos: '100', imerominia: 12345 },
      ]),
      'https://...'
    );
    expect(res.arxeia[0]?.megethos).toBeNull();
    expect(res.arxeia[0]?.imerominia).toBeNull();
  });

  it('φάκελος: JSON με string imerominia → χρησιμοποιείται', () => {
    const res = analysi_fakelou_html(
      JSON.stringify([{ typos: 'arxeio', onoma: 'a.pdf', diadromi: 'a.pdf', url: 'https://...', imerominia: '2025-01-01' }]),
      'https://...'
    );
    expect(res.arxeia[0]?.imerominia).toBe('2025-01-01');
  });

  it('φάκελος: JSON αρχείο με ελλείποντα πεδία → κενά ονόματα/URL', () => {
    const res = analysi_fakelou_html(JSON.stringify([{ typos: 'arxeio' }]), 'https://...');
    expect(res.arxeia.length).toBe(1);
    expect(res.arxeia[0]).toEqual({ onoma: '', url: '', rel_path: '', megethos: null, imerominia: null });
  });

  it('φάκελος: πρώτη προσέγγιση — κενό κείμενο, #, javascript: → παραλείπονται', () => {
    const html = `
      <table>
        <tr><td><a href="/courses/PLI101/document/arxeio.pdf">arxeio.pdf</a></td><td>1 KB</td></tr>
        <tr><td><a href="#anchor">Anchor</a></td></tr>
        <tr><td><a href="javascript:void(0)">JS</a></td></tr>
        <tr><td><a href="/courses/PLI101/document/oudetero">Oudetero</a></td></tr>
        <tr><td>Χωρίς σύνδεσμο</td></tr>
      </table>
    `;
    const res = analysi_fakelou_html(html, 'https://thales.cs.unipi.gr/courses/PLI101/document/');
    expect(res.arxeia.length).toBe(1);
    expect(res.fakeloi.length).toBe(0);
  });

  it('φάκελος: πρώτη προσέγγιση — υποφάκελος σε <tr> με fa-folder', () => {
    const html = `
      <table>
        <tr>
          <td><a href="/courses/PLI101/document/01-fakelos/" class="fa-folder">01-fakelos</a></td>
          <td>1 KB</td>
        </tr>
      </table>
    `;
    const res = analysi_fakelou_html(html, 'https://thales.cs.unipi.gr/courses/PLI101/document/');
    expect(res.fakeloi.length).toBe(1);
    expect(res.fakeloi[0]?.onoma).toBe('01-fakelos');
    expect(res.fakeloi[0]?.rel_path).toBe('01-fakelos/');
  });

  it('φάκελος: πρώτο προσέγγιση — διπλό αρχείο → μόνο μία φορά', () => {
    const html = `
      <table>
        <tr><td><a href="/courses/PLI101/document/a.pdf">a.pdf</a></td><td>1 KB</td></tr>
        <tr><td><a href="/courses/PLI101/document/a.pdf">a.pdf</a></td><td>1 KB</td></tr>
      </table>
    `;
    const res = analysi_fakelou_html(html, 'https://thales.cs.unipi.gr/courses/PLI101/document/');
    expect(res.arxeia.length).toBe(1);
  });

  it('φάκελος: πρώτο προσέγγιση — διπλός φάκελος → μόνο μία φορά', () => {
    const html = `
      <table>
        <tr><td><a href="/courses/PLI101/document/01-fakelos/" class="fa-folder">01-fakelos</a></td><td>1 KB</td></tr>
        <tr><td><a href="/courses/PLI101/document/01-fakelos/" class="fa-folder">01-fakelos</a></td><td>1 KB</td></tr>
      </table>
    `;
    const res = analysi_fakelou_html(html, 'https://thales.cs.unipi.gr/courses/PLI101/document/');
    expect(res.fakeloi.length).toBe(1);
  });

  it('φάκελος: δεύτερη προσέγγιση — σύνδεσμος χωρίς επέκταση → όνομα από URL', () => {
    const html = `
      <div>
        <a href="/courses/PLI101/document/01-fakelos/?openDir=/01-fakelos">01-fakelos</a>
        <a href="/courses/PLI101/document/another-dir/dir=1">another-dir</a>
        <a href="/courses/PLI101/document/arxeio.pdf">oudetero-text</a>
        <a href="/courses/PLI101/document/oudetero">oudetero</a>
      </div>
    `;
    const res = analysi_fakelou_html(html, 'https://thales.cs.unipi.gr/courses/PLI101/document/');
    expect(res.fakeloi.length).toBe(2);
    expect(res.fakeloi[1]?.onoma).toBe('another-dir');
    // η επέκταση είναι στο href όχι στο κείμενο
    expect(res.arxeia.length).toBe(1);
    expect(res.arxeia[0]?.onoma).toBe('arxeio.pdf');
    // ουδέτερο link
    expect(res.arxeia.filter((a) => a.onoma === 'oudetero').length).toBe(0);
  });

  it('φάκελος: δεύτερη προσέγγιση — διπλό αρχείο και διπλό φάκελο → μόνο μία φορά', () => {
    const html = `
      <div>
        <a href="/courses/PLI101/document/a.pdf">a.pdf</a>
        <a href="/courses/PLI101/document/a.pdf">a.pdf</a>
        <a href="/courses/PLI101/document/01-fakelos/">01-fakelos</a>
        <a href="/courses/PLI101/document/01-fakelos/">01-fakelos</a>
      </div>
    `;
    const res = analysi_fakelou_html(html, 'https://thales.cs.unipi.gr/courses/PLI101/document/');
    expect(res.arxeia.length).toBe(1);
    expect(res.fakeloi.length).toBe(1);
  });

  it('φάκελος: απόλυτος σύνδεσμος → επιστρέφεται ως έχει', () => {
    const html = '<a href="https://other.example.com/arxeio.pdf">arxeio.pdf</a>';
    const res = analysi_fakelou_html(html, 'https://thales.cs.unipi.gr/courses/PLI101/document/');
    expect(res.arxeia[0]?.url).toBe('https://other.example.com/arxeio.pdf');
  });

  it('φάκελος: άκυρο base_url → επιστρέφει το href', () => {
    const html = '<a href="/arxeio.pdf">arxeio.pdf</a>';
    const res = analysi_fakelou_html(html, 'not a url');
    expect(res.arxeia[0]?.url).toBe('/arxeio.pdf');
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
