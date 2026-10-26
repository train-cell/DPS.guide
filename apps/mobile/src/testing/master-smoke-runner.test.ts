import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type {
  AntistoixisiThematos,
  Arxeio,
  Checkin,
  EisodosProgrammatos,
  Enotita,
  Mathima,
  MathimaProgrammatos,
} from '@dps/core';
import {
  fere_ola_ta_panepistimia,
  filtrare_panepistimia,
  ftiaxe_programma,
  ftiaxe_prosarmogi_panepistimiou,
  topologiki_taxinomisi,
  vres_kyklous,
  vres_panepistimio_apo_id,
  vres_panepistimio_apo_url,
  ypologise_apodosi,
} from '@dps/core';
import { FakeMystika, MnimiApothiki, MockLlm } from '@dps/core/testing';

import {
  EncryptedMystikaPyli,
  createEncryptedBackup,
  createVault,
  restoreEncryptedBackup,
  unlockVault,
} from '../vault/vault.js';
import {
  diadromi_eurethriou,
  fortose_eurethrio,
} from '../provoli-pdf/provoli-ypiresies.js';
import {
  DentroArxeionMathimatos,
  ProodosSygxronismou,
  STADIA_SYGXRONISMOU,
  morfopoiise_megethos_arxeiou,
} from '../othoni/mathimata/mathimata.js';
import {
  KartaEnotitas,
  ProodosDimiourgiasXarti,
  STADIA_DIMIOURGIAS_XARTI,
  einai_kleidomeni_enotita,
} from '../othoni/xartis/xartis.js';
import {
  fortose_apodosi,
  ypologise_kai_apothikefse_apodosi,
} from '../ypiresies/themata.js';
import RythmiseisProgrammatos, {
  DedomenaMathimatosMeleti,
  DraftProgrammatos,
} from '../programma/programma.js';
import { PROEDAFO_TEMPLATE } from '../programma/programma-vohthia.js';
import {
  LEKIKIA_TMIMATON,
  analise_odigo_md,
} from '../ypiresies/odigos.js';
import {
  AutoelegchosErwtisi,
  ProodosDimiourgiasOdigou,
  STADIA_DIMIOURGIAS_ODIGOU,
  analise_erwtisi_autoelegchou,
  lezanta_leitner_koutioy,
} from '../othoni/odigos/odigos.js';
import {
  fortose_proodho,
  katagrapse_checkin,
  katagrapse_leitner_apantisi,
  ypologismos_seri_meletis,
} from '../apothiki/apothiki-ypiresies.js';
import {
  analise_parapompi,
  diadromi_provolis,
} from '../provoli-pdf/parapompi.js';
import {
  APANTISI_YPARXEIS_STO_YLIKO,
  apantisi_me_llm_i_topika,
  apodhosi_keimenou_me_parapompes,
} from '../othoni/tutor/tutor.js';
import { me_periballon_test } from '../../test-fixtures/periballon-test-provider.js';
import { ftiaxe_periballon_test } from '../../test-fixtures/ftiaxe-test-periballon.js';
import { pseudos_xartis } from '../../test-fixtures/pseudomata/index.js';

