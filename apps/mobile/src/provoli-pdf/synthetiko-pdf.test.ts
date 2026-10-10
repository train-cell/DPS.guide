import { describe, it, expect } from 'vitest';
import {
  ftiaxe_synthetiko_pdf,
  ELAXISTES_SELIDES_SYNTHETIKOU,
  MEGISTES_SELIDES_SYNTHETIKOU,
} from './synthetiko-pdf.js';

/** Διαβάζει το PDF ως κείμενο· το συνθετικό είναι ASCII, άρα το decode είναι πιστό. */
function se_keimeno(dyadiko: Uint8Array): string {
  return new TextDecoder('latin1').decode(dyadiko);
}

describe('ftiaxe_synthetiko_pdf', () => {
  it('ξεκινάει με την υπογεγραμμένη επικεφαλίδα PDF', () => {
    expect(se_keimeno(ftiaxe_synthetiko_pdf(1)).startsWith('%PDF-1.4')).toBe(true);
  });

  it('περιέχει τον ζητούμενο αριθμό σελίδων στο δέντρο σελίδων', () => {
    expect(se_keimeno(ftiaxe_synthetiko_pdf(12))).toContain('/Count 12');
    expect(se_keimeno(ftiaxe_synthetiko_pdf(12))).toContain('(page 12 of 12) Tj');
  });

  it('το startxref δείχνει στον πίνακα xref με μια καταχώριση ανά αντικείμενο', () => {
    const keimeno = se_keimeno(ftiaxe_synthetiko_pdf(4));
    const theseiXref = Number(/startxref\n(\d+)/.exec(keimeno)?.[1]);
    expect(Number.isFinite(theseiXref)).toBe(true);
    expect(keimeno.slice(theseiXref, theseiXref + 4)).toBe('xref');
    const tmimaXref = keimeno.slice(theseiXref);
    expect(tmimaXref).toContain('xref\n0 12\n');
    expect([...tmimaXref.matchAll(/^(\d{10}) 00000 n $/gm)]).toHaveLength(11);
  });

  it('κάθε καταχώριση xref ταιριάζει με την πραγματική θέση του αντικειμένου', () => {
    const keimeno = se_keimeno(ftiaxe_synthetiko_pdf(3));
    const arxiXref = keimeno.indexOf('xref\n');
    const tmimaXref = keimeno.slice(arxiXref);
    const eggrafes = [...tmimaXref.matchAll(/^(\d{10}) 00000 n $/gm)].map((t) => Number(t[1]));
    expect(eggrafes).toHaveLength(9);
    eggrafes.forEach((thesei, i) => {
      expect(keimeno.slice(thesei, thesei + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`);
    });
  });

  it('κλείνει με trailer, μεγέθους και %%EOF', () => {
    const keimeno = se_keimeno(ftiaxe_synthetiko_pdf(2));
    expect(keimeno).toContain('/Root 1 0 R');
    expect(keimeno.trimEnd().endsWith('%%EOF')).toBe(true);
  });

  it('το /Length κάθε ροής ισούται με τα byteof του περιεχομένου της', () => {
    const keimeno = se_keimeno(ftiaxe_synthetiko_pdf(2));
    const roes = [...keimeno.matchAll(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g)];
    expect(roes).toHaveLength(2);
    for (const roe of roes) {
      expect(roe[2]).toHaveLength(Number(roe[1]));
    }
  });

  it('δηλώνει ρητά ότι είναι συνθετικό, ώστε να μην μοιάζει με πραγματικό υλικό', () => {
    const keimeno = se_keimeno(ftiaxe_synthetiko_pdf(1));
    expect(keimeno).toContain('synthetic test file');
    expect(keimeno).toContain('not course material');
  });

  it('περιορίζει τον αριθμό σελίδων στα αποδεκτά όρια', () => {
    expect(se_keimeno(ftiaxe_synthetiko_pdf(0))).toContain(`/Count ${ELAXISTES_SELIDES_SYNTHETIKOU}`);
    expect(se_keimeno(ftiaxe_synthetiko_pdf(9_999))).toContain(`/Count ${MEGISTES_SELIDES_SYNTHETIKOU}`);
    expect(se_keimeno(ftiaxe_synthetiko_pdf(2.7))).toContain('/Count 2');
  });
});
