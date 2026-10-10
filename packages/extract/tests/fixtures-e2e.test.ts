import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { exagage_pdf } from '../src/pdf/index.js';
import { exagage_docx, exagage_pptx } from '../src/office/index.js';

const RIZA_FIXTURES = path.resolve(__dirname, '../../../fixtures');

function yparxei(arxeio: string): boolean {
  return fs.existsSync(path.join(RIZA_FIXTURES, arxeio));
}

function diavase(arxeio: string): Uint8Array {
  return new Uint8Array(fs.readFileSync(path.join(RIZA_FIXTURES, arxeio)));
}

/**
 * End-to-end επαλήθευση πάνω στα ΣΥΝΘΕΤΙΚΑ fixtures που παράγει το
 * `scripts/make-fixtures/`. Τα fixtures μπαίνουν στο repo μόνο αφού προστεθεί
 * η εξαίρεση στο `.gitignore` (docs/requests/C1.md, αίτημα 8)· μέχρι τότε τα
 * tests παραλείπονται χωρίς αποτυχία.
 */
describe('fixtures end-to-end (L05/L06)', () => {
  it.skipIf(!yparxei('pdf/notosans-tria-selides.pdf'))(
    'exagage_pdf πάνω στο συνθετικό PDF fixture',
    async () => {
      const res = await exagage_pdf(diavase('pdf/notosans-tria-selides.pdf'), 'fix-pdf');
      expect(res.ok).toBe(true);
      if (!res.ok) {
        return;
      }
      expect(res.timi.map((s) => s.arithmos)).toEqual([1, 2, 3]);
      expect(res.timi[0]?.lekseis).toBeGreaterThanOrEqual(5);
      expect(res.timi[0]?.keimeno).toContain('δομές δεδομένων');
      expect(res.timi[2]?.keimeno).toContain('δυαδικού δέντρου');
      expect(res.timi[1]?.xoris_keimeno).toBe(true);
    }
  );

  it.skipIf(!yparxei('office/slides-tessera.pptx'))(
    'exagage_pptx πάνω στο συνθετικό PPTX fixture',
    async () => {
      const res = await exagage_pptx(diavase('office/slides-tessera.pptx'), 'fix-pptx');
      expect(res.ok).toBe(true);
      if (!res.ok) {
        return;
      }
      expect(res.timi.map((s) => s.arithmos)).toEqual([1, 2, 3, 4]);
      expect(res.timi[0]?.keimeno).toContain('δομές δεδομένων');
      expect(res.timi[2]?.xoris_keimeno).toBe(true);
    }
  );

  it.skipIf(!yparxei('office/enotites-tria.docx'))(
    'exagage_docx πάνω στο συνθετικό DOCX fixture (ενότητες ανά επικεφαλίδα)',
    async () => {
      const res = await exagage_docx(diavase('office/enotites-tria.docx'), 'fix-docx');
      expect(res.ok).toBe(true);
      if (!res.ok) {
        return;
      }
      expect(res.timi).toHaveLength(3);
      expect(res.timi[0]?.keimeno).toContain('Άλγεβρα');
      expect(res.timi[1]?.keimeno).toContain('πίνακες αληθείας');
      expect(res.timi[2]?.keimeno).toContain('παραδείγματα');
      expect(res.timi[0]?.keimeno).not.toContain('πίνακες');
    }
  );
});
