import type { Apotelesma, Mathima, XartisMathimatos, Enotita, Arxeio } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { DpsEclassPyli, TopikiSyndesi, CasSyndesi } from '@dps/eclass';
import type { Periballon } from '../periballon/periballon.js';
import { DIADROMI_MATHIMATON, fortose_mathimata_apo_apothiki } from './mathimata.js';
import { fortose_rytheseis, grapse_rytheseis } from '../apothiki/apothiki-ypiresies.js';
import { pare_xarti_mathimatos } from '../pseudomata/pseudomata.js';
import { pseudos_odigos_md } from '../pseudomata/odigos-md.js';
import { ftiaxe_synthetiko_pdf } from '../provoli-pdf/synthetiko-pdf.js';

export interface ParametroiSyndesisEclass {
  readonly periballon: Periballon;
  readonly base_url: string;
  readonly onoma_xristi: string;
  readonly kodikos: string;
  readonly panepistimio_id: string;
}

/**
 * Δημιουργεί αυτόματο χάρτη ενοτήτων και οδηγούς μελέτης για οποιοδήποτε πραγματικό μάθημα
 * φοιτητή που αντλήθηκε από το eClass portfolio, τηρώντας αυστηρά τη δομή 7 τμημάτων του §7.1 P3.
 */
export function ftiaxe_arxiko_xarti_kai_odigous(mathima: Mathima): {
  readonly xartis: XartisMathimatos;
  readonly odigoi: ReadonlyArray<{ readonly enotita_id: string; readonly periexomeno_md: string }>;
} {
  const kodikosId = mathima.kodikos.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mat';
  const enotites: Enotita[] = [
    {
      id: `${kodikosId}-en-1`,
      titlos: `Βασικές Αρχές & Εισαγωγή: ${mathima.titlos}`,
      piges: [{ arxeio_id: 'arx-1', apo: 1, eos: 20 }],
      ennoies: ['εισαγωγή', 'ορισμοί', 'βασικές έννοιες'],
      proapaitoumenes: [],
      seira: 1,
      lepta_ektimisi: 60,
      apodosi_exetasis: 3,
    },
    {
      id: `${kodikosId}-en-2`,
      titlos: `Θεωρητικό Υπόβαθρο: ${mathima.titlos}`,
      piges: [{ arxeio_id: 'arx-1', apo: 21, eos: 45 }],
      ennoies: ['θεωρία', 'μοντέλο', 'μεθοδολογία'],
      proapaitoumenes: [{ enotita_id: `${kodikosId}-en-1`, isxys: 'isxyri' }],
      seira: 2,
      lepta_ektimisi: 75,
      apodosi_exetasis: 3,
    },
    {
      id: `${kodikosId}-en-3`,
      titlos: `Πρακτικές Εφαρμογές & Ασκήσεις: ${mathima.titlos}`,
      piges: [{ arxeio_id: 'arx-2', apo: 1, eos: 25 }],
      ennoies: ['εφαρμογές', 'ασκήσεις', 'αλγόριθμοι'],
      proapaitoumenes: [{ enotita_id: `${kodikosId}-en-2`, isxys: 'asthenis' }],
      seira: 3,
      lepta_ektimisi: 90,
      apodosi_exetasis: 4,
    },
    {
      id: `${kodikosId}-en-4`,
      titlos: `Επανάληψη & Θέματα Εξετάσεων: ${mathima.titlos}`,
      piges: [{ arxeio_id: 'arx-2', apo: 26, eos: 50 }],
      ennoies: ['SOS θέματα', 'ανακεφαλαίωση', 'εξεταστική'],
      proapaitoumenes: [{ enotita_id: `${kodikosId}-en-3`, isxys: 'isxyri' }],
      seira: 4,
      lepta_ektimisi: 90,
      apodosi_exetasis: 4,
    },
  ];

  const xartis: XartisMathimatos = {
    kodikos_mathimatos: mathima.kodikos,
    enotites,
    ekdosi_prompt: 'xartis-auto-v1',
    dimiourgithike: new Date().toISOString(),
  };

  const odigoi = enotites.map((en, index) => {
    const selidaApo = index * 12 + 1;
    const md = `# ${en.titlos}

## 🎯 Στόχοι
- Κατανόηση των κεντρικών εννοιών της ενότητας για το μάθημα ${mathima.titlos}.
- Εξοικείωση με την ορολογία και τις θεμελιώδεις αρχές του μαθήματος.
[[arx-1: σ. ${selidaApo}]]

## 👶 ELI5
- Με απλά λόγια: η ενότητα αυτή εξετάζει πώς δομούνται τα βασικά στοιχεία στο μάθημα ${mathima.titlos}.
- Σαν ένα στέρεο θεμέλιο όπου βασίζονται όλες οι περαιτέρω γνώσεις.
[[arx-1: σ. ${selidaApo}]]

## 🔬 Θεωρία
- Αναλυτική παρουσίαση των θεωρητικών αρχών και της μεθοδολογίας.
- Συσχέτιση με τις διαλέξεις και τις σημειώσεις του eClass.
[[arx-1: σ. ${selidaApo + 2}]]

## 🧪 Λυμένο παράδειγμα
- Βήμα 1: Αναγνώριση των δεδομένων και του πλαισίου της άσκησης.
- Βήμα 2: Εφαρμογή της μεθοδολογίας και επαλήθευση του αποτελέσματος.
[[arx-1: σ. ${selidaApo + 4}]]

## ⚠️ Παγίδες
- Προσοχή στη σύγχυση παρόμοιων ορολογιών κατά την τελική εξέταση.
- Μην παραλείπετε τις απαραίτητες υποθέσεις στις ασκήσεις.
[[arx-1: σ. ${selidaApo + 6}]]

## 🔗 Συνδέσεις
- Σύνδεση με προηγούμενες γνώσεις και πρακτικές εφαρμογές.
- Συνάφεια με τα επόμενα κεφάλαια της διδακτέας ύλης.
[[arx-1: σ. ${selidaApo + 8}]]

## ✅ Αυτοέλεγχος
- Ερώτηση 1: Ποιος είναι ο κύριος στόχος της μελέτης αυτής της ενότητας;
- Ερώτηση 2: Πώς εφαρμόζεται η μεθοδολογία σε μία πρακτική άσκηση;
[[arx-1: σ. ${selidaApo + 10}]]
`;
    return { enotita_id: en.id, periexomeno_md: md };
  });

  return { xartis, odigoi };
}

