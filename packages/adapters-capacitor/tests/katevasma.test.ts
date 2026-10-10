import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';
import { CapacitorKatevasmaPyli } from '../src/storage/katevasma.js';

const h = vi.hoisted(() => ({
  arxeia: new Set<string>(),
  kliseis: [] as string[],
}));

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Documents: 'DOCUMENTS' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: {
    mkdir: vi.fn(async () => {
      h.kliseis.push('mkdir');
    }),
    getUri: vi.fn(async (opts: { path: string }) => {
      h.kliseis.push(`getUri:${opts.path}`);
      return { uri: `file://${opts.path}` };
    }),
    stat: vi.fn(async (opts: { path: string }) => {
      h.kliseis.push(`stat:${opts.path}`);
      if (!h.arxeia.has(opts.path)) {
        throw Object.assign(new Error('does not exist'), { code: 'OS-PLUG-FILE-0008' });
      }
      return { type: 'file', size: 42, mtime: 0, ctime: 0, uri: `file://${opts.path}` };
    }),
    deleteFile: vi.fn(async (opts: { path: string }) => {
      h.kliseis.push(`deleteFile:${opts.path}`);
      h.arxeia.delete(opts.path);
    }),
  },
}));

vi.mock('@capacitor/file-transfer', () => ({
  FileTransfer: {
    downloadFile: vi.fn(async (opts: { path: string }) => {
      h.kliseis.push(`downloadFile:${opts.path}`);
      // Το native γράφει στο πλήρες URI· το stat του plugin δέχεται σχετική διαδρομή.
      h.arxeia.add(opts.path.replace(/^file:\/\//, ''));
    }),
  },
}));

describe('CapacitorKatevasmaPyli', () => {
  beforeEach(() => {
    h.arxeia.clear();
    h.kliseis.length = 0;
    vi.mocked(FileTransfer.downloadFile).mockClear();
  });

  it('κατεβάζει και επιστρέφει το μέγεθος από το stat του plugin', async () => {
    const pyli = new CapacitorKatevasmaPyli('');
    const apotelesma = await pyli.katevase(
      'https://thales.cs.unipi.gr/modules/document/file.php/PLI101/slides.pdf',
      'PLI101/slides.pdf',
      {}
    );
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.megethos).toBe(42);
    }
    const zitoumeno = vi.mocked(FileTransfer.downloadFile).mock.calls[0]?.[0] as { path?: string; method?: string };
    expect(zitoumeno.method).toBe('GET');
    expect(zitoumeno.path).toBe('file://PLI101/slides.pdf');
  });

  it('δημιουργεί τον φάκελο προορισμού πριν τη λήψη', async () => {
    const pyli = new CapacitorKatevasmaPyli('');
    await pyli.katevase('https://thales.cs.unipi.gr/a.pdf', 'PLI101/a.pdf', {});
    expect(h.kliseis[0]).toBe('mkdir');
  });

  it('προ-ακυρωμένο σήμα → AKYROTHIKE χωρίς λήψη', async () => {
    const pyli = new CapacitorKatevasmaPyli('');
    const apotelesma = await pyli.katevase(
      'https://thales.cs.unipi.gr/a.pdf',
      'a.pdf',
      {},
      AbortSignal.abort()
    );
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AKYROTHIKE');
    }
    expect(vi.mocked(FileTransfer.downloadFile)).not.toHaveBeenCalled();
  });

  it('άκυρο URL → MI_EGKYRO_SXIMA', async () => {
    const pyli = new CapacitorKatevasmaPyli('');
    const apotelesma = await pyli.katevase('ftp://thales/a.pdf', 'a.pdf', {});
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('μη http/https πρωτόκολλο → MI_EGKYRO_SXIMA', async () => {
    const pyli = new CapacitorKatevasmaPyli('');
    const apotelesma = await pyli.katevase('file:///a.pdf', 'a.pdf', {});
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('HTTP status σφάλμα → DEN_VRETHIKE και σβήνει το μερικό αρχείο', async () => {
    h.arxeia.add('PLI101/a.pdf');
    vi.mocked(FileTransfer.downloadFile).mockImplementationOnce(async () => {
      throw Object.assign(new Error('download failed'), { data: { httpStatus: 404 } });
    });
    const pyli = new CapacitorKatevasmaPyli('');
    const apotelesma = await pyli.katevase(
      'https://thales.cs.unipi.gr/modules/document/file.php/PLI101/a.pdf',
      'PLI101/a.pdf',
      {}
    );
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
      expect(apotelesma.sfalma.minima).toContain('404');
    }
    expect(h.arxeia.has('PLI101/a.pdf')).toBe(false);
  });

  it('αποτυχία δικτύου χωρίς status → DIKTYO', async () => {
    vi.mocked(FileTransfer.downloadFile).mockImplementationOnce(async () => {
      throw new Error('offline');
    });
    const pyli = new CapacitorKatevasmaPyli('');
    const apotelesma = await pyli.katevase('https://thales.cs.unipi.gr/a.pdf', 'a.pdf', {});
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
    }
  });

  it('άκυρη διαδρομή προορισμού (..) → σφάλμα', async () => {
    const pyli = new CapacitorKatevasmaPyli('');
    const apotelesma = await pyli.katevase('https://thales.cs.unipi.gr/a.pdf', '../a.pdf', {});
    expect(apotelesma.ok).toBe(false);
    expect(vi.mocked(FileTransfer.downloadFile)).not.toHaveBeenCalled();
  });

  it('η ρίζα προτάσσεται στη διαδρομή του plugin', async () => {
    const pyli = new CapacitorKatevasmaPyli('DPS.guide');
    await pyli.katevase('https://thales.cs.unipi.gr/a.pdf', 'a.pdf', {});
    const zitoumeno = vi.mocked(FileTransfer.downloadFile).mock.calls[0]?.[0] as { path?: string };
    expect(zitoumeno.path).toBe('file://DPS.guide/a.pdf');
  });
});
