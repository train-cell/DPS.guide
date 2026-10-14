import { useCallback, useEffect, useState } from 'react';
import { IonButton } from '@ionic/react';
import { Karta, OloniKatastasis, Pilegma, ProskelesioOmonimas } from '../koinima/index.js';
import { fortosi, etimo, type Katastasi } from '../kathstasi/index.js';
import type { Rytheseis } from '../apothiki/index.js';
import { fortose_rytheseis, grapse_rytheseis } from '../apothiki/index.js';
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

/** Μια ημερομηνία με τα λεπτά της, όπως τη συμπληρώνει η φόρμα (τα λεπτά ως κείμενο). */
interface OverrideDraft {
  readonly imerominia: string;
  readonly lepta: string;
}

/** Το προσχέδιο της φόρμας προγράμματος, όπως το κρατά η οθόνη. */
interface DraftProgrammatos {
  readonly exetaseis: readonly ExetasiP1[];
  readonly arxiExetastikis: string;
  readonly templateLepton: TemplateLepton;
  readonly overrides: readonly OverrideDraft[];
}

/** Κείμενο κουμπιού προσθήκης εξέτασης. */
const KEIMENO_PROSTHESIS_EXETASIS = '+ Εξέταση';

/** Κείμενο κουμπιού προσθήκης εξαίρεσης. */
const KEIMENO_PROSTHESIS_OVERRIDE = '+ Εξαίρεση';

/** Σειρά νέων εξαιρέσεων όταν η λίστα είναι κενή. */
const NEES_OVERRIDES_KEIMENO = 'Καμία εξαίρεση ακόμη.';

/** Μετατρέπει αποθηκευμένες ρυθμίσεις σε προσχέδιο φόρμας. */
function draft_apo_rytheseis(rytheseis: Rytheseis): DraftProgrammatos {
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
export default function RythmiseisProgrammatos() {
  const periballon = xrisiPeriballontos();
  const [katastasi, setKatastasi] = useState<Katastasi<Rytheseis>>(fortosi<Rytheseis>());
  const [rytheseis, setRytheseis] = useState<Rytheseis | null>(null);
  const [draft, setDraft] = useState<DraftProgrammatos | null>(null);
  const [apothikefthike, setApothikefthike] = useState(false);
  const [minimaSfalmatos, setMinimaSfalmatos] = useState<string | null>(null);

  const fortose = useCallback(() => {
    void (async () => {
      const fotismenes = await fortose_rytheseis(periballon.apothiki);
      setKatastasi(etimo<Rytheseis>(fotismenes));
      setRytheseis(fotismenes);
      setDraft(draft_apo_rytheseis(fotismenes));
    })();
  }, [periballon.apothiki]);

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
                {apothikefthike && <Pilegma keimeno="Αποθηκεύτηκε" entono />}
                {minimaSfalmatos !== null && (
                  <Pilegma keimeno={minimaSfalmatos} />
                )}
              </div>
            </>
          )
        }
      </OloniKatastasis>
    </div>
  );
}
