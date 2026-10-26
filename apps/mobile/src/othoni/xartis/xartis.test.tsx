import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import XartisEnotiton, {
  KEIMENO_STOXOU,
  KEIMENO_TELIOU,
  KartaEnotitas,
  OdomosEnotiton,
  ProodosDimiourgiasXarti,
  STADIA_DIMIOURGIAS_XARTI,
  einai_kleidomeni_enotita,
  grammi_proapasitis,
  stilise_isxya,
  stilise_lepta,
} from './xartis.js';
import { pseudos_xartis } from '../../../test-fixtures/pseudomata/index.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';

const MONI_PIGIS = fileURLToPath(new URL('./xartis.tsx', import.meta.url));

/** Τυλίγει ένα στοιχείο σε MemoryRouter ώστε τα Link να αποδίδουν href. */
function apoidefsi(stoixeio: ReactElement): string {
  return renderToStaticMarkup(me_periballon_test(<MemoryRouter>{stoixeio}</MemoryRouter>));
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

  it('παλιό ή κακόβουλο id ενότητας δεν γίνεται href εξωτερικής πλοήγησης', () => {
    const original = pseudos_xartis().enotites[0];
    if (original === undefined) throw new Error('λείπει η δοκιμαστική ενότητα');
    const html = apoidefsi(
      <KartaEnotitas
        enotita={{ ...original, id: '\\\\evil.example' }}
        tetagmeni={false}
        allaxe_telia={() => Promise.resolve()}
      />
    );

    expect(html).not.toContain('href=');
    expect(html).toContain('μη έγκυρο αναγνωριστικό');
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
    for (const testid of [
      'xartis-ekran',
      'xartis-enotita',
      'xartis-proiresi',
      'xartis-telos',
      'xartis-katastasi-kleidomatos',
      'xartis-dag-syndesi',
      'xartis-apodosi-badge',
      'xartis-proodos-analisis',
    ]) {
      expect(pigi).toContain(`"${testid}"`);
    }
    expect(pigi).toContain('generateCourseMap(');
    expect(pigi).toContain('data-testid="xartis-dimiourgia"');
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

describe('xartis — DAG εξαρτήσεις και κατάσταση κλειδώματος', () => {
  const enotites = pseudos_xartis().enotites;
  const en1 = enotites[0]!;
  const en2 = enotites[1]!;
  const en3 = enotites[2]!;
  const en4 = enotites[3]!;

  it('η συνάρτηση einai_kleidomeni_enotita υπολογίζει σωστά το κλείδωμα βάσει ισχυρών προαπαιτουμένων', () => {
    // en-1: χωρίς προαπαιτούμενα -> ξεκλείδωτη
    expect(einai_kleidomeni_enotita(en1, [])).toBe(false);

    // en-2: προαπαιτεί en-1 (isxyri). Αν en-1 δεν είναι στα telies -> κλειδωμένη
    expect(einai_kleidomeni_enotita(en2, [])).toBe(true);
    expect(einai_kleidomeni_enotita(en2, ['en-1'])).toBe(false);

    // en-3: προαπαιτεί en-2 (asthenis). Ασθενές προαπαιτούμενο δεν κλειδώνει -> ξεκλείδωτη
    expect(einai_kleidomeni_enotita(en3, [])).toBe(false);

    // en-4: προαπαιτεί en-3 (isxyri). Αν en-3 δεν είναι στα telies -> κλειδωμένη
    expect(einai_kleidomeni_enotita(en4, [])).toBe(true);
    expect(einai_kleidomeni_enotita(en4, ['en-3'])).toBe(false);
  });

  it('αποδίδει το badge κατάστασης κλειδώματος (🔒 Κλειδωμένη / 🔓 Ξεκλείδωτη)', () => {
    const htmlArxiko = char_tis_proodhou([]);
    expect(htmlArxiko).toContain('data-testid="xartis-katastasi-kleidomatos"');
    expect(htmlArxiko).toContain('🔓 Ξεκλείδωτη');
    expect(htmlArxiko).toContain('🔒 Κλειδωμένη');

    // Χωρίς ολοκληρωμένες: en-1 είναι ξεκλείδωτη, en-2 είναι κλειδωμένη
    const htmlEn1 = apoidefsi(
      <KartaEnotitas enotita={en1} tetagmeni={false} allaxe_telia={() => Promise.resolve()} telies={[]} />
    );
    expect(htmlEn1).toContain('🔓 Ξεκλείδωτη');
    expect(htmlEn1).not.toContain('🔒 Κλειδωμένη');

    const htmlEn2Kleidomeni = apoidefsi(
      <KartaEnotitas enotita={en2} tetagmeni={false} allaxe_telia={() => Promise.resolve()} telies={[]} />
    );
    expect(htmlEn2Kleidomeni).toContain('🔒 Κλειδωμένη');

    const htmlEn2Xekleidoti = apoidefsi(
      <KartaEnotitas enotita={en2} tetagmeni={false} allaxe_telia={() => Promise.resolve()} telies={['en-1']} />
    );
    expect(htmlEn2Xekleidoti).toContain('🔓 Ξεκλείδωτη');
  });

  it('αποδίδει τα διαδραστικά pills προαπαιτουμένων (data-testid="xartis-dag-syndesi")', () => {
    // Όταν η προαπαιτούμενη ενότητα εκκρεμεί: ⏳ [Τίτλος/ID] (ισχυρό/ασθενικό)
    const htmlArxiko = char_tis_proodhou([]);
    expect(htmlArxiko).toContain('data-testid="xartis-dag-syndesi"');
    expect(htmlArxiko).toContain('⏳ Βασικές αρχές και ιστορικό (ισχυρό)');
    expect(htmlArxiko).toContain('⏳ Μεταβλητές και τύποι (ασθενικό)');

    // Όταν η προαπαιτούμενη ενότητα ολοκληρωθεί: ✓ [Τίτλος/ID]
    const htmlMeEn1 = char_tis_proodhou(['en-1']);
    expect(htmlMeEn1).toContain('✓ Βασικές αρχές και ιστορικό');
  });
});

describe('xartis — απόδοση ενοτήτων και badges θεμάτων', () => {
  it('εμφανίζει το badge υψηλής απόδοσης όταν apodosi > 0', () => {
    const enotita = { ...pseudos_xartis().enotites[0]!, apodosi_exetasis: null };
    const html = apoidefsi(
      <KartaEnotitas
        enotita={enotita}
        tetagmeni={false}
        allaxe_telia={() => Promise.resolve()}
        apodosi={12}
      />
    );
    expect(html).toContain('data-testid="xartis-apodosi-badge"');
    expect(html).toContain('⭐ Θέματα: +12 μονάδες');
  });

  it('δεν εμφανίζει το badge όταν η απόδοση είναι 0 ή μηδενική', () => {
    const enotita = { ...pseudos_xartis().enotites[0]!, apodosi_exetasis: 0 };
    const html = apoidefsi(
      <KartaEnotitas
        enotita={enotita}
        tetagmeni={false}
        allaxe_telia={() => Promise.resolve()}
        apodosi={0}
      />
    );
    expect(html).not.toContain('data-testid="xartis-apodosi-badge"');
  });

  it('ο OdomosEnotiton περνάει την απόδοση στις κάρτες', () => {
    const xartis = pseudos_xartis();
    const html = apoidefsi(
      <OdomosEnotiton
        xartis={xartis}
        telies={[]}
        allaxe_telia={() => Promise.resolve()}
        apodosi={{ 'en-1': 18 }}
      />
    );
    expect(html).toContain('data-testid="xartis-apodosi-badge"');
    expect(html).toContain('⭐ Θέματα: +18 μονάδες');
  });

  describe('xartis — ProodosDimiourgiasXarti (Stream 3)', () => {
    it('περιλαμβάνει και τα τρία στάδια ανάλυσης διαφανειών και DAG ταξινόμησης', () => {
      expect(STADIA_DIMIOURGIAS_XARTI).toEqual([
        'Επεξεργασία διαφανειών...',
        'Τοπολογική ταξινόμηση DAG...',
        'Ολοκλήρωση χάρτη...',
      ]);
    });

    it('αποδίδει το component με data-testid="xartis-proodos-analisis", progress bar και ποσοστό', () => {
      const html = renderToStaticMarkup(<ProodosDimiourgiasXarti stadio={1} pososto={33} />);
      expect(html).toContain('data-testid="xartis-proodos-analisis"');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuenow="33"');
      expect(html).toContain('33%');
      expect(html).toContain('ion-progress-bar');
      expect(html).toContain('Επεξεργασία διαφανειών...');
      expect(html).toContain('Τοπολογική ταξινόμηση DAG...');
      expect(html).toContain('Ολοκλήρωση χάρτη...');
    });

    it('αποδίδει ένδειξη ολοκλήρωσης σταδίων 2 και 3', () => {
      const html2 = renderToStaticMarkup(<ProodosDimiourgiasXarti stadio={2} pososto={66} />);
      expect(html2).toContain('aria-valuenow="66"');
      expect(html2).toContain('66%');
      expect(html2).toContain('Στάδιο 2/3');

      const html3 = renderToStaticMarkup(<ProodosDimiourgiasXarti stadio={3} pososto={100} />);
      expect(html3).toContain('aria-valuenow="100"');
      expect(html3).toContain('100%');
      expect(html3).toContain('Στάδιο 3/3');
    });
  });
});

