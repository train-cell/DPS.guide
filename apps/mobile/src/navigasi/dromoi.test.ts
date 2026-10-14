import { describe, expect, it } from 'vitest';
import { diadromi_odigou } from './dromoi.js';

describe('diadromi_odigou', () => {
  it('χτίζει εσωτερική διαδρομή για ασφαλή ids, και για ελληνικά', () => {
    expect(diadromi_odigou('en-2')).toBe('/odigos/en-2');
    expect(diadromi_odigou('Διαφορικός-1')).toBe(`/odigos/${encodeURIComponent('Διαφορικός-1')}`);
    expect(diadromi_odigou('a'.repeat(128))).toBe(`/odigos/${'a'.repeat(128)}`);
  });

  it('απορρίπτει separators, escapes, query/fragment και path traversal', () => {
    for (const id of [
      '\\\\evil.example',
      '/evil.example',
      'en/2',
      'en%2f2',
      'en?next=x',
      'en#fragment',
      '..',
      'a'.repeat(129),
    ]) {
      expect(diadromi_odigou(id)).toBeNull();
    }
  });
});
