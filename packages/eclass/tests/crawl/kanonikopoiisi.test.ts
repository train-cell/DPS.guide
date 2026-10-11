import { describe, it, expect } from 'vitest';
import {
  kanonikopoiise_diadromi,
  pare_epiktasi,
  einai_epitrepomeni_epiktasi,
  ypervainei_orio_megethous,
  ftiaxe_arxeio_id,
  hash_periexomenou,
} from '../../src/crawl/kanonikopoiisi.js';
import { MEGISTO_MEGETHOS_ARXEIOU_BYTES } from '../../src/statheres.js';

describe('kanonikopoiisi (L15)', () => {
  it('κανονικοποιεί έγκυρες διαδρομές αρχείων και φακέλων', () => {
    const res1 = kanonikopoiise_diadromi('01-theoria/slides.pdf');
    expect(res1.ok).toBe(true);
    if (res1.ok) {
      expect(res1.timi).toBe('01-theoria/slides.pdf');
    }

    const res2 = kanonikopoiise_diadromi('01-theoria/fakelos/');
    expect(res2.ok).toBe(true);
    if (res2.ok) {
      expect(res2.timi).toBe('01-theoria/fakelos/');
    }
  });

  it('απορρίπτει κενή διαδρομή', () => {
    const res = kanonikopoiise_diadromi('   ');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('απορρίπτει διαδρομή με «..»', () => {
    const res = kanonikopoiise_diadromi('fakelos/../secret.txt');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('απορρίπτει διαδρομή χωρίς έγκυρα τμήματα', () => {
    const res = kanonikopoiise_diadromi('///.');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('αντικαθιστά απαγορευμένους χαρακτήρες', () => {
    const res = kanonikopoiise_diadromi('fakelos/file:test*name?.pdf');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBe('fakelos/file_test_name_.pdf');
    }
  });

  it('εξάγει επεκτάσεις αρχείων', () => {
    expect(pare_epiktasi('doc.pdf')).toBe('pdf');
    expect(pare_epiktasi('folder/doc.PPTX')).toBe('pptx');
    expect(pare_epiktasi('no_extension')).toBe('');
  });

  it('ελέγχει allowlist επεκτάσεων κατά §8', () => {
    expect(einai_epitrepomeni_epiktasi('pdf')).toBe(true);
    expect(einai_epitrepomeni_epiktasi('zip')).toBe(true);
    expect(einai_epitrepomeni_epiktasi('exe')).toBe(false);
    expect(einai_epitrepomeni_epiktasi('sh')).toBe(false);
  });

  it('ελέγχει όριο μεγέθους 100 MB', () => {
    expect(ypervainei_orio_megethous(null)).toBe(false);
    expect(ypervainei_orio_megethous(1000)).toBe(false);
    expect(ypervainei_orio_megethous(MEGISTO_MEGETHOS_ARXEIOU_BYTES)).toBe(false);
    expect(ypervainei_orio_megethous(MEGISTO_MEGETHOS_ARXEIOU_BYTES + 1)).toBe(true);
  });

  it('υπολογίζει σταθερό arxeio_id και content hash', () => {
    const id = ftiaxe_arxeio_id('PLI101', 'slides.pdf');
    expect(id).toMatch(/^[a-f0-9]{64}$/);

    const data = new TextEncoder().encode('Test');
    const hash = hash_periexomenou(data);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