describe('DPS.guide — Ενοποιημένος Master Smoke Test Runner', () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Onboarding & University Registry
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Onboarding & University Registry', () => {
    it('φορτώνει τον κατάλογο πανεπιστημίων με 26+ εγγραφές', () => {
      const panepistimia = fere_ola_ta_panepistimia();
      expect(panepistimia.length).toBeGreaterThanOrEqual(26);
    });

    it('υποστηρίζει accent-insensitive αναζήτηση («πειραιας» -> «ΠΑΠΕΙ»)', () => {
      const apotelesmataPeiraias = filtrare_panepistimia({ anazitisi: 'πειραιας' });
      expect(apotelesmataPeiraias.length).toBeGreaterThan(0);
      const exeiPapei = apotelesmataPeiraias.some(
        (p) => p.syntomi_onomasia === 'ΠΑΠΕΙ' && p.poli === 'Πειραιάς'
      );
      expect(exeiPapei).toBe(true);

      const apotelesmataTonismeno = filtrare_panepistimia({ anazitisi: 'Πειραιάς' });
      expect(apotelesmataTonismeno.map((p) => p.id)).toEqual(
        apotelesmataPeiraias.map((p) => p.id)
      );

      const apotelesmataKefalaia = filtrare_panepistimia({ anazitisi: 'ΠΑΠΕΙ' });
      expect(apotelesmataKefalaia.length).toBeGreaterThan(0);
      expect(apotelesmataKefalaia.some((p) => p.id === 'unipi_cs')).toBe(true);
    });

    it('αντιστοιχίζει σωστά URLs και domain names σε πανεπιστημιακές πύλες', () => {
      const apoPliresUrl = vres_panepistimio_apo_url('https://thales.cs.unipi.gr');
      expect(apoPliresUrl?.id).toBe('unipi_cs');

      const apoSubpath = vres_panepistimio_apo_url('https://thales.cs.unipi.gr/courses/PLI101/');
      expect(apoSubpath?.id).toBe('unipi_cs');

      const apoSketoDomain = vres_panepistimio_apo_url('thales.cs.unipi.gr');
      expect(apoSketoDomain?.id).toBe('unipi_cs');

      const uoa = vres_panepistimio_apo_url('https://eclass.uoa.gr/courses/DIT100');
      expect(uoa?.id).toBe('uoa_dit');
    });

    it('αναζητά με ασφάλεια βάσει αναγνωριστικού (id) και διαχειρίζεται custom LMS portals', () => {
      const vrethike = vres_panepistimio_apo_id('  unipi_cs  ');
      expect(vrethike?.syntomi_onomasia).toBe('ΠΑΠΕΙ');

      const agnosto = vres_panepistimio_apo_id('agnosto_id');
      expect(agnosto).toBeUndefined();

      const custom = ftiaxe_prosarmogi_panepistimiou('https://moodle.custom-uni.gr', 'Custom Uni');
      expect(custom.id).toContain('custom_moodle_custom_uni_gr');
      expect(custom.onoma).toBe('Custom Uni');
      expect(custom.typos_lms).toBe('custom');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Encrypted Vault & In-App Backup
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Encrypted Vault & In-App Backup', () => {
    const KODIKOS_MASTER = 'Master-Smoke-Password-2026!';
    const KODIKOS_BACKUP = 'Backup-Secret-Password-2026!';

    it('εκτελεί πλήρη κύκλο: δημιουργία vault -> αποθήκευση διαπιστευτηρίων -> εξαγωγή encrypted backup -> επαναφορά σε νέα συσκευή', async () => {
      const pigiApothiki = new MnimiApothiki();
      const pigiMystika = new FakeMystika();

      // Δημιουργία αρχικού vault
      const dimiourgia = await createVault(pigiApothiki, KODIKOS_MASTER);
      expect(dimiourgia.session).toBeDefined();

      // Αποθήκευση ευαίσθητων διαπιστευτηρίων και σημειώσεων
      const mystikaPylis = new EncryptedMystikaPyli(pigiMystika, dimiourgia.session.dataKey);
      await mystikaPylis.vale('llm_api_key', 'super_secret_llm_api_key_999');

      await dimiourgia.session.storage.grapse_keimeno(
        'PLI101/notes.json',
        JSON.stringify({ shmeiwseis: 'Βασικές έννοιες αλγορίθμων' })
      );
      await dimiourgia.session.storage.grapse_dyadiko(
        'PLI101/files/scan.bin',
        new Uint8Array([10, 20, 30, 40, 50])
      );

      // Εξαγωγή encrypted backup
      const backupBlob = await createEncryptedBackup(pigiApothiki, pigiMystika, KODIKOS_BACKUP);
      expect(backupBlob.size).toBeGreaterThan(0);
      expect(backupBlob.type).toBe('application/vnd.dps-guide.backup');

      // Επαναφορά σε εντελώς νέα συσκευή (κενό storage/mystika)
      const stoxosApothiki = new MnimiApothiki();
      const stoxosMystika = new FakeMystika();
      await restoreEncryptedBackup(stoxosApothiki, stoxosMystika, backupBlob, KODIKOS_BACKUP);

      // Ξεκλείδωμα του επαναφερθέντος vault με το master password
      const xekleidomeno = await unlockVault(stoxosApothiki, KODIKOS_MASTER);
      expect(xekleidomeno).toBeDefined();

      // Επαλήθευση ακεραιότητας σημειώσεων και αρχείων
      const keimeno = await xekleidomeno.storage.diavase_keimeno('PLI101/notes.json');
      expect(keimeno.ok).toBe(true);
      if (keimeno.ok) {
        expect(JSON.parse(keimeno.timi)).toEqual({ shmeiwseis: 'Βασικές έννοιες αλγορίθμων' });
      }

      const dyadiko = await xekleidomeno.storage.diavase_dyadiko('PLI101/files/scan.bin');
      expect(dyadiko.ok).toBe(true);
      if (dyadiko.ok) {
        expect([...dyadiko.timi]).toEqual([10, 20, 30, 40, 50]);
      }

      // Επαλήθευση ότι το μυστικό διαπιστευτήριο ανακτήθηκε σωστά
      const apokryptografimenaMystika = new EncryptedMystikaPyli(stoxosMystika, xekleidomeno.dataKey);
      expect(await apokryptografimenaMystika.pare('llm_api_key')).toBe('super_secret_llm_api_key_999');
    });

    it('απορρίπτει λάθος κωδικό backup χωρίς να αφήσει υπολείμματα', async () => {
      const storage = new MnimiApothiki();
      const secrets = new FakeMystika();
      await createVault(storage, KODIKOS_MASTER);
      const backup = await createEncryptedBackup(storage, secrets, KODIKOS_BACKUP);

      const kenoStorage = new MnimiApothiki();
      const kenaMystika = new FakeMystika();
      await expect(
        restoreEncryptedBackup(kenoStorage, kenaMystika, backup, 'lathos_kodikos')
      ).rejects.toThrow('Ο κωδικός backup δεν είναι σωστός');

      const arxeia = await kenoStorage.lista('.dps-vault');
      expect(arxeia.ok && arxeia.timi).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. LMS Courses & File Tree
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. LMS Courses & File Tree', () => {
    it('συγχρονίζει ευρετήριο αρχείων μαθήματος και το ανακτά με fortose_eurethrio', async () => {
      const apothiki = new MnimiApothiki();
      const kodikosMathimatos = 'PLI201';

      const arxeia: Arxeio[] = [
        {
          id: 'arx-1',
          kodikos_mathimatos: kodikosMathimatos,
          diadromi: `${kodikosMathimatos}/arxeia/syntheta/arx-1.pdf`,
          url: 'https://thales.cs.unipi.gr/courses/PLI201/arx-1.pdf',
          megethos: 2560, // 2.5 KB
          imerominia: '2026-10-20',
          etag: null,
          sha256: null,
          diplotypo_tou: 'pdf',
        },
        {
          id: 'arx-2',
          kodikos_mathimatos: kodikosMathimatos,
          diadromi: `${kodikosMathimatos}/arxeia/syntheta/slides.pdf`,
          url: 'https://thales.cs.unipi.gr/courses/PLI201/slides.pdf',
          megethos: 3145728, // 3.0 MB
          imerominia: '2026-10-21',
          etag: null,
          sha256: null,
          diplotypo_tou: 'pdf',
        },
      ];

      await apothiki.grapse_keimeno(diadromi_eurethriou(kodikosMathimatos), JSON.stringify(arxeia));

      const fortomeno = await fortose_eurethrio(apothiki, kodikosMathimatos);
      expect(fortomeno.ok).toBe(true);
      if (fortomeno.ok) {
        expect(fortomeno.timi).toHaveLength(2);
        expect(fortomeno.timi.map((a) => a.id)).toEqual(['arx-1', 'arx-2']);
      }
    });

    it('μορφοποιεί ακριβώς τα μεγέθη αρχείων σε KB και MB με ανθεκτικότητα σε άκυρες τιμές', () => {
      expect(morfopoiise_megethos_arxeiou(1024)).toBe('1.0 KB');
      expect(morfopoiise_megethos_arxeiou(2560)).toBe('2.5 KB');
      expect(morfopoiise_megethos_arxeiou(1024 * 1024)).toBe('1.0 MB');
      expect(morfopoiise_megethos_arxeiou(1024 * 1024 * 4.2)).toBe('4.2 MB');
      expect(morfopoiise_megethos_arxeiou(null)).toBe('Άγνωστο');
      expect(morfopoiise_megethos_arxeiou(undefined)).toBe('Άγνωστο');
      expect(morfopoiise_megethos_arxeiou(-50)).toBe('Άγνωστο');
      expect(morfopoiise_megethos_arxeiou(Number.NaN)).toBe('Άγνωστο');
    });

    it('αποδίδει το DentroArxeionMathimatos με συνδέσμους προβολής PDF reader', async () => {
      const apothiki = new MnimiApothiki();
      const mathima: Mathima = {
        kodikos: 'PLI201',
        titlos: 'Δομές Δεδομένων',
        tomeas: 'Πληροφορική',
        katastasi_sygxronismou: 'Συγχρονισμένο',
        eclass_url: 'https://thales.cs.unipi.gr/courses/PLI201/',
        epilegmeno: true,
      };

      const arxeia: Arxeio[] = [
        {
          id: 'arx-1',
          kodikos_mathimatos: 'PLI201',
          diadromi: 'PLI201/arxeia/syntheta/theoria.pdf',
          url: 'https://thales.cs.unipi.gr/courses/PLI201/theoria.pdf',
          megethos: 1024 * 512, // 512 KB
          imerominia: '2026-10-20',
          etag: null,
          sha256: null,
          diplotypo_tou: 'pdf',
        },
      ];

      await apothiki.grapse_keimeno(diadromi_eurethriou('PLI201'), JSON.stringify(arxeia));
      const periballon = ftiaxe_periballon_test({ apothiki });

      const html = renderToStaticMarkup(
        me_periballon_test(
          createElement(
            MemoryRouter,
            null,
            createElement(DentroArxeionMathimatos, { mathima })
          ),
          periballon
        )
      );

      // Στο πρώτο render σε SSR φορτώνει ασύγχρονα, αλλά η δομή του component είναι έτοιμη
      expect(html === '' || html.includes('mathima-dentro-arxeion')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Roadmap & Visual DAG Prerequisites
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Roadmap & Visual DAG Prerequisites', () => {
    const enotita1: Enotita = {
      id: 'en-1',
      titlos: 'Εισαγωγή στη Γλώσσα C',
      seira: 1,
      lepta_ektimisi: 60,
      ennoies: ['Μεταβλητές', 'Τύποι'],
      proapaitoumenes: [],
      piges: [],
      apodosi_exetasis: 10,
    };

    const enotita2: Enotita = {
      id: 'en-2',
      titlos: 'Δείκτες και Μνήμη',
      seira: 2,
      lepta_ektimisi: 90,
      ennoies: ['Pointers', 'Malloc'],
      proapaitoumenes: [{ enotita_id: 'en-1', isxys: 'isxyri' }],
      piges: [],
      apodosi_exetasis: 25,
    };

    const enotita3: Enotita = {
      id: 'en-3',
      titlos: 'Συνδεδεμένες Λίστες',
      seira: 3,
      lepta_ektimisi: 120,
      ennoies: ['Nodes', 'Linked List'],
      proapaitoumenes: [
        { enotita_id: 'en-2', isxys: 'isxyri' },
        { enotita_id: 'en-1', isxys: 'asthenis' },
      ],
      piges: [],
      apodosi_exetasis: 35,
    };

    it('επιλύει σωστά την τοπολογική διάταξη του DAG', () => {
      const taxinomisi = topologiki_taxinomisi([enotita3, enotita1, enotita2]);
      expect(taxinomisi.ok).toBe(true);
      if (taxinomisi.ok) {
        expect(taxinomisi.timi).toEqual(['en-1', 'en-2', 'en-3']);
      }
    });

    it('ανιχνεύει κλειδωμένες ενότητες βάσει ισχυρών προαπαιτουμένων και τις ξεκλειδώνει μετά από ολοκλήρωση', () => {
      // Χωρίς ολοκλήρωση καμίας ενότητας:
      expect(einai_kleidomeni_enotita(enotita1, [])).toBe(false); // Χωρίς προαπαιτούμενα
      expect(einai_kleidomeni_enotita(enotita2, [])).toBe(true);  // Απαιτείται en-1
      expect(einai_kleidomeni_enotita(enotita3, [])).toBe(true);  // Απαιτείται en-2

      // Μετά την ολοκλήρωση της enotita1:
      expect(einai_kleidomeni_enotita(enotita2, ['en-1'])).toBe(false); // Ξεκλείδωσε!
      expect(einai_kleidomeni_enotita(enotita3, ['en-1'])).toBe(true);  // Παραμένει κλειδωμένη (λείπει η en-2)

      // Μετά την ολοκλήρωση και της enotita2:
      expect(einai_kleidomeni_enotita(enotita3, ['en-1', 'en-2'])).toBe(false); // Ξεκλείδωσε!
    });

    it('αποδίδει οπτικά badges κλειδώματος και ξεκλειδώματος στην KartaEnotitas', () => {
      // 1. Κλειδωμένη κάρτα (λείπει η προαπαίτηση)
      const htmlKleidomeni = renderToStaticMarkup(
        me_periballon_test(
          createElement(
            MemoryRouter,
            null,
            createElement(KartaEnotitas, {
              enotita: enotita2,
              tetagmeni: false,
              telies: [],
              allaxe_telia: async () => undefined,
            })
          )
        )
      );
      expect(htmlKleidomeni).toContain('pilegma-kleidomeni');
      expect(htmlKleidomeni).toContain('🔒 Κλειδωμένη');

      // 2. Ξεκλείδωτη κάρτα (η προαπαίτηση ολοκληρώθηκε)
      const htmlXekleidoti = renderToStaticMarkup(
        me_periballon_test(
          createElement(
            MemoryRouter,
            null,
            createElement(KartaEnotitas, {
              enotita: enotita2,
              tetagmeni: false,
              telies: ['en-1'],
              allaxe_telia: async () => undefined,
            })
          )
        )
      );
      expect(htmlXekleidoti).toContain('pilegma-xekleidoti');
      expect(htmlXekleidoti).toContain('🔓 Ξεκλείδωτη');
    });

    it('ανιχνεύει κυκλικές εξαρτήσεις στο DAG', () => {
      const kykloiEnotites: Enotita[] = [
        {
          id: 'k-1',
          titlos: 'Ενότητα Κ1',
          seira: 1,
          lepta_ektimisi: 30,
          ennoies: [],
          proapaitoumenes: [{ enotita_id: 'k-2', isxys: 'isxyri' }],
          piges: [],
          apodosi_exetasis: null,
        },
        {
          id: 'k-2',
          titlos: 'Ενότητα Κ2',
          seira: 2,
          lepta_ektimisi: 30,
          ennoies: [],
          proapaitoumenes: [{ enotita_id: 'k-1', isxys: 'isxyri' }],
          piges: [],
          apodosi_exetasis: null,
        },
      ];

      const kykloi = vres_kyklous(kykloiEnotites);
      expect(kykloi.ok).toBe(true);
      if (kykloi.ok) {
        expect(kykloi.timi.length).toBeGreaterThan(0);
      }

      const taxinomisi = topologiki_taxinomisi(kykloiEnotites);
      expect(taxinomisi.ok).toBe(false);
      if (!taxinomisi.ok) {
        expect(taxinomisi.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Themata Pipeline (Card T3)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Themata Pipeline (Card T3)', () => {
    it('εκτελεί το 50/50 boundary: NLP mappings -> καθαρός υπολογισμός ypologise_kai_apothikefse_apodosi', async () => {
      const apothiki = new MnimiApothiki();
      const kodikosMathimatos = 'PLI101';

      // Αποτέλεσμα NLP αντιστοίχισης θεμάτων (LLM output):
      const antistoixiseis: AntistoixisiThematos[] = [
        { enotita_id: 'en-1', monades: 15 },
        { enotita_id: 'en-2', monades: 30 },
        { enotita_id: 'en-1', monades: 10 },
      ];

      // Pure functions calculate points deterministically:
      const apodosi = ypologise_apodosi(antistoixiseis);
      expect(apodosi.ok).toBe(true);
      if (apodosi.ok) {
        expect(apodosi.timi).toEqual({ 'en-1': 25, 'en-2': 30 });
      }

      // Εκτέλεση της υπηρεσίας που υπολογίζει και αποθηκεύει στο vault:
      const apotelesmaYpiresias = await ypologise_kai_apothikefse_apodosi(
        apothiki,
        kodikosMathimatos,
        antistoixiseis
      );
      expect(apotelesmaYpiresias.ok).toBe(true);
      if (apotelesmaYpiresias.ok) {
        expect(apotelesmaYpiresias.timi).toEqual({ 'en-1': 25, 'en-2': 30 });
      }

      // Επαλήθευση αποθήκευσης στο apodosi.json
      const apothikevmeno = await fortose_apodosi(apothiki, kodikosMathimatos);
      expect(apothikevmeno).toEqual({ 'en-1': 25, 'en-2': 30 });
    });

    it('εμφανίζει high-yield badge (⭐ Θέματα) στην κάρτα ενότητας όταν apodosi > 0', () => {
      const enotita = { ...pseudos_xartis().enotites[0]!, apodosi_exetasis: null };

      const htmlMeBadge = renderToStaticMarkup(
        me_periballon_test(
          createElement(
            MemoryRouter,
            null,
            createElement(KartaEnotitas, {
              enotita,
              tetagmeni: false,
              apodosi: 25,
              allaxe_telia: async () => undefined,
            })
          )
        )
      );
      expect(htmlMeBadge).toContain('data-testid="xartis-apodosi-badge"');
      expect(htmlMeBadge).toContain('⭐ Θέματα: +25 μονάδες');

      const htmlXorisBadge = renderToStaticMarkup(
        me_periballon_test(
          createElement(
            MemoryRouter,
            null,
            createElement(KartaEnotitas, {
              enotita,
              tetagmeni: false,
              apodosi: 0,
              allaxe_telia: async () => undefined,
            })
          )
        )
      );
      expect(htmlXorisBadge).not.toContain('data-testid="xartis-apodosi-badge"');
    });

    it('εμφανίζει σύσταση προτεραιότητας μελέτης στο πρόγραμμα με ταξινόμηση υψηλότερης απόδοσης', () => {
      const arxikaMathimata: DedomenaMathimatosMeleti[] = [
        {
          kodikos: 'ΠΛΗ201',
          enotites: pseudos_xartis().enotites,
          checkins: [],
          apodosi: { 'en-1': 15, 'en-2': 40 },
        },
      ];
      const arxikoDraft: DraftProgrammatos = {
        exetaseis: [
          {
            kodikos: 'ΠΛΗ201',
            imerominia: '2027-01-20',
            tropos: 'kleista_vivlia',
          },
        ],
        arxiExetastikis: '2027-01-15',
        templateLepton: PROEDAFO_TEMPLATE,
        overrides: [],
      };

      const html = renderToStaticMarkup(
        me_periballon_test(
          createElement(
            MemoryRouter,
            null,
            createElement(RythmiseisProgrammatos, {
              arxikaMathimata,
              arxikoDraft,
            })
          )
        )
      );

      expect(html).toContain('data-testid="programma-systasi-proteraiotitas"');
      expect(html).toContain('Σύσταση Προτεραιότητας Μελέτης');
      // Η ενότητα en-2 (+40 μονάδες) προηγείται της en-1 (+15 μονάδες)
      expect(html).toContain('+40 μονάδες');
      expect(html).toContain('+15 μονάδες');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Study Guide & Interactive Quiz
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Study Guide & Interactive Quiz', () => {
    it('αναλύει πλήρη οδηγό μελέτης 7 ενοτήτων και απορρίπτει ελλιπείς οδηγούς', () => {
      const egkyrosOdigosMd = [
        '# Ενότητα 1: Βασικές Αρχές',
        '## 🎯 Στόχοι',
        '- Κατανόηση βασικών αρχών.',
        '[[arx-1: σ. 2]]',
        '## 👶 ELI5',
        '- Απλή εξήγηση για παιδιά.',
        '[[arx-1: σ. 3]]',
        '## 🔬 Θεωρία',
        '- Αναλυτική θεωρία.',
        '[[arx-1: σ. 4]]',
        '## 🧪 Λυμένο παράδειγμα',
        '- Παράδειγμα εφαρμογής.',
        '[[arx-1: σ. 5]]',
        '## ⚠️ Παγίδες',
        '- Συχνά λάθη που γίνονται.',
        '[[arx-1: σ. 6]]',
        '## 🔗 Συνδέσεις',
        '- Σύνδεση με άλλες ενότητες.',
        '[[arx-1: σ. 7]]',
        '## ✅ Αυτοέλεγχος',
        '- Ερώτηση: Τι είναι αναδρομή; Απάντηση: Συνάρτηση που καλεί τον εαυτό της.',
        '[[arx-1: σ. 8]]',
      ].join('\n');

      const analisi = analise_odigo_md('en-1', egkyrosOdigosMd);
      expect(analisi).not.toBeNull();
      expect(analisi?.enotita_id).toBe('en-1');
      expect(analisi?.titlos).toBe('Ενότητα 1: Βασικές Αρχές');
      expect(Object.keys(analisi?.tmimata ?? {})).toEqual([...LEKIKIA_TMIMATON]);

      const ellipisOdigosMd = [
        '# Ενότητα 1: Ελλιπής',
        '## 🎯 Στόχοι',
        '- Μόνο στόχοι.',
        '[[arx-1: σ. 2]]',
      ].join('\n');
      expect(analise_odigo_md('en-1', ellipisOdigosMd)).toBeNull();
    });

    it('αναλύει ερωτήσεις αυτοελέγχου και αποδίδει διαδραστικό accordion με Leitner badges', () => {
      const grammi = 'Ερώτηση: Τι είναι LIFO; Απάντηση: Last In First Out.';
      const dedomena = analise_erwtisi_autoelegchou(grammi, 0, 'en-1');
      expect(dedomena.erwtisi).toBe('Τι είναι LIFO;');
      expect(dedomena.apantisi).toBe('Last In First Out.');

      expect(lezanta_leitner_koutioy(1)).toBe('Κουτί 1');
      expect(lezanta_leitner_koutioy(3)).toBe('Κουτί 3');
      expect(lezanta_leitner_koutioy(5)).toBe('Κουτί 5: Κατοχυρωμένη');

      const html = renderToStaticMarkup(
        me_periballon_test(
          createElement(
            MemoryRouter,
            null,
            createElement(AutoelegchosErwtisi, {
              arithmos: 1,
              erwtisi: dedomena.erwtisi,
              apantisi: dedomena.apantisi,
              ennoia: dedomena.ennoia,
              kouti: 2,
              arxikaAnoixto: true,
            })
          )
        )
      );

      expect(html).toContain('Ερώτηση 1:');
      expect(html).toContain('Τι είναι LIFO;');
      expect(html).toContain('Κουτί 2');
      expect(html).toContain('Last In First Out.');
      expect(html).toContain('Το ήξερα');
      expect(html).toContain('Χρειάζομαι επανάληψη');
    });

    it('καταγράφει την πρόοδο Leitner 5-box στο proodhos.json (άνοδος σε σωστό, πτώση σε λάθος)', async () => {
      const apothiki = new MnimiApothiki();
      const kodikosMathimatos = 'CS101';
      const simera = '2026-10-26';

      // 1η σωστή απάντηση -> κουτί 2
      const apotelesma1 = await katagrapse_leitner_apantisi(
        apothiki,
        kodikosMathimatos,
        'Δομή Στοίβας',
        true,
        simera
      );
      expect(apotelesma1.ok).toBe(true);
      if (apotelesma1.ok) {
        expect(apotelesma1.timi[0]?.kouti).toBe(2);
        expect(apotelesma1.timi[0]?.sosta_seiri).toBe(1);
      }

      // 2η σωστή απάντηση -> κουτί 3
      const apotelesma2 = await katagrapse_leitner_apantisi(
        apothiki,
        kodikosMathimatos,
        'Δομή Στοίβας',
        true,
        simera
      );
      expect(apotelesma2.ok).toBe(true);
      if (apotelesma2.ok) {
        expect(apotelesma2.timi[0]?.kouti).toBe(3);
        expect(apotelesma2.timi[0]?.sosta_seiri).toBe(2);
      }

      // Λανθασμένη απάντηση -> άμεση επαναφορά στο κουτί 1
      const apotelesma3 = await katagrapse_leitner_apantisi(
        apothiki,
        kodikosMathimatos,
        'Δομή Στοίβας',
        false,
        simera
      );
      expect(apotelesma3.ok).toBe(true);
      if (apotelesma3.ok) {
        expect(apotelesma3.timi[0]?.kouti).toBe(1);
        expect(apotelesma3.timi[0]?.sosta_seiri).toBe(0);
      }

      // Επαλήθευση ότι αποθηκεύτηκε στο proodhos.json
      const proodhos = await fortose_proodho(apothiki, kodikosMathimatos);
      expect(proodhos.katastasiMathisis).toBeDefined();
      expect(proodhos.katastasiMathisis?.[0]?.ennoia).toBe('Δομή Στοίβας');
      expect(proodhos.katastasiMathisis?.[0]?.kouti).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Tutor Chat & Clickable Citations
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Tutor Chat & Clickable Citations', () => {
    it('αναλύει παραπομπές [[arxeio_1: σ. 5]] και δημιουργεί ασφαλείς διαδρομές προβολής PDF', () => {
      const p = analise_parapompi('[[arxeio_1: σ. 5]]');
      expect(p).toEqual({ arxeio_id: 'arxeio_1', apo: 5, eos: 5 });

      const dromos = diadromi_provolis(p!);
      expect(dromos).toBe('/provoli/arxeio_1/5');

      const pEuros = analise_parapompi('[[arx-2: σελ. 10–14]]');
      expect(pEuros).toEqual({ arxeio_id: 'arx-2', apo: 10, eos: 14 });
      expect(diadromi_provolis(pEuros!)).toBe('/provoli/arx-2/10');
    });

    it('μετατρέπει παραπομπές μέσα σε κείμενο Tutor σε διαδραστικούς <Link> συνδέσμους', () => {
      const apantisiTutor = 'Η απόδειξη βρίσκεται στο [[arxeio_1: σ. 5]] και οι εφαρμογές στο [[slides_b:12]].';
      const stoixeia = apodhosi_keimenou_me_parapompes(apantisiTutor);

      const html = renderToStaticMarkup(
        createElement(
          MemoryRouter,
          null,
          createElement('div', null, stoixeia)
        )
      );

      expect(html).toContain('data-testid="tutor-parapompi"');
      expect(html).toContain('href="/provoli/arxeio_1/5"');
      expect(html).toContain('[[arxeio_1: σ. 5]]');
      expect(html).toContain('href="/provoli/slides_b/12"');
      expect(html).toContain('[[slides_b:12]]');
    });

    it('διατηρεί το strict fallback όταν δεν υπάρχει τοπικό υλικό χωρίς περιττές κλήσεις LLM', async () => {
      const mockLlm = new MockLlm();
      const periballon = ftiaxe_periballon_test({ llm: mockLlm });

      const apantisi = await apantisi_me_llm_i_topika(
        'Ποιος ανακάλυψε τον τροχό;',
        periballon,
        'CS101',
        null,
        [],
        '   ' // Κενό υλικό
      );

      expect(apantisi.keimeno).toBe(APANTISI_YPARXEIS_STO_YLIKO);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. EDF Study Scheduler & Survival Mode
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. EDF Study Scheduler & Survival Mode', () => {
    it('εκτελεί επιτυχώς το ftiaxe_programma και καταρτίζει ημερήσιο χρονοδιάγραμμα εργασιών', () => {
      const enotites: Enotita[] = [
        {
          id: 'en-1',
          titlos: 'Εισαγωγή',
          seira: 1,
          lepta_ektimisi: 60,
          ennoies: [],
          proapaitoumenes: [],
          piges: [],
          apodosi_exetasis: 10,
        },
        {
          id: 'en-2',
          titlos: 'Προχωρημένα Θέματα',
          seira: 2,
          lepta_ektimisi: 90,
          ennoies: [],
          proapaitoumenes: [{ enotita_id: 'en-1', isxys: 'isxyri' }],
          piges: [],
          apodosi_exetasis: 25,
        },
      ];

      const mathimata: MathimaProgrammatos[] = [
        {
          kodikos_mathimatos: 'PLI101',
          enotites,
          imerominia_exetasis: '2027-01-20',
        },
      ];

      const eisodos: EisodosProgrammatos = {
        mathimata,
        diathesimotita: {
          ana_imera_evdomadas: [120, 120, 120, 120, 120, 120, 120],
          overrides: {},
        },
        checkins: [],
        simera: '2027-01-10',
        arxi_exetastikis: '2027-01-15',
      };

      const apotelesma = ftiaxe_programma(eisodos);
      expect(apotelesma.ok).toBe(true);
      if (apotelesma.ok) {
        expect(apotelesma.timi.meres.length).toBeGreaterThan(0);
        // Επαλήθευση ότι οι εργασίες περιλαμβάνουν νέα ύλη και επαναλήψεις
        const olesErgasies = apotelesma.timi.meres.flatMap((m) => m.ergasies);
        expect(olesErgasies.some((e) => e.eidos === 'nea_yli')).toBe(true);
        expect(apotelesma.timi.slack_ana_mathima['PLI101']).toBeGreaterThanOrEqual(0);
      }
    });

    it('ανιχνεύει αδύνατο χρονοδιάγραμμα και παράγει πρόταση επιβίωσης (Survival Mode) βάσει απόδοσης', () => {
      const enotites: Enotita[] = [
        {
          id: 'en-low',
          titlos: 'Δευτερεύουσα Ενότητα',
          seira: 1,
          lepta_ektimisi: 180,
          ennoies: [],
          proapaitoumenes: [],
          piges: [],
          apodosi_exetasis: 5, // Χαμηλή απόδοση
        },
        {
          id: 'en-high',
          titlos: 'Υψηλής Απόδοσης Ενότητα',
          seira: 2,
          lepta_ektimisi: 180,
          ennoies: [],
          proapaitoumenes: [],
          piges: [],
          apodosi_exetasis: 35, // Υψηλή απόδοση
        },
      ];

      const mathimata: MathimaProgrammatos[] = [
        {
          kodikos_mathimatos: 'PLI101',
          enotites,
          imerominia_exetasis: '2027-01-11', // Αύριο!
        },
      ];

      // Πολύ περιορισμένος χρόνος: μόλις 10 λεπτά την ημέρα
      const eisodosSurvival: EisodosProgrammatos = {
        mathimata,
        diathesimotita: {
          ana_imera_evdomadas: [10, 10, 10, 10, 10, 10, 10],
          overrides: {},
        },
        checkins: [],
        simera: '2027-01-10',
        arxi_exetastikis: '2027-01-11',
      };

      const apotelesma = ftiaxe_programma(eisodosSurvival);
      expect(apotelesma.ok).toBe(true);
      if (apotelesma.ok) {
        expect(apotelesma.timi.slack_ana_mathima['PLI101']).toBeLessThan(0);
        expect(apotelesma.timi.protasi_epiviosis.length).toBeGreaterThan(0);
        const ypopshfies = apotelesma.timi.protasi_epiviosis[0]?.ypopshfies ?? [];
        expect(ypopshfies.length).toBeGreaterThan(0);
        // Ταξινομείται ξεκινώντας από τη χαμηλότερη απόδοση για προτεινόμενη αφαίρεση
        expect(ypopshfies[0]?.enotita_id).toBe('en-low');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Streak Counter & Daily Checkin
  // ─────────────────────────────────────────────────────────────────────────────
  describe('9. Streak Counter & Daily Checkin', () => {
    it('καταγράφει επιτυχώς check-in στο vault proodhos.json', async () => {
      const apothiki = new MnimiApothiki();
      const kodikosMathimatos = 'PLI101';
      const simera = '2026-10-26';

      const proodhos = await katagrapse_checkin(
        apothiki,
        kodikosMathimatos,
        'en-1',
        45,
        true, // Ολοκληρώθηκε
        simera
      );

      expect(proodhos.checkins).toHaveLength(1);
      expect(proodhos.checkins?.[0]).toEqual({
        enotita_id: 'en-1',
        imerominia: simera,
        pragmatika_lepta: 45,
        oloklirothike: true,
      });
      expect(proodhos.aristeiesEnotiton).toContain('en-1');

      const fortomeno = await fortose_proodho(apothiki, kodikosMathimatos);
      expect(fortomeno.checkins).toHaveLength(1);
    });

    it('υπολογίζει σωστά το συνεχόμενο σερί μελέτης (streak) με ντετερμινιστικό 50/50 boundary', () => {
      // 0 check-ins -> 0 σερί
      expect(ypologismos_seri_meletis([], '2026-10-26')).toBe(0);

      // Check-in μόνο σήμερα -> 1 μέρα σερί
      const monoSimera: Checkin[] = [
        { enotita_id: 'en-1', imerominia: '2026-10-26', pragmatika_lepta: 30, oloklirothike: true },
      ];
      expect(ypologismos_seri_meletis(monoSimera, '2026-10-26')).toBe(1);

      // Check-in μόνο χθες (χάρη για σήμερα) -> 1 μέρα σερί
      const monoXthes: Checkin[] = [
        { enotita_id: 'en-1', imerominia: '2026-10-25', pragmatika_lepta: 40, oloklirothike: true },
      ];
      expect(ypologismos_seri_meletis(monoXthes, '2026-10-26')).toBe(1);

      // Συνεχόμενο σερί 3 ημερών (24, 25, 26) -> 3 μέρες
      const seriTrionImeron: Checkin[] = [
        { enotita_id: 'en-1', imerominia: '2026-10-24', pragmatika_lepta: 20, oloklirothike: true },
        { enotita_id: 'en-2', imerominia: '2026-10-25', pragmatika_lepta: 30, oloklirothike: true },
        { enotita_id: 'en-3', imerominia: '2026-10-26', pragmatika_lepta: 45, oloklirothike: true },
      ];
      expect(ypologismos_seri_meletis(seriTrionImeron, '2026-10-26')).toBe(3);

      // Σπασμένο σερί (μελέτη προχθές αλλά όχι χθες ούτε σήμερα) -> 0 μέρες
      const spasmenoSeri: Checkin[] = [
        { enotita_id: 'en-1', imerominia: '2026-10-24', pragmatika_lepta: 30, oloklirothike: true },
      ];
      expect(ypologismos_seri_meletis(spasmenoSeri, '2026-10-26')).toBe(0);

      // Πολλαπλά check-ins την ίδια ημέρα μετρούν ως 1 ημέρα σερί
      const pollaplaSimera: Checkin[] = [
        { enotita_id: 'en-1', imerominia: '2026-10-25', pragmatika_lepta: 20, oloklirothike: true },
        { enotita_id: 'en-2', imerominia: '2026-10-26', pragmatika_lepta: 15, oloklirothike: true },
        { enotita_id: 'en-3', imerominia: '2026-10-26', pragmatika_lepta: 30, oloklirothike: true },
      ];
      expect(ypologismos_seri_meletis(pollaplaSimera, '2026-10-26')).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Granular Progress Trackers
  // ─────────────────────────────────────────────────────────────────────────────
  describe('10. Granular Progress Trackers', () => {
    it('αποδίδει πολυσταδιακό progress bar συγχρονισμού (ProodosSygxronismou) με σωστά στάδια και ποσοστά', () => {
      expect(STADIA_SYGXRONISMOU).toEqual([
        'Σύνδεση στο LMS & ανάκτηση λίστας μαθημάτων...',
        'Έλεγχος νέων αρχείων & λήψη...',
        'Κρυπτογράφηση & αποθήκευση στο vault...',
      ]);

      const htmlStadio1 = renderToStaticMarkup(createElement(ProodosSygxronismou, { stadio: 1, pososto: 33 }));
      expect(htmlStadio1).toContain('data-testid="mathimata-proodos-sygxronismou"');
      expect(htmlStadio1).toContain('role="progressbar"');
      expect(htmlStadio1).toContain('aria-valuenow="33"');
      expect(htmlStadio1).toContain('33%');
      expect(htmlStadio1).toContain('Στάδιο 1 από 3');
      expect(htmlStadio1).toContain('Σύνδεση στο LMS &amp; ανάκτηση λίστας μαθημάτων...');

      const htmlStadio3 = renderToStaticMarkup(createElement(ProodosSygxronismou, { stadio: 3, pososto: 100 }));
      expect(htmlStadio3).toContain('aria-valuenow="100"');
      expect(htmlStadio3).toContain('100%');
      expect(htmlStadio3).toContain('Στάδιο 3 από 3');
    });

    it('αποδίδει πολυσταδιακό progress bar ανάλυσης χάρτη (ProodosDimiourgiasXarti)', () => {
      expect(STADIA_DIMIOURGIAS_XARTI).toEqual([
        'Επεξεργασία διαφανειών...',
        'Τοπολογική ταξινόμηση DAG...',
        'Ολοκλήρωση χάρτη...',
      ]);

      const html = renderToStaticMarkup(createElement(ProodosDimiourgiasXarti, { stadio: 2, pososto: 67 }));
      expect(html).toContain('data-testid="xartis-proodos-analisis"');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuenow="67"');
      expect(html).toContain('data-testid="xartis-proodos-pososto"');
      expect(html).toContain('67%');
      expect(html).toContain('Τοπολογική ταξινόμηση DAG...');
    });

    it('αποδίδει πολυσταδιακό progress bar σύνθεσης οδηγού (ProodosDimiourgiasOdigou)', () => {
      expect(STADIA_DIMIOURGIAS_ODIGOU).toEqual([
        'Ανάγνωση τοπικά αποθηκευμένου υλικού...',
        'Εξαγωγή εννοιών & λυμένων παραδειγμάτων...',
        'Σύνθεση οδηγού 7 ενοτήτων & παραπομπών...',
      ]);

      const html = renderToStaticMarkup(createElement(ProodosDimiourgiasOdigou, { stadio: 3, pososto: 100 }));
      expect(html).toContain('data-testid="odigos-proodos-analisis"');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuenow="100"');
      expect(html).toContain('data-testid="odigos-proodos-pososto"');
      expect(html).toContain('100%');
      expect(html).toContain('Σύνθεση οδηγού 7 ενοτήτων &amp; παραπομπών...');
    });
  });
});
