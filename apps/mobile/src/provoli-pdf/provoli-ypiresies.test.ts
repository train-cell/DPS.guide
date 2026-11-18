import { describe, expect, it, vi } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import { apotyxia, ok } from '@dps/core';
import { diadromi_arxeiou, fortose_eurethrio, fortose_pdf, kilise_selida } from './provoli-ypiresies.js';

describe('provoli-ypiresies.ts — ευρετήριο αρχείων', () => {
  it('επιστρέφει κενή λίστα όταν λείπει το ευρετήριο', async () => {
    const apothiki = new MnimiApothiki();

    expect(await fortose_eurethrio(apothiki, 'PLH101')).toEqual(ok([]));
  });

  it('επιστρέφει σφάλμα MI_EGKYRO_SXIMA όταν το ευρετήριο δεν είναι λίστα', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('PLH101/.spoudes/eurethrio-arxeion.json', JSON.stringify({ id: '1' }));

    const apotelesma = await fortose_eurethrio(apothiki, 'PLH101');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(apotelesma.sfalma.minima).toBe('Το ευρετήριο αρχείων δεν είναι λίστα.');
    }
  });

  it('επιστρέφει σφάλμα MI_EGKYRO_SXIMA όταν το JSON δεν είναι έγκυρο', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('PLH101/.spoudes/eurethrio-arxeion.json', '{ mh egkyro json');

    const apotelesma = await fortose_eurethrio(apothiki, 'PLH101');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(apotelesma.sfalma.minima).toBe('Το ευρετήριο αρχείων δεν είναι έγκυρο JSON.');
    }
  });
});

describe('provoli-ypiresies.ts — διαδρομή αρχείου', () => {
  it('δεν βρίσκει άγνωστο αρχείο', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      'PLH101/.spoudes/eurethrio-arxeion.json',
      JSON.stringify([{ id: '1', diadromi: 'a.pdf' }])
    );

    const apotelesma = await diadromi_arxeiou(apothiki, 'PLH101', 'agnosto');
    expect(apotelesma.ok).toBe(false);
  });

  it('επιστρέφει το σφάλμα του ευρετηρίου όταν το ευρετήριο είναι χαλασμένο', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('PLH101/.spoudes/eurethrio-arxeion.json', '{ mh egkyro json');

    const apotelesma = await diadromi_arxeiou(apothiki, 'PLH101', '1');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});

describe('provoli-ypiresies.ts — φόρτωση PDF', () => {
  it('επιστρέφει σφάλμα όταν δεν ανοίγει το αρχείο', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      'PLH101/.spoudes/eurethrio-arxeion.json',
      JSON.stringify([{ id: '1', diadromi: 'a.pdf' }])
    );
    await apothiki.grapse_dyadiko('a.pdf', new Uint8Array([0, 1]));
    vi.spyOn(apothiki, 'diavase_dyadiko').mockResolvedValue(
      apotyxia('DEN_VRETHIKE', 'Το αρχείο δεν βρέθηκε.')
    );

    const apotelesma = await fortose_pdf(apothiki, 'PLH101', '1');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
      expect(apotelesma.sfalma.minima).toContain('δεν ανοίγει');
    }
  });

  it('φορτώνει αρχείο από τη διαδρομή ${kodikos_mathimatos}/arxeia/diadromi', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      'PLH101/.spoudes/eurethrio-arxeion.json',
      JSON.stringify([{ id: 'pdf-1', diadromi: 'dialexeis/theoria.pdf' }])
    );
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    await apothiki.grapse_dyadiko('PLH101/arxeia/dialexeis/theoria.pdf', pdfBytes);

    const res = await fortose_pdf(apothiki, 'PLH101', 'pdf-1');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual(pdfBytes);
    }
  });
});

describe('provoli-ypiresies.ts — διευθέτηση σελίδας', () => {
  it('δέν δέχεται σελίδα κάτω του 1', () => {
    expect(kilise_selida(0, 10)).toBe(1);
    expect(kilise_selida(-3, 10)).toBe(1);
    expect(kilise_selida(NaN, 10)).toBe(1);
    expect(kilise_selida(Infinity, 10)).toBe(1);
  });

  it('δέν δέχεται μη τελικό πλήθος σελίδων', () => {
    expect(kilise_selida(1, NaN)).toBe(1);
    expect(kilise_selida(1, Infinity)).toBe(1);
  });

  it('κόβει στο μέγιστο αν ζητηθεί σελίδα πάνω από το τέλος', () => {
    expect(kilise_selida(5, 3)).toBe(3);
    expect(kilise_selida(100, 3)).toBe(3);
  });

  it('επιστρέφει την ίδια σελίδα όταν είναι μέσα στα όρια', () => {
    expect(kilise_selida(1, 1)).toBe(1);
    expect(kilise_selida(3, 10)).toBe(3);
  });
});

describe('provoli-ypiresies.ts — φόρτωση PDF', () => {
  it('επιστρέφει το σφάλμα ευρετηρίου όταν το ευρετήριο είναι χαλασμένο', async () => {
    const apothiki = {
      diavase_keimeno: vi.fn().mockResolvedValue(
        ok(JSON.stringify({ id: '1', diadromi: 'a.pdf' }))
      ),
      grapse_keimeno: vi.fn().mockResolvedValue(undefined),
      diavase_dyadiko: vi.fn().mockResolvedValue(undefined),
      grapse_dyadiko: vi.fn().mockResolvedValue(undefined),
      yparxei: vi.fn().mockResolvedValue(false),
      lista: vi.fn().mockResolvedValue(undefined),
      diagrafi: vi.fn().mockResolvedValue(undefined),
    };

    const apotelesma = await fortose_pdf(apothiki as any, 'PLH101', '1');

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('επιστρέφει τα byteof όταν υπάρχει το αρχείο', async () => {
    const apothiki = {
      diavase_keimeno: vi.fn().mockResolvedValue(
        ok(JSON.stringify([{ id: '1', diadromi: 'a.pdf' }]))
      ),
      grapse_keimeno: vi.fn().mockResolvedValue(undefined),
      diavase_dyadiko: vi.fn().mockResolvedValue(ok(new Uint8Array([0x25, 0x50, 0x44, 0x46]))),
      grapse_dyadiko: vi.fn().mockResolvedValue(undefined),
      yparxei: vi.fn().mockResolvedValue(false),
      lista: vi.fn().mockResolvedValue(undefined),
      diagrafi: vi.fn().mockResolvedValue(undefined),
    };

    const apotelesma = await fortose_pdf(apothiki, 'PLH101', '1');

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
    }
  });

  it('επιστρέφει το σφάλμα ανάγνωσης byteof', async () => {
    const apothiki = {
      diavase_keimeno: vi.fn().mockResolvedValue(
        ok(JSON.stringify([{ id: '1', diadromi: 'a.pdf' }]))
      ),
      grapse_keimeno: vi.fn().mockResolvedValue(undefined),
      diavase_dyadiko: vi.fn().mockResolvedValue(apotyxia('DEN_ANOIGEI', 'δεν υπάρχει')),
      grapse_dyadiko: vi.fn().mockResolvedValue(undefined),
      yparxei: vi.fn().mockResolvedValue(false),
      lista: vi.fn().mockResolvedValue(undefined),
      diagrafi: vi.fn().mockResolvedValue(undefined),
    };

    const apotelesma = await fortose_pdf(apothiki as any, 'PLH101', '1');

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_ANOIGEI');
    }
  });
});
