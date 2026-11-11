import { describe, expect, it, vi } from 'vitest';

/** Η απόλυτη διαδρομή του αρχείου εισόδου — τι δίνει ο Node στο `process.argv[1]`. */
const DROMI_TOU_INDEX = '/Users/john_ak/antigarvity/DPS.guide/apps/cli/src/index.ts';

/** Κοινό αντικείμενο ψεύτικων — μοιράζεται ακόμη και μετά από επαναφόρτωση μονάδων. */
const mocks = vi.hoisted(() => ({ trexe_entoles: vi.fn() }));

vi.mock('./eksodiki.js', () => mocks);

/** Επαναφορτώνει το index.ts, ώστε να τρέξει ξανά ο κώδικας διεργασίας στο τέλος του αρχείου. */
async function farei_index(): Promise<typeof import('./index.js')> {
  vi.resetModules();
  return import('./index.js');
}

/** Συλλέγει τις γραμμές που γράφει το index.ts στο stdout/stderr. */
function synollektis(): { grammes: string[]; restore: () => void } {
  const grammes: string[] = [];
  const grapse = (grammi: string): void => {
    grammes.push(grammi);
  };
  const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((grammi: string | Uint8Array) => {
    grapse(String(grammi));
    return true;
  });
  const stderr = vi.spyOn(process.stderr, 'write').mockImplementation((grammi: string | Uint8Array) => {
    grapse(String(grammi));
    return true;
  });
  return {
    grammes,
    restore: () => {
      stdout.mockRestore();
      stderr.mockRestore();
    },
  };
}

describe('index — σημείο εισόδου διεργασίας', () => {
  it('δεν εκτελεί τον dispatcher όταν το αρχείο δεν τρέχει ως εισερχόμενο', async () => {
    const { grammes, restore } = synollektis();
    const mod = await farei_index();
    expect(mod.main).toBeTypeOf('function');
    expect(grammes).toHaveLength(0);
    restore();
  });

  it('δέχεται process.argv[1] = undefined', async () => {
    const { grammes, restore } = synollektis();
    process.argv[1] = undefined as unknown as string;
    const mod = await farei_index();
    expect(mod.main).toBeTypeOf('function');
    expect(grammes).toHaveLength(0);
    process.argv[1] = DROMI_TOU_INDEX;
    restore();
  });

  it('δέχεται άκυρη διαδρομή στο process.argv[1]', async () => {
    const { grammes, restore } = synollektis();
    process.argv[1] = 'invalid url';
    const mod = await farei_index();
    expect(mod.main).toBeTypeOf('function');
    expect(grammes).toHaveLength(0);
    restore();
  });

  it('εκτελεί τον dispatcher όταν το αρχείο τρέχει ως εισερχόμενο', async () => {
    const { grammes, restore } = synollektis();
    process.argv[1] = DROMI_TOU_INDEX;
    mocks.trexe_entoles.mockImplementation(async (_argv, parastates) => {
      // προσομοίωση του πραγματικού dispatcher: η επιτυχία πηγαίνει στο stdout
      parastates.eksodosi.grapse_grammi(JSON.stringify({ ok: true, apotelesma: { eidos: 'allh_dedomena' } }));
      return 0;
    });
    const mod = await farei_index();
    expect(mod.main).toBeTypeOf('function');
    expect(process.exitCode).toBe(0);
    expect(grammes.join('\n')).toContain('"ok":true');
    restore();
  });

  it('στέλνει το σφάλμα χρήσης στο stderr', async () => {
    const { grammes, restore } = synollektis();
    process.argv[1] = DROMI_TOU_INDEX;
    mocks.trexe_entoles.mockImplementation(async (_argv, parastates) => {
      parastates.eksodosi.grapse_sfalma({ kodikos: 'MI_EGKYRO_SXIMA', minima: 'δεν δόθηκε εντολή' });
      return 1;
    });
    const mod = await farei_index();
    expect(mod.main).toBeTypeOf('function');
    expect(process.exitCode).toBe(1);
    expect(grammes.join('\n')).toContain('δεν δόθηκε εντολή');
    restore();
  });

  it('κάνει rejection η οποία χειρίζεται ο δεύτερος χειριστής της.then', async () => {
    const { grammes, restore } = synollektis();
    process.argv[1] = DROMI_TOU_INDEX;
    mocks.trexe_entoles.mockRejectedValue(new Error('ψεύτικη απόρριψη'));
    const mod = await farei_index();
    expect(mod.main).toBeTypeOf('function');
    expect(process.exitCode).toBe(1);
    expect(grammes.join('\n')).toContain('Σφάλμα [AGNOSTO]');
    restore();
  });
});
