import { describe, expect, it } from 'vitest';
import { analizise_argv } from './analizis-argv.js';
import { RIZA_PROEDROPIA } from './statheroi-argv.js';

/** Επιστρέφει το μήνυμα σφάλματος του αναλυτή ή πετάει αν η ανάλυση πέτυχε. */
function minima_sfalmatos(argv: readonly string[]): string {
  const apotelesma = analizise_argv(argv);
  if (apotelesma.ok) {
    throw new Error(`Αναμενόταν σφάλμα ανάλυσης για: ${argv.join(' ')}`);
  }
  return apotelesma.sfalma.minima;
}

describe('analizise_argv — προεπιλογές', () => {
  it('μια εντολή χωρίς ορίσματα δίνει τις προεπιλογές', () => {
    const apotelesma = analizise_argv(['mathimata']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi).toEqual({
      entoli: 'mathimata',
      ori_arg: [],
      riza: RIZA_PROEDROPIA,
      montelo: null,
      json: false,
      voitheia: false,
    });
  });

  it('κρατά τα θετικά ορίσματα με τη σειρά που δίνονται', () => {
    const apotelesma = analizise_argv(['sygxronismos', 'A', 'B']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.entoli).toBe('sygxronismos');
    expect(apotelesma.timi.ori_arg).toEqual(['A', 'B']);
  });

  it('η άγνωστη εντολή δεν απορρίπτεται στην ανάλυση (τη χειρίζεται ο dispatcher)', () => {
    const apotelesma = analizise_argv(['miastiko']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.entoli).toBe('miastiko');
  });
});

describe('analizise_argv — σημαίες', () => {
  it('διαβάζει --riza και --montelo με ξεχωριστή τιμή', () => {
    const apotelesma = analizise_argv(['--riza', 'C:/tmp/dps', '--montelo', 'gemini-x', 'mathimata']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.riza).toBe('C:/tmp/dps');
    expect(apotelesma.timi.montelo).toBe('gemini-x');
  });

  it('διαβάζει --riza= και --montelo= με τη μορφή ισότητας', () => {
    const apotelesma = analizise_argv(['--riza=./alt', '--montelo=m-1', 'run']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.riza).toBe('./alt');
    expect(apotelesma.timi.montelo).toBe('m-1');
  });

  it('δέχεται σημαίες πριν και μετά τα ορίσματα', () => {
    const apotelesma = analizise_argv(['--json', 'analysi', 'MATH101', '--riza', './r2']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.json).toBe(true);
    expect(apotelesma.timi.ori_arg).toEqual(['MATH101']);
    expect(apotelesma.timi.riza).toBe('./r2');
  });

  it('αναγνωρίζει --json, --help και -h', () => {
    for (const argv of [['--json', 'run'], ['--help'], ['-h']]) {
      const apotelesma = analizise_argv(argv);
      expect(apotelesma.ok).toBe(true);
      if (!apotelesma.ok) {
        continue;
      }
      expect(
        apotelesma.timi.json || apotelesma.timi.voitheia
      ).toBe(true);
    }
  });

  it('η άγνωστη σημαία απορρίπτεται', () => {
    expect(minima_sfalmatos(['--mesa'])).toContain('--mesa');
  });

  it('η σύντομη άγνωστη σημαία απορρίπτεται', () => {
    expect(minima_sfalmatos(['-x', 'run'])).toContain('-x');
  });

  it('--riza χωρίς τιμή απορρίπτεται', () => {
    expect(minima_sfalmatos(['--riza'])).toContain('--riza');
  });

  it('--riza στο τέλος χωρίς τιμή απορρίπτεται', () => {
    expect(minima_sfalmatos(['mathimata', '--riza'])).toContain('--riza');
  });

  it('κενή τιμή σε --riza= απορρίπτεται', () => {
    expect(minima_sfalmatos(['--riza=', 'run'])).toContain('--riza');
  });

  it('η σημαία boolean δεν δέχεται τιμή', () => {
    expect(minima_sfalmatos(['--json=nal', 'run'])).toContain('--json');
  });

  it('η τιμή μιας boolean σημαίας δεν καταναλώνει το επόμενο όρισμα', () => {
    const apotelesma = analizise_argv(['--json', 'odigos', 'en-1']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.ori_arg).toEqual(['en-1']);
  });

  it('μετά το -- τα επόμενα tokens είναι ορίσματα, όχι σημαίες', () => {
    const apotelesma = analizise_argv(['run', '--', '--json']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.json).toBe(false);
    expect(apotelesma.timi.ori_arg).toEqual(['--json']);
  });
});

describe('analizise_argv — σφάλματα εισόδου', () => {
  it('καμία εντολή δίνει κενή εντολή (ο dispatcher το μεταφράζει σε σφάλμα)', () => {
    const apotelesma = analizise_argv([]);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.entoli).toBe('');
  });

  it('μόνο σημαίες χωρίς εντολή δίνει κενή εντολή', () => {
    const apotelesma = analizise_argv(['--riza', './x']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.entoli).toBe('');
    expect(apotelesma.timi.riza).toBe('./x');
  });
});
