import { describe, it, expect } from 'vitest';
import { karnikopoise_diadromi } from '../src/storage/diadromes.js';

describe('path normalization (§5.3 rules)', () => {
  it('accepts a simple relative path', () => {
    const res = karnikopoise_diadromi('mathimata.json');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBe('mathimata.json');
    }
  });

  it('keeps nested greek directories', () => {
    const res = karnikopoise_diadromi('PLI101/αρχεία/σημειώσεις.pdf');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBe('PLI101/αρχεία/σημειώσεις.pdf');
    }
  });

  it('normalizes to Unicode NFC', () => {
    const decomposed = '\u03B1\u0301.txt';
    const res = karnikopoise_diadromi(decomposed);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.normalize('NFC')).toBe(res.timi);
      expect(res.timi).toBe('\u03AC.txt');
    }
  });

  it('rejects .. traversal', () => {
    const res = karnikopoise_diadromi('../diadromi.txt');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('rejects nested .. traversal', () => {
    const res = karnikopoise_diadromi('PLI101/../../rgpd.txt');
    expect(res.ok).toBe(false);
  });

  it('treats backslash as forbidden character, not a separator', () => {
    const res = karnikopoise_diadromi('..\\rgpd.txt');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBe('.._rgpd.txt');
    }
  });

  it('rejects empty path', () => {
    const res = karnikopoise_diadromi('');
    expect(res.ok).toBe(false);
  });

  it('sanitizes forbidden characters / \\ : * ? " < > |', () => {
    const res = karnikopoise_diadromi('a:b*c?d"e<f>g|h\\i');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBe('a_b_c_d_e_f_g_h_i');
    }
  });

  it('is idempotent for already normalized paths', () => {
    const prwto = karnikopoise_diadromi('PLI101/αρχεία/α.pdf');
    const deutero = prwto.ok ? karnikopoise_diadromi(prwto.timi) : prwto;
    expect(deutero).toEqual(prwto);
  });

  it('rejects Windows reserved device names', () => {
    for (const onoma of ['CON', 'NUL', 'COM1', 'LPT9']) {
      const res = karnikopoise_diadromi(onoma);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    }
  });

  it('rejects reserved names case-insensitively, with extension, or as nested segment', () => {
    for (const onoma of ['con', 'Nul', 'com1.txt', 'fakelos/LPT9.log']) {
      const res = karnikopoise_diadromi(onoma);
      expect(res.ok).toBe(false);
    }
  });

  it('rejects segments ending in a dot or a space', () => {
    for (const onoma of ['arxeio.', 'arxeio ', 'fakelos/arxeio.', 'fakelos/arxeio ']) {
      const res = karnikopoise_diadromi(onoma);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    }
  });

  it('accepts normal names that only contain reserved substrings', () => {
    for (const onoma of ['console.txt', 'com10.log', 'lpt10', 'nulos', 'CONNECT/arxeio']) {
      expect(karnikopoise_diadromi(onoma).ok).toBe(true);
    }
  });
});
