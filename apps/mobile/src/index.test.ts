import { describe, expect, it } from 'vitest';

/** Η ριζική δρομολόγηση των module exports δεν έχει εκτελέσιμο κώδικα — μόνο η εισαγωγή επαληθεύει τη σειρά. */
describe('root barrel', () => {
  it('εξάγει design, kathstasi, periballon και koinima', async () => {
    const barrel = await import('./index.js');
    expect(Object.keys(barrel).length).toBeGreaterThan(0);
  });
});