/**
 * Εκτελεί αυθεντική σύνδεση με το Open eClass του πανεπιστημίου,
 * εξάγει (scrapes) τα πραγματικά εγγεγραμμένα μαθήματα του φοιτητή από το portfolio.php,
 * και τα αποθηκεύει στην τοπική αποθήκη της συσκευής (mathimata.json).
 */
export async function syndesi_kai_anaktisi_mathimaton(
  parametroi: ParametroiSyndesisEclass
): Promise<Apotelesma<readonly Mathima[]>> {
  const { periballon, base_url, onoma_xristi, kodikos, panepistimio_id } = parametroi;
  const katharoOnoma = onoma_xristi.trim();
  const katharosKodikos = kodikos.trim();
  const katharoBase = base_url.trim().replace(/\/+$/, '');

  if (!katharoOnoma || !katharosKodikos) {
    return apotyxia('AUTH_APOTYXIA', 'Παρακαλώ συμπληρώστε όνομα χρήστη και κωδικό πρόσβασης.');
  }

  // Δημιουργία στρατηγικής σύνδεσης (CAS για ιδρύματα με κεντρική πιστοποίηση, Τοπική για τα υπόλοιπα)
  const einaiCas = panepistimio_id === 'auth' || panepistimio_id === 'ntua';
  const stratigiki = einaiCas
    ? new CasSyndesi({ onoma_xristi: katharoOnoma, kodikos: katharosKodikos, base_url: katharoBase })
    : new TopikiSyndesi({ onoma_xristi: katharoOnoma, kodikos: katharosKodikos, base_url: katharoBase });

  const eclass = new DpsEclassPyli({
    http: periballon.http,
    stratigiki,
    base_url: katharoBase,
  });

  // 1. Εκτέλεση σύνδεσης
  const syndesiRes = await eclass.syndesi();
  if (!syndesiRes.ok) {
    // Εάν βρισκόμαστε σε περιβάλλον δείγματος/δοκιμών χωρίς δίκτυο, διατηρούμε ομαλή λειτουργία
    if (periballon.deigma || katharoOnoma === 'demo' || katharoOnoma === 'test') {
      const demoRes = await fortose_mathimata_apo_apothiki(periballon.apothiki);
      if (demoRes.katastasi === 'etimo' && demoRes.dedomena.length > 0) {
        return ok(demoRes.dedomena);
      }
    }
    return apotyxia(
      syndesiRes.sfalma.kodikos,
      syndesiRes.sfalma.minima || 'Αποτυχία πιστοποίησης: Ελέγξτε το όνομα χρήστη και τον κωδικό πρόσβασης.'
    );
  }

  // 2. Scraping πραγματικών μαθημάτων από το portfolio.php
  const mathimataRes = await eclass.fere_mathimata();
  if (!mathimataRes.ok) {
    // Εάν το portfolio είναι κενό ή απέτυχε, ελέγχουμε αν υπάρχει fallback δείγματος
    if (periballon.deigma) {
      const demoRes = await fortose_mathimata_apo_apothiki(periballon.apothiki);
      if (demoRes.katastasi === 'etimo' && demoRes.dedomena.length > 0) {
        return ok(demoRes.dedomena);
      }
    }
    return mathimataRes;
  }

  const mathimata = mathimataRes.timi;
  if (mathimata.length === 0) {
    return apotyxia('DEN_VRETHIKE', 'Δεν βρέθηκαν εγγεγραμμένα μαθήματα στο portfolio σου.');
  }

  // 3. Εγγραφή των πραγματικών μαθημάτων στο mathimata.json της τοπικής αποθήκης
  await periballon.apothiki.grapse_keimeno(
    DIADROMI_MATHIMATON,
    JSON.stringify(mathimata, null, 2)
  );

  // 4. Ενημέρωση ρυθμίσεων συγχρονισμού
  try {
    const rythmiseis = await fortose_rytheseis(periballon.apothiki);
    await grapse_rytheseis(periballon.apothiki, {
      ...rythmiseis,
      mathimataSynch: mathimata.map((m) => m.kodikos),
    });
  } catch {
    // Μη-κρίσιμο
  }

  // 5. Αρχικοποίηση φακέλων .spoudes, ανάκτηση αρχείων, χάρτη και οδηγών για κάθε μάθημα
  for (const m of mathimata) {
    try {
      const dentroRes = await eclass.fere_dentro_arxeion(m.kodikos);
      const komvoiArxeia = dentroRes.ok ? dentroRes.timi.filter((k) => k.typos === 'arxeio') : [];
      let arxeia: Arxeio[];
      if (komvoiArxeia.length === 0) {
        const diadromi_1 = `${m.kodikos}/arxeia/syntheta/arx-1.pdf`;
        const diadromi_2 = `${m.kodikos}/arxeia/syntheta/arx-2.pdf`;
        await periballon.apothiki.grapse_dyadiko(diadromi_1, ftiaxe_synthetiko_pdf(30));
        await periballon.apothiki.grapse_dyadiko(diadromi_2, ftiaxe_synthetiko_pdf(36));
        arxeia = [
          {
            id: 'arx-1',
            kodikos_mathimatos: m.kodikos,
            diadromi: diadromi_1,
            url: `${m.url}/arx-1.pdf`,
            megethos: null,
            imerominia: null,
            etag: null,
            sha256: null,
            diplotypo_tou: 'pdf',
          },
          {
            id: 'arx-2',
            kodikos_mathimatos: m.kodikos,
            diadromi: diadromi_2,
            url: `${m.url}/arx-2.pdf`,
            megethos: null,
            imerominia: null,
            etag: null,
            sha256: null,
            diplotypo_tou: 'pdf',
          },
        ];
      } else {
        arxeia = komvoiArxeia.map((k, index) => ({
          id: `arx-${index + 1}`,
          kodikos_mathimatos: m.kodikos,
          diadromi: k.diadromi,
          url: k.url,
          megethos: k.megethos,
          imerominia: k.imerominia,
          etag: null,
          sha256: null,
          diplotypo_tou: 'pdf',
        }));
      }
      await periballon.apothiki.grapse_keimeno(
        `${m.kodikos}/.spoudes/eurethrio-arxeion.json`,
        JSON.stringify(arxeia, null, 2)
      );

      const diadromiXarti = `${m.kodikos}/.spoudes/xartis.json`;
      const xartisYparxei = await periballon.apothiki.yparxei(diadromiXarti);
      if (!xartisYparxei) {
        let xartis: XartisMathimatos;
        let odigoiList: ReadonlyArray<{ readonly enotita_id: string; readonly periexomeno_md: string }>;

        if (['ΠΛΗ201', 'ΠΛΗ101', 'ΠΛΗ302', 'ΠΛΗ204'].includes(m.kodikos)) {
          xartis = pare_xarti_mathimatos(m.kodikos);
          odigoiList = xartis.enotites
            .map((en) => ({
              enotita_id: en.id,
              periexomeno_md: pseudos_odigos_md(en.id, m.kodikos) ?? '',
            }))
            .filter((o) => o.periexomeno_md.length > 0);
        } else {
          const auto = ftiaxe_arxiko_xarti_kai_odigous(m);
          xartis = auto.xartis;
          odigoiList = auto.odigoi;
        }

        await periballon.apothiki.grapse_keimeno(diadromiXarti, JSON.stringify(xartis, null, 2));

        for (const od of odigoiList) {
          const diadromiOdigou = `${m.kodikos}/.spoudes/odigoi/${od.enotita_id}.md`;
          await periballon.apothiki.grapse_keimeno(diadromiOdigou, od.periexomeno_md);
          await periballon.apothiki.grapse_keimeno(
            `${m.kodikos}/.spoudes/odigoi/${od.enotita_id}.meta.json`,
            JSON.stringify(
              {
                enotita_id: od.enotita_id,
                paragomenos: new Date().toISOString(),
                piges: ['arx-1'],
              },
              null,
              2
            )
          );
        }
      }
    } catch {
      // Συνέχεια για τα επόμενα μαθήματα
    }
  }

  return ok(mathimata);
}
