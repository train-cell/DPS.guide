import { describe, expect, it } from 'vitest';

/** Η δρομολόγηση των module exports δεν έχει εκτελέσιμο κώδικα — μόνο η εισαγωγή επαληθεύει τη σειρά. */
describe('design barrel', () => {
  it('εξάγει τα xromata, τα eikonidia-panepistimion και τα themata', async () => {
    const barrel = await import('./index.js');
    expect(Object.keys(barrel).length).toBeGreaterThan(0);
  });
});
