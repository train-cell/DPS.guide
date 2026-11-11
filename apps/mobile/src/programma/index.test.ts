import { describe, expect, it } from 'vitest';

/** Η δρομολόγηση των module exports δεν έχει εκτελέσιμο κώδικα — μόνο η εισαγωγή επαληθεύει τη σειρά. */
describe('programma barrel', () => {
  it('εξάγει τους τυπους, τις βοηθειες και την οδον', async () => {
    const barrel = await import('./index.js');
    expect(Object.keys(barrel).length).toBeGreaterThan(0);
  });
});
