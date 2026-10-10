import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import XartisEnotiton, {
  KEIMENO_STOXOU,
  KEIMENO_TELIOU,
  OdomosEnotiton,
  grammi_proapasitis,
  stilise_isxya,
  stilise_lepta,
} from './xartis.js';
import { pseudos_xartis } from '../../pseudomata/index.js';

const MONI_PIGIS = fileURLToPath(new URL('./xartis.tsx', import.meta.url));

/** Τυλίγει ένα στοιχείο σε MemoryRouter ώστε τα Link να αποδίδουν href. */
function apoidefsi(stoixeio: ReactElement): string {
  return renderToStaticMarkup(<MemoryRouter>{stoixeio}</MemoryRouter>);
}

/** Αποδίδει τον χάρτη με δοσμένες ολοκληρωμένες ενότητες, χωρίς Provider αποθήκευσης. */
function char_tis_proodhou(telies: readonly string[]): string {
  return apoidefsi(
    <OdomosEnotiton
      xartis={pseudos_xartis()}
      telies={telies}
      allaxe_telia={() => Promise.resolve()}
    />
  );
}

describe('xartis — μορφοποίηση χρόνου και ισχύος', () => {
  it('μετατρέπει τα λεπτά σε ώρες και λεπτά', () => {
    expect(stilise_lepta(15)).toBe('15 λ');
    expect(stilise_lepta(60)).toBe('1 ζ');
    expect(stilise_lepta(75)).toBe('1 ζ 15 λ');
    expect(stilise_lepta(null)).toBe('Χωρίς εκτίμηση χρόνου');
  });

  it('μετατρέπει την ισχύ προαπαίτησης σε ελληνική λέξη', () => {
    expect(stilise_isxya('isxyri')).toBe('ισχυρό');
    expect(stilise_isxya('asthenis')).toBe('ασθενικό');
  });

  it('γράφει τη γραμμή προαπαίτησης με id και ισχύ', () => {
    expect(grammi_proapasitis({ enotita_id: 'en-1', isxys: 'isxyri' })).toBe(
      'Προαπαιτείται: en-1 (ισχυρό)'
    );
    expect(grammi_proapasitis({ enotita_id: 'en-2', isxys: 'asthenis' })).toBe(
      'Προαπαιτείται: en-2 (ασθενικό)'
    );
  });
});

describe('xartis — οθόνη χάρτη ενοτήτων', () => {
  it('στο αρχικό render δείχνει την κατάσταση φόρτωσης του OloniKatastasis', () => {
    const html = apoidefsi(<XartisEnotiton />);
    expect(html).toContain('data-testid="xartis-ekran"');
    expect(html).toContain('data-testid="katastasi-fortosi"');
  });

  it('κάθε ενότητα έχει κάρτα, σύνδεσμο οδηγού και μπλοκ προαπαιτήσεων', () => {
    const html = char_tis_proodhou([]);
    expect(html).toContain('data-testid="xartis-enotita"');
    expect(html).toContain('data-testid="xartis-proiresi"');
    expect(html).toContain('data-testid="xartis-telos"');
    expect(html).toContain('href="/odigos/en-1"');
    expect(html).toContain('href="/odigos/en-4"');
    expect(html).toContain('Προαπαιτείται: en-1 (ισχυρό)');
    expect(html).toContain('Προαπαιτείται: en-2 (ασθενικό)');
    expect(html).toContain('enotita-kartela');
    expect(html).toContain('enotita-xreomeni');
  });

  it('ο δακτύλιος προόδου ξεκινά στο μηδέν και ανεβαίνει με τις ολοκληρωμένες ενότητες', () => {
    const kenis = char_tis_proodhou([]);
    expect(kenis).toContain('>0%<');
    expect(kenis).toContain('0 από 4 ενότητες');

    const tetagmenes = char_tis_proodhou(['en-1', 'en-2']);
    expect(tetagmenes).toContain('>50%<');
    expect(tetagmenes).toContain('2 από 4 ενότητες');
  });

  it('οι υποχρεωτικές data-testid υπάρχουν στην πηγή της οθόνης', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    for (const testid of ['xartis-ekran', 'xartis-enotita', 'xartis-proiresi', 'xartis-telos']) {
      expect(pigi).toContain(`"${testid}"`);
    }
    expect(pigi).toContain('xartis-aristeia-${enotita.id}');
  });
});

describe('xartis — η ολοκλήρωση ζει στην αποθήκευση', () => {
  it('δεν κρατάει πλέον τοπική κατάσταση telies', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(pigi).not.toContain('useState<readonly string[]>');
    expect(pigi).not.toContain('setTelies');
  });

  it('διαβάζει και γράφει την πρόοδο μέσω της αποθήκευσης', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(pigi).toContain("import { xrisiApothekisis } from '../../apothiki/index.js'");
    expect(pigi).toContain('xrisiApothekisis()');
    expect(pigi).toContain('apothiki.proodhos.aristeiesEnotiton');
    expect(pigi).toContain('allaxe_telia={apothiki.allaxe_telia}');
    expect(pigi).toContain('await allaxe_telia(enotita.id)');
  });

  it('χωρίς Provider ο χάρτης αποδίδεται με κενή πρόοδο, όχι με σφάλμα', () => {
    const html = apoidefsi(<XartisEnotiton />);
    expect(html).toContain('data-testid="xartis-ekran"');
  });
});

describe('xartis — κουμπί σήμανσης ανά ενότητα', () => {
  it('κάθε ενότητα έχει δικό της testid αλλαγής κατάστασης', () => {
    const html = char_tis_proodhou([]);
    for (const enotita of pseudos_xartis().enotites) {
      expect(html).toContain(`data-testid="xartis-aristeia-${enotita.id}"`);
    }
  });

  it('η ενότητα χωρίς αποθηκευμένη ολοκλήρωση ζητά να σημειωθεί', () => {
    const html = char_tis_proodhou([]);
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain(KEIMENO_STOXOU);
    expect(html).not.toContain('pilegma-entono');
  });

  it('η ενότητα με αποθηκευμένη ολοκλήρωση φαίνεται ολοκληρωμένη', () => {
    const html = char_tis_proodhou(['en-1']);
    expect(html).toContain('data-testid="xartis-aristeia-en-1"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain(KEIMENO_TELIOU);
    expect(html).toContain('pilegma-entono');
    expect(html).toContain('data-testid="xartis-aristeia-en-2"');
    expect(html).toContain('aria-pressed="false"');
  });
});