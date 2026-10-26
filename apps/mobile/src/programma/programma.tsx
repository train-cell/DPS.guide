import { useCallback, useEffect, useMemo, useState } from 'react';
import { IonButton } from '@ionic/react';
import type { Checkin, EisodosProgrammatos, Enotita, MathimaProgrammatos, Programma } from '@dps/core';
import { ftiaxe_programma, parage_arxeio_ics } from '@dps/core';
import { deliverEncryptedBackup } from '../vault/backup-file.js';
import { Karta, OloniKatastasis, Pilegma, ProskelesioOmonimas } from '../koinima/index.js';
import { etimo, type Katastasi } from '../kathstasi/index.js';
import type { Rytheseis } from '../apothiki/index.js';
import { fortose_proodho, fortose_rytheseis, grapse_rytheseis, xrisiApothekisis } from '../apothiki/index.js';
import { fortose_apodosi, fortose_mathimata_apo_apothiki, fortose_xartis_apo_apothiki } from '../ypiresies/index.js';
import { xrisiPeriballontos } from '../periballon/index.js';
import {
  IMERES_EVDOMADAS,
  TROPOI_EXETASIS,
  ETIKETES_TROPON,
  type ArithmosImeras,
  type ExetasiP1,
  type OverrideLepton,
  type TemplateLepton,
} from './programma-typoi.js';
import {
  MINIMA_AKYRIS_ARXIS,
  MINIMA_AKYRIS_EXETASIS,
  MINIMA_AKYRON_OVERRIDES,
  PROEDAFO_TEMPLATE,
  einai_egkyri_exetasi,
  enimerose_template,
  exetasi_simvolaiou,
  kilise_lepta,
  nea_exetasi,
  pare_programma_rytheseis,
  stilise_imerominia,
  synolika_lepta_template,
} from './programma-vohthia.js';
import './programma.css';

export { PROEDAFO_TEMPLATE };

/** Μια ημερομηνία με τα λεπτά της, όπως τη συμπληρώνει η φόρμα (τα λεπτά ως κείμενο). */
interface OverrideDraft {
  readonly imerominia: string;
  readonly lepta: string;
}

/** Το προσχέδιο της φόρμας προγράμματος, όπως το κρατά η οθόνη. */
export interface DraftProgrammatos {
  readonly exetaseis: readonly ExetasiP1[];
  readonly arxiExetastikis: string;
  readonly templateLepton: TemplateLepton;
  readonly overrides: readonly OverrideDraft[];
}

/** Δεδομένα μαθήματος για τον υπολογισμό του προγράμματος μελέτης. */
export interface DedomenaMathimatosMeleti {
  readonly kodikos: string;
  readonly enotites: readonly Enotita[];
  readonly checkins: readonly Checkin[];
  readonly apodosi?: Readonly<Record<string, number>> | undefined;
}

export interface RythmiseisProgrammatosProps {
  readonly arxikaMathimata?: readonly DedomenaMathimatosMeleti[] | undefined;
  readonly arxikoDraft?: DraftProgrammatos | undefined;
}

/** Κείμενο κουμπιού προσθήκης εξέτασης. */
const KEIMENO_PROSTHESIS_EXETASIS = '+ Εξέταση';

/** Κείμενο κουμπιού προσθήκης εξαίρεσης. */
const KEIMENO_PROSTHESIS_OVERRIDE = '+ Εξαίρεση';

/** Σειρά νέων εξαιρέσεων όταν η λίστα είναι κενή. */
const NEES_OVERRIDES_KEIMENO = 'Καμία εξαίρεση ακόμη.';

