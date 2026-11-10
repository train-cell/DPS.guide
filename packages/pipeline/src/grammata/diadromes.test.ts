import { describe, expect, it } from 'vitest';
import { ektekseven_arxeio, karnikopoiese_diadromi } from './diadromes.js';

describe('karnikopoiese_diadromi', () => {
  it('κλασική περίπτωση', () => {
    const res = karnikopoiese_diadromi('01-εισαγωγή/σημειώσεις.pdf');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi).toBe('01-εισαγωγή/σημειώσεις.pdf');
  });

  it('κανονικοποίηση με NFC', () => {
    const res = karnikopoiese_diadromi('01-εισαγωγή/σημειώσεις.pdf');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi).toBe('01-εισαγωγή/σημειώσεις.pdf');
  });

  it('απαγορεύμενοι χαρακτήρες', () => {
    const res = karnikopoiese_diadromi('01/εισαγωγή\\σημ.:εικ.png');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi).toBe('01/εισαγωγή_σημ._εικ.png');
  });

  it('κενή διαδρομή -> MI_EGKYRO_SXIMA', () => {
    const res = karnikopoiese_diadromi('');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('διαδρομή χωρίς τμήματα -> MI_EGKYRO_SXIMA', () => {
    const res = karnikopoiese_diadromi('///');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('απαγορεύεται το .. -> MI_EGKYRO_SXIMA', () => {
    const res = karnikopoiese_diadromi('01/../2/εισαγωγή.pdf');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('ektekseven_arxeio', () => {
  it('επέκταση', () => {
    expect(ektekseven_arxeio('01-εισαγωγή/σημειώσεις.pdf')).toBe('pdf');
  });

  it('χωρίς επέκταση -> κενό (L42 false)', () => {
    expect(ektekseven_arxeio('01-εισαγωγή/README')).toBe('');
  });

  it('μόνο ο φάκελος -> κενό', () => {
    expect(ektekseven_arxeio('01-εισαγωγή/')).toBe('');
  });
});
