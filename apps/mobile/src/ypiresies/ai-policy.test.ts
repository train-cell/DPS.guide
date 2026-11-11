import { describe, expect, it, vi } from 'vitest';
import { ok, apotyxia } from '@dps/core';
import type { ApothikiPyli } from '@dps/core';
import { course_ai_policy_path, read_course_gemini_opt_in, write_course_gemini_opt_in } from './ai-policy.js';

describe('ai-policy.ts — διαδρομές και ανάγνωση', () => {
  it('υπολογίζει τη σωστή διαδρομή πολιτικής', () => {
    expect(course_ai_policy_path('PLH101')).toBe('504c48313031/.spoudes/rytheseis-ai.json');
  });

  it('επιστρέφει false όταν λείπει το αρχείο', async () => {
    const apothiki: ApothikiPyli = {
      diavase_keimeno: vi.fn(async () => ({ ok: false, sfalma: { kodikos: 'DEN_VRETHIKE', minima: 'Δεν βρέθηκε' } })),
      grapse_keimeno: vi.fn(),
      diavase_dyadiko: vi.fn(),
      grapse_dyadiko: vi.fn(),
      yparxei: vi.fn(),
      lista: vi.fn(),
      diagrafi: vi.fn(),
    };

    expect(await read_course_gemini_opt_in(apothiki, 'PLH101')).toBe(false);
  });

  it('επιστρέφει false όταν το JSON είναι χαλασμένο', async () => {
    const apothiki: ApothikiPyli = {
      diavase_keimeno: vi.fn(async () => ({ ok: true, timi: '{ mh egkyro json' })),
      grapse_keimeno: vi.fn(),
      diavase_dyadiko: vi.fn(),
      grapse_dyadiko: vi.fn(),
      yparxei: vi.fn(),
      lista: vi.fn(),
      diagrafi: vi.fn(),
    };

    expect(await read_course_gemini_opt_in(apothiki, 'PLH101')).toBe(false);
  });

  it('χρησιμοποιεί το κενό courseCode ως _unknown', () => {
    expect(course_ai_policy_path('')).toBe('5f756e6b6e6f776e/.spoudes/rytheseis-ai.json');
    expect(course_ai_policy_path('  ')).toBe('5f756e6b6e6f776e/.spoudes/rytheseis-ai.json');
    expect(course_ai_policy_path('PLH101')).toBe('504c48313031/.spoudes/rytheseis-ai.json');
  });

  it('επιστρέφει false όταν δεν είναι αντικείμενο με version 1 και geminiOptIn', async () => {
    const apothiki: ApothikiPyli = {
      diavase_keimeno: vi.fn(async () => ({ ok: true, timi: JSON.stringify({ version: 1 }) })),
      grapse_keimeno: vi.fn(),
      diavase_dyadiko: vi.fn(),
      grapse_dyadiko: vi.fn(),
      yparxei: vi.fn(),
      lista: vi.fn(),
      diagrafi: vi.fn(),
    };

    expect(await read_course_gemini_opt_in(apothiki, 'PLH101')).toBe(false);
  });

  it('επιστρέφει true όταν είναι ενεργή η επιλογή', async () => {
    const apothiki: ApothikiPyli = {
      diavase_keimeno: vi.fn(async () => ({
        ok: true,
        timi: JSON.stringify({ version: 1, geminiOptIn: true, updatedAt: new Date().toISOString() }),
      })),
      grapse_keimeno: vi.fn(),
      diavase_dyadiko: vi.fn(),
      grapse_dyadiko: vi.fn(),
      yparxei: vi.fn(),
      lista: vi.fn(),
      diagrafi: vi.fn(),
    };

    expect(await read_course_gemini_opt_in(apothiki, 'PLH101')).toBe(true);
  });
});

describe('ai-policy.ts — γραφή πολιτικής', () => {
  it('πετάει σφάλμα όταν αποτύχει η γραφή', async () => {
    const apothiki: ApothikiPyli = {
      diavase_keimeno: vi.fn(),
      grapse_keimeno: vi.fn(async () => ({ ok: false, sfalma: { kodikos: 'DEN_VRETHIKE', minima: 'Δεν γράφτηκε' } })),
      diavase_dyadiko: vi.fn(),
      grapse_dyadiko: vi.fn(),
      yparxei: vi.fn(),
      lista: vi.fn(),
      diagrafi: vi.fn(),
    };

    await expect(write_course_gemini_opt_in(apothiki, 'PLH101', true)).rejects.toThrow(
      'Δεν γράφτηκε'
    );
  });

  it('επιτυχής γραφή', async () => {
    const apothiki: ApothikiPyli = {
      diavase_keimeno: vi.fn(),
      grapse_keimeno: vi.fn(async () => ok(undefined)),
      diavase_dyadiko: vi.fn(),
      grapse_dyadiko: vi.fn(),
      yparxei: vi.fn(),
      lista: vi.fn(),
      diagrafi: vi.fn(),
    };

    await write_course_gemini_opt_in(apothiki, 'PLH101', true);
    expect(apothiki.grapse_keimeno).toHaveBeenCalledWith(
      course_ai_policy_path('PLH101'),
      expect.stringContaining('"geminiOptIn":true')
    );
  });
});