/** Μετατρέπει αποθηκευμένες ρυθμίσεις σε προσχέδιο φόρμας. */
export function draft_apo_rytheseis(rytheseis: Rytheseis): DraftProgrammatos {
  const programma = pare_programma_rytheseis(rytheseis);
  return {
    exetaseis: programma.exetaseis.map((e) => ({
      kodikos: e.kodikos_mathimatos,
      imerominia: e.imerominia ?? '',
      tropos: e.tropos,
    })),
    arxiExetastikis: rytheseis.arxiExetastikis ?? '',
    templateLepton: programma.templateLepton,
    overrides: rytheseis.overridesLepton.map((o) => ({
      imerominia: o.imerominia,
      lepta: String(o.lepta),
    })),
  };
}

/** Οθόνη ρυθμίσεων προγράμματος: εξετάσεις, έναρξη εξεταστικής, template λεπτών, εξαιρέσεις. */
export default function RythmiseisProgrammatos({
  arxikaMathimata,
  arxikoDraft,
}: RythmiseisProgrammatosProps = {}) {
  const periballon = xrisiPeriballontos();
  const apothiki = xrisiApothekisis();
  const [katastasi, setKatastasi] = useState<Katastasi<Rytheseis>>(() =>
    etimo<Rytheseis>(apothiki.rytheseis)
  );
  const [rytheseis, setRytheseis] = useState<Rytheseis | null>(() => apothiki.rytheseis);
  const [draft, setDraft] = useState<DraftProgrammatos | null>(() =>
    arxikoDraft ?? draft_apo_rytheseis(apothiki.rytheseis)
  );
  const [apothikefthike, setApothikefthike] = useState(false);
  const [minimaSfalmatos, setMinimaSfalmatos] = useState<string | null>(null);
  const [mathimataMeletis, setMathimataMeletis] = useState<readonly DedomenaMathimatosMeleti[]>(
    () => (arxikaMathimata ?? []).map((m) => ({
      ...m,
      enotites: m.enotites.map((en) => ({
        ...en,
        apodosi_exetasis: m.apodosi?.[en.id] ?? en.apodosi_exetasis ?? null,
      })),
    }))
  );

  const fortose = useCallback(() => {
    void (async () => {
      const fotismenes = await fortose_rytheseis(periballon.apothiki);
      setKatastasi(etimo<Rytheseis>(fotismenes));
      setRytheseis(fotismenes);
      setDraft(draft_apo_rytheseis(fotismenes));

      const mathimataApotelesma = await fortose_mathimata_apo_apothiki(periballon.apothiki);
      const mathimataLista = mathimataApotelesma.katastasi === 'etimo' ? mathimataApotelesma.dedomena : [];
      const sygxronismena = mathimataLista.filter(
        (m) =>
          fotismenes.mathimataSynch.includes(m.kodikos) ||
          m.katastasi_sygxronismou === 'Συγχρονισμένο' ||
          m.epilegmeno
      );
      const mathimataGiaFortosi = sygxronismena.length > 0 ? sygxronismena : mathimataLista;

      const dedomena: DedomenaMathimatosMeleti[] = [];
      for (const m of mathimataGiaFortosi) {
        const [xartisApotelesma, proodhos, apodosiRecord] = await Promise.all([
          fortose_xartis_apo_apothiki(periballon.apothiki, m.kodikos),
          fortose_proodho(periballon.apothiki, m.kodikos),
          fortose_apodosi(periballon.apothiki, m.kodikos),
        ]);
        if (xartisApotelesma.katastasi === 'etimo' && xartisApotelesma.dedomena.enotites.length > 0) {
          const enotitesMeApodosi: Enotita[] = xartisApotelesma.dedomena.enotites.map((en) => ({
            ...en,
            apodosi_exetasis: apodosiRecord[en.id] ?? en.apodosi_exetasis ?? null,
          }));
          dedomena.push({
            kodikos: m.kodikos,
            enotites: enotitesMeApodosi,
            checkins: proodhos.checkins ?? [],
            apodosi: apodosiRecord,
          });
        }
      }
      setMathimataMeletis(dedomena);
    })();
  }, [periballon.apothiki]);

  const programma = useMemo<Programma | null>(() => {
    if (draft === null || mathimataMeletis.length === 0) {
      return null;
    }

    const simeraImerominia = new Date().toISOString().slice(0, 10);
    const arxiKathari = draft.arxiExetastikis.trim();
    const arxiExetastikis =
      arxiKathari.length > 0 && stilise_imerominia(arxiKathari) !== null ? arxiKathari : null;

    const mathimataProgrammatos: MathimaProgrammatos[] = [];
    for (const m of mathimataMeletis) {
      const exetasi = draft.exetaseis.find((e) => e.kodikos === m.kodikos);
      const imerominiaExetasis =
        exetasi && exetasi.imerominia.trim().length > 0 && stilise_imerominia(exetasi.imerominia.trim()) !== null
          ? exetasi.imerominia.trim()
          : null;

      if (imerominiaExetasis === null && arxiExetastikis === null) {
        continue;
      }

      const enotites: Enotita[] = m.enotites.map((en) => ({
        ...en,
        apodosi_exetasis: m.apodosi?.[en.id] ?? en.apodosi_exetasis ?? null,
        lepta_ektimisi:
          en.lepta_ektimisi !== null && Number.isFinite(en.lepta_ektimisi) && en.lepta_ektimisi >= 0
            ? en.lepta_ektimisi
            : 30,
      }));

      mathimataProgrammatos.push({
        kodikos_mathimatos: m.kodikos,
        enotites,
        imerominia_exetasis: imerominiaExetasis,
      });
    }

    if (mathimataProgrammatos.length === 0) {
      return null;
    }

    const templateLepton = draft.templateLepton ?? PROEDAFO_TEMPLATE;
    const ana_imera_evdomadas = [1, 2, 3, 4, 5, 6, 7].map((imeraNum) => {
      const grammi = templateLepton.find((g) => g.imera === imeraNum);
      return grammi ? kilise_lepta(grammi.lepta) : 0;
    });

    const overrides: Record<string, number> = {};
    for (const o of draft.overrides ?? []) {
      if (o.imerominia.trim().length > 0 && stilise_imerominia(o.imerominia.trim()) !== null) {
        overrides[o.imerominia.trim()] = kilise_lepta(Number(o.lepta));
      }
    }

    const checkins: Checkin[] = mathimataMeletis.flatMap((m) => [...m.checkins]);

    const eisodos: EisodosProgrammatos = {
      mathimata: mathimataProgrammatos,
      diathesimotita: {
        ana_imera_evdomadas,
        overrides,
      },
      checkins,
      simera: simeraImerominia,
      arxi_exetastikis: arxiExetastikis,
    };

    const apotelesma = ftiaxe_programma(eisodos);
    return apotelesma.ok ? apotelesma.timi : null;
  }, [draft, mathimataMeletis]);

  useEffect(() => {
    fortose();
  }, [fortose]);

  async function apothikefse(): Promise<void> {
    if (draft === null || rytheseis === null) {
      return;
    }
    setApothikefthike(false);
    if (!draft.exetaseis.every(einai_egkyri_exetasi)) {
      setMinimaSfalmatos(MINIMA_AKYRIS_EXETASIS);
      return;
    }
    const arxiKathari = draft.arxiExetastikis.trim();
    if (arxiKathari.length > 0 && stilise_imerominia(arxiKathari) === null) {
      setMinimaSfalmatos(MINIMA_AKYRIS_ARXIS);
      return;
    }
    const overrides: OverrideLepton[] = [];
    for (const override of draft.overrides) {
      if (stilise_imerominia(override.imerominia) === null) {
        setMinimaSfalmatos(MINIMA_AKYRON_OVERRIDES);
        return;
      }
      overrides.push({ imerominia: override.imerominia.trim(), lepta: kilise_lepta(Number(override.lepta)) });
    }
    setMinimaSfalmatos(null);

    const exetaseis = draft.exetaseis
      .map(exetasi_simvolaiou)
      .filter((e): e is NonNullable<typeof e> => e !== null);
    const nees: Rytheseis = {
      ...rytheseis,
      exetaseis,
      arxiExetastikis: arxiKathari.length > 0 ? arxiKathari : null,
      templateLepton: draft.templateLepton,
      overridesLepton: overrides,
    };
    await grapse_rytheseis(periballon.apothiki, nees);
    setRytheseis(nees);
    setApothikefthike(true);
  }

  const [eksagete, setEksagete] = useState(false);

  const xeirismosEksagogisIcs = useCallback(async () => {
    if (eksagete) return;
    setEksagete(true);
    try {
      const icsString = parage_arxeio_ics(
        programma ?? { meres: [], slack_ana_mathima: {}, protasi_epiviosis: [] },
        rytheseis?.exetaseis ? [...rytheseis.exetaseis] : [],
        mathimataMeletis.map((m) => ({
          kodikos: m.kodikos,
          titlos: m.kodikos,
          url: '',
          epilegmeno: true,
        }))
      );
      const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
      await deliverEncryptedBackup(blob, 'dps-programma.ics');
    } finally {
      setEksagete(false);
    }
  }, [eksagete, programma, rytheseis?.exetaseis, mathimataMeletis]);

  return (
    <div className="odoni-lista" data-testid="programma-ekran">
      <ProskelesioOmonimas
        titlos="Πρόγραμμα"
        ypokeimeno="Εξετάσεις, διαθεσιμότητα και πόσα λεπτά προτείνει κάθε ημέρα."
      />
      <OloniKatastasis
        katastasi={katastasi}
        adeioMinima="Δεν υπάρχουν αποθηκευμένες ρυθμίσεις προγράμματος."
        epanalipsiMinima="Ξανάφορτωση"
        epanalipsi={fortose}
      >
        {() =>
          draft === null ? null : (
            <>
              <Karta
                titlos="Εξετάσεις"
                ypokeimeno="Ημερομηνία και τρόπος εξέτασης ανά μάθημα."
                stoixeia={
                  <div data-testid="programma-exetaseis">
                    {draft.exetaseis.length === 0 && (
                      <Pilegma keimeno="Καμία εξέταση ακόμη. Πρόσθεσε την πρώτη." />
                    )}
                    {draft.exetaseis.map((exetasi, thesi) => (
                      <div className="programma-grammi" key={`exetasi-${thesi}`} data-testid="programma-exetasi">
                        <input
                          className="programma-gramma programma-gramma-kodikos"
                          data-testid="programma-exetasi-kodikos"
                          aria-label="Κωδικός μαθήματος"
                          placeholder="Κωδικός"
                          value={exetasi.kodikos}
                          onChange={(gevma) => {
                            setDraft((palio) =>
                              palio === null
                                ? palio
                                : {
                                    ...palio,
                                    exetaseis: palio.exetaseis.map((e, i) =>
                                      i === thesi ? { ...e, kodikos: gevma.target.value } : e
                                    ),
                                  }
                            );
                            setApothikefthike(false);
                          }}
                        />
                        <input
                          className="programma-gramma programma-gramma-imera"
                          data-testid="programma-exetasi-imera"
                          aria-label="Ημερομηνία εξέτασης"
                          type="date"
                          value={exetasi.imerominia}
                          onChange={(gevma) => {
                            setDraft((palio) =>
                              palio === null
                                ? palio
                                : {
                                    ...palio,
                                    exetaseis: palio.exetaseis.map((e, i) =>
                                      i === thesi ? { ...e, imerominia: gevma.target.value } : e
                                    ),
                                  }
                            );
                            setApothikefthike(false);
                          }}
                        />
                        <select
                          className="programma-gramma programma-gramma-tropos"
                          data-testid="programma-exetasi-tropos"
                          aria-label="Τρόπος εξέτασης"
                          value={exetasi.tropos}
                          onChange={(gevma) => {
                            setDraft((palio) =>
                              palio === null
                                ? palio
                                : {
                                    ...palio,
                                    exetaseis: palio.exetaseis.map((e, i) =>
                                      i === thesi
                                        ? { ...e, tropos: gevma.target.value as ExetasiP1['tropos'] }
                                        : e
                                    ),
                                  }
                            );
                            setApothikefthike(false);
                          }}
                        >
                          {TROPOI_EXETASIS.map((tropos) => (
                            <option key={tropos} value={tropos}>
                              {ETIKETES_TROPON[tropos]}
                            </option>
                          ))}
                        </select>
                        <IonButton
                          size="small"
                          fill="clear"
                          data-testid="programma-exetasi-afairesi"
                          aria-label={`Αφαίρεση εξέτασης ${exetasi.kodikos}`}
                          onClick={() => {
                            setDraft((palio) =>
                              palio === null
                                ? palio
                                : { ...palio, exetaseis: palio.exetaseis.filter((_, i) => i !== thesi) }
                            );
                            setApothikefthike(false);
                          }}
                        >
                          ✕
                        </IonButton>
                      </div>
                    ))}
                    <IonButton
                      size="small"
                      fill="outline"
                      data-testid="programma-exetasi-prosthesi"
                      onClick={() => {
                        setDraft((palio) =>
                          palio === null ? palio : { ...palio, exetaseis: [...palio.exetaseis, nea_exetasi()] }
                        );
                        setApothikefthike(false);
                      }}
                    >
                      {KEIMENO_PROSTHESIS_EXETASIS}
                    </IonButton>
                    {rytheseis && rytheseis.mathimataSynch.filter((k) => !draft.exetaseis.some((e) => e.kodikos === k)).length > 0 && (
                      <div className="programma-taxy-prosthesi">
                        <span className="odoni-xeiris-zeugos">Γρήγορη προσθήκη από τα μαθήματά σου:</span>
                        <div className="kapsoules-filtra-mpara">
                          {rytheseis.mathimataSynch
                            .filter((k) => !draft.exetaseis.some((e) => e.kodikos === k))
                            .map((kodikos) => (
                              <button
                                key={kodikos}
                                type="button"
                                className="kapsoula-filtrou"
                                onClick={() => {
                                  setDraft((palio) =>
                                    palio === null
                                      ? palio
                                      : {
                                          ...palio,
                                          exetaseis: [
                                            ...palio.exetaseis,
                                            {
                                              kodikos,
                                              imerominia: '2027-01-20',
                                              tropos: 'kleista_vivlia',
                                            },
                                          ],
                                        }
                                  );
                                  setApothikefthike(false);
                                }}
                              >
                                + {kodikos}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                }
              />

              <Karta
                titlos="Εξεταστική"
                ypokeimeno="Από πότε αρχίζει η εξεταστική, για να μην προτείνονται νέες ενότητες."
                stoixeia={
                  <div className="programma-grammi">
                    <label className="odoni-xeiris-zeugos" htmlFor="programma-arxi">
                      Έναρξη εξεταστικής
                    </label>
                    <input
                      id="programma-arxi"
                      className="programma-gramma programma-gramma-imera"
                      data-testid="programma-arxi"
                      aria-label="Έναρξη εξεταστικής"
                      type="date"
                      value={draft.arxiExetastikis}
                      onChange={(gevma) => {
                        setDraft((palio) =>
                          palio === null ? palio : { ...palio, arxiExetastikis: gevma.target.value }
                        );
                        setApothikefthike(false);
                      }}
                    />
                    <Pilegma
                      keimeno={
                        stilise_imerominia(draft.arxiExetastikis) ?? 'Δεν έχει οριστεί'
                      }
                    />
                  </div>
                }
              />

              <Karta
                titlos="Εβδομαδιαίο template"
                ypokeimeno="Πόσα λεπτά μελέτης προτείνει κάθε ημέρα, χωρίς τα check-ins."
                stoixeia={
                  <div data-testid="programma-template">
                    {IMERES_EVDOMADAS.map((imera) => (
                      <div className="programma-grammi" key={imera.arithmos}>
                        <span className="programma-gramma-onoma">{imera.onoma}</span>
                        <input
                          className="programma-gramma programma-gramma-lepta"
                          data-testid={`programma-template-${imera.arithmos}`}
                          aria-label={`Λεπτά ${imera.onoma}`}
                          type="number"
                          min={0}
                          value={String(
                            draft.templateLepton.find((g) => g.imera === imera.arithmos)?.lepta ?? 0
                          )}
                          onChange={(gevma) => {
                            setDraft((palio) =>
                              palio === null
                                ? palio
                                : {
                                    ...palio,
                                    templateLepton: enimerose_template(
                                      palio.templateLepton,
                                      imera.arithmos as ArithmosImeras,
                                      Number(gevma.target.value)
                                    ),
                                  }
                            );
                            setApothikefthike(false);
                          }}
                        />
                        <span className="programma-gramma-monada">λεπτά</span>
                      </div>
                    ))}
                    <Pilegma
                      keimeno={`Σύνολο εβδομάδας: ${synolika_lepta_template(draft.templateLepton)} λεπτά`}
                      entono
                    />
                  </div>
                }
              />

              <Karta
                titlos="Εξαιρέσεις"
                ypokeimeno="Ημέρες που αλλάζουν το template: εξετάσεις, ασθένεια, ταξίδια."
                stoixeia={
                  <div data-testid="programma-overrides">
                    {draft.overrides.length === 0 && (
                      <Pilegma keimeno={NEES_OVERRIDES_KEIMENO} />
                    )}
                    {draft.overrides.map((override, thesi) => (
                      <div className="programma-grammi" key={`override-${thesi}`} data-testid="programma-override">
                        <input
                          className="programma-gramma programma-gramma-imera"
                          data-testid="programma-override-imera"
                          aria-label="Ημερομηνία εξαίρεσης"
                          type="date"
                          value={override.imerominia}
                          onChange={(gevma) => {
                            setDraft((palio) =>
                              palio === null
                                ? palio
                                : {
                                    ...palio,
                                    overrides: palio.overrides.map((o, i) =>
                                      i === thesi ? { ...o, imerominia: gevma.target.value } : o
                                    ),
                                  }
                            );
                            setApothikefthike(false);
                          }}
                        />
                        <input
                          className="programma-gramma programma-gramma-lepta"
                          data-testid="programma-override-lepta"
                          aria-label="Λεπτά εξαίρεσης"
                          type="number"
                          min={0}
                          value={override.lepta}
                          onChange={(gevma) => {
                            setDraft((palio) =>
                              palio === null
                                ? palio
                                : {
                                    ...palio,
                                    overrides: palio.overrides.map((o, i) =>
                                      i === thesi ? { ...o, lepta: gevma.target.value } : o
                                    ),
                                  }
                            );
                            setApothikefthike(false);
                          }}
                        />
                        <span className="programma-gramma-monada">λεπτά</span>
                        <IonButton
                          size="small"
                          fill="clear"
                          data-testid="programma-override-afairesi"
                          aria-label="Αφαίρεση εξαίρεσης"
                          onClick={() => {
                            setDraft((palio) =>
                              palio === null
                                ? palio
                                : { ...palio, overrides: palio.overrides.filter((_, i) => i !== thesi) }
                            );
                            setApothikefthike(false);
                          }}
                        >
                          ✕
                        </IonButton>
                      </div>
                    ))}
                    <IonButton
                      size="small"
                      fill="outline"
                      data-testid="programma-override-prosthesi"
                      onClick={() => {
                        setDraft((palio) =>
                          palio === null
                            ? palio
                            : { ...palio, overrides: [...palio.overrides, { imerominia: '', lepta: '60' }] }
                        );
                        setApothikefthike(false);
                      }}
                    >
                      {KEIMENO_PROSTHESIS_OVERRIDE}
                    </IonButton>
                  </div>
                }
              />

              <div className="odoni-xeiris">
                <IonButton
                  data-testid="programma-apothikefsi"
                  onClick={() => {
                    void apothikefse();
                  }}
                >
                  Αποθήκευση προγράμματος
                </IonButton>
                <IonButton
                  fill="outline"
                  data-testid="programma-export-ics"
                  aria-label="Εξαγωγή Προγράμματος σε Ημερολόγιο (.ics)"
                  disabled={eksagete}
                  onClick={() => {
                    void xeirismosEksagogisIcs();
                  }}
                >
                  {eksagete ? 'Εξαγωγή…' : 'Εξαγωγή Ημερολογίου (.ics)'}
                </IonButton>
                {apothikefthike && <Pilegma keimeno="Αποθηκεύτηκε" entono />}
                {minimaSfalmatos !== null && (
                  <Pilegma keimeno={minimaSfalmatos} />
                )}
              </div>

              <XronodiagrammaMeletis programma={programma} mathimata={mathimataMeletis} />
            </>
          )
        }
      </OloniKatastasis>
    </div>
  );
}

export interface XronodiagrammaMeletisProps {
  readonly programma: Programma | null;
  readonly mathimata?: readonly DedomenaMathimatosMeleti[] | undefined;
}

/** Οπτικό χρονοδιάγραμμα μελέτης (EDF) με ημέρες, εργασίες και πρόταση επιβίωσης. */
export function XronodiagrammaMeletis({ programma, mathimata }: XronodiagrammaMeletisProps) {
  return (
    <Karta
      titlos="Χρονοδιάγραμμα Μελέτης"
      ypokeimeno="Αυτόματος υπολογισμός ημερήσιου προγράμματος με τον αλγόριθμο EDF."
      stoixeia={
        <div data-testid="programma-xronodiagramma" className="programma-xronodiagramma">
          {programma === null || programma.meres.length === 0 ? (
            <Pilegma keimeno="Δεν υπάρχουν προγραμματισμένες εργασίες μελέτης. Συμπληρώστε τις εξετάσεις και τη διαθεσιμότητα." />
          ) : (
            <>
              {programma.protasi_epiviosis && programma.protasi_epiviosis.length > 0 && (
                <div className="programma-epiviosi-karta" data-testid="programma-protasi-epiviosis">
                  <span className="programma-epiviosi-titlos">⚠️ Πρόταση Προσαρμογής (Survival Mode)</span>
                  <p className="programma-epiviosi-perigrafi">
                    Ο χρόνος μέχρι τις εξετάσεις είναι περιορισμένος. Προτείνεται η παράλειψη ή συντόμευση των παρακάτω ενοτήτων:
                  </p>
                  <div className="programma-epiviosi-lista">
                    {programma.protasi_epiviosis.map((p) => {
                      const mathima = mathimata?.find((m) => m.kodikos === p.kodikos_mathimatos);
                      const pigesEnotiton = mathima ? mathima.enotites : p.ypopshfies;
                      const ypsilisApodosis = [...pigesEnotiton]
                        .map((en) => {
                          const enId = 'id' in en ? en.id : en.enotita_id;
                          const apod = mathima?.apodosi?.[enId] ?? en.apodosi_exetasis ?? 0;
                          return {
                            id: enId,
                            titlos: en.titlos,
                            apodosi_exetasis: apod,
                          };
                        })
                        .filter((en) => (en.apodosi_exetasis ?? 0) > 0)
                        .sort((a, b) => (b.apodosi_exetasis ?? 0) - (a.apodosi_exetasis ?? 0));

                      return (
                        <div key={p.kodikos_mathimatos} className="programma-epiviosi-mathima">
                          <strong>{p.kodikos_mathimatos}:</strong>
                          <ul>
                            {p.ypopshfies.map((yp) => (
                              <li key={yp.enotita_id}>
                                {yp.titlos} ({yp.lepta} λεπτά)
                              </li>
                            ))}
                          </ul>
                          {ypsilisApodosis.length > 0 && (
                            <div className="programma-epiviosi-proteraiotita" data-testid="programma-systasi-proteraiotitas">
                              <span className="programma-epiviosi-proteraiotita-titlos">
                                🎯 Προτεραιότητα Μελέτης (Υψηλή Απόδοση Θεμάτων):
                              </span>
                              <ul>
                                {ypsilisApodosis.map((yp) => (
                                  <li key={yp.id} data-testid="programma-proteraiotita-enotita">
                                    ⭐ {yp.titlos} (+{yp.apodosi_exetasis} μονάδες)
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {(!programma.protasi_epiviosis || programma.protasi_epiviosis.length === 0) &&
                mathimata &&
                mathimata.some((m) => m.enotites.some((e) => ((m.apodosi?.[e.id] ?? e.apodosi_exetasis) ?? 0) > 0)) && (
                  <div className="programma-epiviosi-karta" data-testid="programma-systasi-proteraiotitas">
                    <span className="programma-epiviosi-titlos">🎯 Σύσταση Προτεραιότητας Μελέτης</span>
                    <p className="programma-epiviosi-perigrafi">
                      Ενότητες με τη μεγαλύτερη απόδοση στις εξετάσεις:
                    </p>
                    <div className="programma-epiviosi-lista">
                      {mathimata
                        .filter((m) => m.enotites.some((e) => ((m.apodosi?.[e.id] ?? e.apodosi_exetasis) ?? 0) > 0))
                        .map((m) => {
                          const ypsilis = [...m.enotites]
                            .map((e) => ({
                              ...e,
                              apodosi_exetasis: m.apodosi?.[e.id] ?? e.apodosi_exetasis ?? 0,
                            }))
                            .filter((e) => (e.apodosi_exetasis ?? 0) > 0)
                            .sort((a, b) => (b.apodosi_exetasis ?? 0) - (a.apodosi_exetasis ?? 0));
                          return (
                            <div key={m.kodikos} className="programma-epiviosi-mathima">
                              <strong>{m.kodikos}:</strong>
                              <ul>
                                {ypsilis.map((e) => (
                                  <li key={e.id} data-testid="programma-proteraiotita-enotita">
                                    ⭐ {e.titlos} (+{e.apodosi_exetasis} μονάδες)
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                    </div>
                  </div>
              )}
              <div className="programma-meres-plegma">
                {programma.meres.map((mera) => {
                  const synoloLepton = mera.ergasies.reduce((athr, e) => athr + e.lepta, 0);
                  const morfiImerominias = stilise_imerominia(mera.imerominia) ?? mera.imerominia;
                  return (
                    <div
                      key={mera.imerominia}
                      className="programma-mera"
                      data-testid="programma-mera"
                    >
                      <div className="programma-mera-kefali">
                        <span className="programma-mera-imerominia">{morfiImerominias}</span>
                        <span className="programma-mera-synolo">{synoloLepton} λεπτά</span>
                      </div>
                      <div className="programma-ergasies-lista">
                        {mera.ergasies.map((ergasia, thesi) => (
                          <div
                            key={`${mera.imerominia}-${thesi}`}
                            className="programma-ergasia"
                            data-testid="programma-ergasia"
                          >
                            <div className="programma-ergasia-koryfi">
                              <Pilegma
                                keimeno={ergasia.eidos === 'nea_yli' ? 'Νέα ύλη' : 'Επανάληψη'}
                                entono={ergasia.eidos === 'nea_yli'}
                              />
                              <span className="programma-ergasia-kodikos">{ergasia.kodikos_mathimatos}</span>
                              <span className="programma-ergasia-lepta">{ergasia.lepta} λεπτά</span>
                            </div>
                            <span className="programma-ergasia-titlos">{ergasia.titlos}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
