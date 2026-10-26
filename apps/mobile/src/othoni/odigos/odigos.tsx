import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IonButton, IonProgressBar } from '@ionic/react';
import type { KatastasiMathisis, KoutiLeitner } from '@dps/core';
import { Karta, OloniKatastasis, Pilegma, ProskelesioOmonimas } from '../../koinima/index.js';
import { fortosi, type Katastasi } from '../../kathstasi/index.js';
import { fortose_proodho, katagrapse_leitner_apantisi, xrisiApothekisis } from '../../apothiki/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import { fortose_odigo_apo_apothiki } from '../../ypiresies/index.js';
import type { OdigosEnotitas } from '../../ypiresies/index.js';
import { LEKIKIA_TMIMATON, EPKEFALIDES_TMIMATON } from '../../ypiresies/index.js';
import { analise_parapompi, diadromi_provolis, stilise_parapompi } from '../../provoli-pdf/index.js';
import { useCourseAiPrivacy } from '../../ypiresies/ai-generation-approval.js';
import { generateCourseGuide } from '../../ypiresies/pipeline-analisis.js';
import { PROEPILOGI_GEMINI_MONTELO } from '../../ypiresies/ai-models.js';
import { entopise_paroxo_montelou } from '../../ypiresies/ai-providers.js';
import { me_tilemetria } from '../../tilemetria/tilemetria.js';

/** Μία παραπομπή τμήματος οδηγού: tap ανοίγει το PDF στη σωστή σελίδα, αλλιώς μένει απλό κείμενο. */
export function ParapompiTmimatos({ parapompi }: { readonly parapompi: string }) {
  const navigate = useNavigate();
  const analise = analise_parapompi(parapompi);
  if (analise === null) {
    return <p className="odigos-parapompi">{parapompi}</p>;
  }
  const dromos = diadromi_provolis(analise);
  if (dromos === null) {
    return <p className="odigos-parapompi">{parapompi}</p>;
  }
  return (
    <button
      type="button"
      className="odigos-parapompi odigos-parapompi-koumpi"
      data-testid="odigos-parapompi"
      onClick={() => {
        navigate(dromos);
      }}
    >
      {stilise_parapompi(analise)}
    </button>
  );
}

/** Στάδια της διαδικασίας δημιουργίας οδηγού μελέτης. */
export const STADIA_DIMIOURGIAS_ODIGOU: readonly string[] = [
  'Ανάγνωση τοπικά αποθηκευμένου υλικού...',
  'Εξαγωγή εννοιών & λυμένων παραδειγμάτων...',
  'Σύνθεση οδηγού 7 ενοτήτων & παραπομπών...',
];

/** Ιδιότητες προόδου δημιουργίας οδηγού μελέτης. */
export interface ProodosDimiourgiasOdigouProps {
  readonly stadio?: number;
  readonly pososto?: number;
}

/** Component πολυσταδιακής προόδου δημιουργίας οδηγού μελέτης. */
export function ProodosDimiourgiasOdigou({
  stadio = 1,
  pososto,
}: ProodosDimiourgiasOdigouProps) {
  const trexonStadio = Math.max(1, Math.min(STADIA_DIMIOURGIAS_ODIGOU.length, stadio));
  const telikoPososto = pososto !== undefined
    ? Math.max(0, Math.min(100, Math.round(pososto)))
    : Math.round((trexonStadio / STADIA_DIMIOURGIAS_ODIGOU.length) * 100);
  const trexonKeimeno = STADIA_DIMIOURGIAS_ODIGOU[trexonStadio - 1] ?? STADIA_DIMIOURGIAS_ODIGOU[0];

  return (
    <div
      className="proodos-analisis-plaisio"
      data-testid="odigos-proodos-analisis"
      role="status"
      aria-live="polite"
    >
      <div className="proodos-analisis-kefali">
        <span className="proodos-analisis-titlos">
          Ανάλυση &amp; Δημιουργία Οδηγού (Στάδιο {trexonStadio}/{STADIA_DIMIOURGIAS_ODIGOU.length})
        </span>
        <span className="proodos-analisis-pososto" data-testid="odigos-proodos-pososto">
          {telikoPososto}%
        </span>
      </div>

      <div
        className="proodos-mpara-kouti"
        role="progressbar"
        aria-valuenow={telikoPososto}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={trexonKeimeno}
      >
        <IonProgressBar value={telikoPososto / 100} />
      </div>

      <div className="proodos-analisis-trexon-keimeno">
        {trexonKeimeno}
      </div>

      <ul className="proodos-analisis-stadia-lista">
        {STADIA_DIMIOURGIAS_ODIGOU.map((titlosStadiou, deiktis) => {
          const arithmos = deiktis + 1;
          const olokliromeno = trexonStadio > arithmos;
          const trexon = trexonStadio === arithmos;
          return (
            <li
              key={titlosStadiou}
              className={`proodos-stadio-stoixeio${olokliromeno ? ' olokliromeno' : ''}${trexon ? ' trexon' : ''}`}
            >
              <span className="proodos-stadio-simio">
                {olokliromeno ? '✓' : arithmos}
              </span>
              <span className="proodos-stadio-titlos">{titlosStadiou}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Επιστρέφει τη λεζάντα για το κουτί Leitner (1 έως 5). */
export function lezanta_leitner_koutioy(kouti?: number): string {
  if (kouti === 5) return 'Κουτί 5: Κατοχυρωμένη';
  if (kouti === 4) return 'Κουτί 4';
  if (kouti === 3) return 'Κουτί 3';
  if (kouti === 2) return 'Κουτί 2';
  return 'Κουτί 1';
}

/** Δεδομένα μίας ερώτησης αυτοελέγχου. */
export interface ErwtisiAutoelegchouDedomena {
  readonly erwtisi: string;
  readonly apantisi: string;
  readonly ennoia: string;
}

/** Αναλύει μία γραμμή αυτοελέγχου σε ερώτηση, απάντηση και έννοια. */
export function analise_erwtisi_autoelegchou(
  keimeno: string,
  index: number,
  enotitaId?: string
): ErwtisiAutoelegchouDedomena {
  const match = keimeno.match(/^(.*?)(?:Απάντηση:)\s*(.*)$/s);
  let erwtisi = keimeno.trim();
  let apantisi = 'Ανατρέξτε στην αντίστοιχη πηγή της ενότητας.';
  if (match) {
    const q = match[1]?.trim();
    const a = match[2]?.trim();
    if (q) erwtisi = q;
    if (a) apantisi = a;
  }
  erwtisi = erwtisi.replace(/^Ερώτηση:\s*/i, '').trim();
  apantisi = apantisi.replace(/^[«"']\s*/, '').replace(/\s*[»"']$/, '').trim();
  const ennoia = erwtisi || `${enotitaId ?? 'enotita'}-erwtisi-${index + 1}`;
  return { erwtisi, apantisi, ennoia };
}

export interface AutoelegchosErwtisiProps {
  readonly erwtisi: string;
  readonly apantisi: string;
  readonly ennoia: string;
  readonly arithmos: number;
  readonly kouti?: number;
  readonly onApantisi?: (sosto: boolean) => Promise<void> | void;
  readonly arxikaAnoixto?: boolean;
}

export function AutoelegchosErwtisi({
  erwtisi,
  apantisi,
  arithmos,
  kouti = 1,
  onApantisi,
  arxikaAnoixto = false,
}: AutoelegchosErwtisiProps) {
  const [anoixto, setAnoixto] = useState(arxikaAnoixto);
  const [ypovoli, setYpovoli] = useState(false);

  const xeirismosApantisis = async (sosto: boolean) => {
    if (ypovoli) return;
    setYpovoli(true);
    try {
      if (onApantisi) {
        await onApantisi(sosto);
      }
    } finally {
      setYpovoli(false);
    }
  };

  return (
    <div className="odigos-autoelegchos-kouti">
      <div className="odigos-autoelegchos-kefali">
        <p className="odigos-autoelegchos-erwtisi">
          <strong>Ερώτηση {arithmos}:</strong> {erwtisi}
        </p>
        <Pilegma keimeno={lezanta_leitner_koutioy(kouti)} entono={kouti === 5} />
      </div>
      <button
        type="button"
        className="pilegma odigos-autoelegchos-toggle"
        onClick={() => {
          setAnoixto((palio) => !palio);
        }}
      >
        {anoixto ? 'Απόκρυψη' : 'Εμφάνιση απάντησης'}
      </button>
      {anoixto && (
        <div className="odigos-autoelegchos-apantisi">
          <p>
            <strong>Απάντηση:</strong> {apantisi}
          </p>
        </div>
      )}
      <div className="odigos-autoelegchos-draseis">
        <button
          type="button"
          className="pilegma pilegma-entono odigos-autoelegchos-koumpi"
          data-testid="autoelegchos-apantisi-koumpi"
          disabled={ypovoli}
          onClick={() => {
            void xeirismosApantisis(true);
          }}
        >
          Το ήξερα
        </button>
        <button
          type="button"
          className="pilegma odigos-autoelegchos-koumpi"
          data-testid="autoelegchos-apantisi-koumpi"
          disabled={ypovoli}
          onClick={() => {
            void xeirismosApantisis(false);
          }}
        >
          Χρειάζομαι επανάληψη
        </button>
      </div>
    </div>
  );
}

export interface AutoelegchosAkordeonProps {
  readonly keimena: readonly string[];
  readonly kodikosMathimatos: string;
  readonly enotitaId: string;
}

export function AutoelegchosAkordeon({
  keimena,
  kodikosMathimatos,
  enotitaId,
}: AutoelegchosAkordeonProps) {
  const periballon = xrisiPeriballontos();
  const apothiki = xrisiApothekisis();
  const [katastaseis, setKatastaseis] = useState<Record<string, KatastasiMathisis>>(() => {
    const arxiko: Record<string, KatastasiMathisis> = {};
    if (apothiki.proodhos.katastasiMathisis) {
      for (const item of apothiki.proodhos.katastasiMathisis) {
        arxiko[item.ennoia] = item;
      }
    }
    return arxiko;
  });

  useEffect(() => {
    let mounted = true;
    if (!kodikosMathimatos) return;
    void fortose_proodho(periballon.apothiki, kodikosMathimatos).then((proodhos) => {
      if (mounted && proodhos.katastasiMathisis) {
        setKatastaseis((palies) => {
          const map = { ...palies };
          if (proodhos.katastasiMathisis) {
            for (const item of proodhos.katastasiMathisis) {
              map[item.ennoia] = item;
            }
          }
          return map;
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, [periballon.apothiki, kodikosMathimatos]);

  const xeirismosApantisisGiaEnnoia = async (ennoia: string, sosto: boolean) => {
    const trexonKouti = katastaseis[ennoia]?.kouti ?? 1;
    const neoKouti = sosto ? ((Math.min(5, trexonKouti + 1) as KoutiLeitner)) : (1 as KoutiLeitner);
    setKatastaseis((palies) => ({
      ...palies,
      [ennoia]: {
        ennoia,
        kouti: neoKouti,
        epomeni_epanalipsi: '',
        sosta_seiri: sosto ? (palies[ennoia]?.sosta_seiri ?? 0) + 1 : 0,
      },
    }));

    if (kodikosMathimatos) {
      try {
        const simera = periballon.rologi.tora().toISOString().slice(0, 10);
        const res = await katagrapse_leitner_apantisi(
          periballon.apothiki,
          kodikosMathimatos,
          ennoia,
          sosto,
          simera
        );
        if (res.ok) {
          setKatastaseis((palies) => {
            const map = { ...palies };
            for (const item of res.timi) {
              map[item.ennoia] = item;
            }
            return map;
          });
        }
      } catch {
        // Safe error boundary
      }
    }
  };

  const erwtiseis = useMemo(() => {
    return keimena.map((keimeno, index) =>
      analise_erwtisi_autoelegchou(keimeno, index, enotitaId)
    );
  }, [keimena, enotitaId]);

  return (
    <div className="odigos-autoelegchos-lista">
      {erwtiseis.map((e, index) => (
        <AutoelegchosErwtisi
          key={`${e.ennoia}-${index}`}
          arithmos={index + 1}
          erwtisi={e.erwtisi}
          apantisi={e.apantisi}
          ennoia={e.ennoia}
          kouti={katastaseis[e.ennoia]?.kouti ?? 1}
          onApantisi={(sosto) => xeirismosApantisisGiaEnnoia(e.ennoia, sosto)}
        />
      ))}
    </div>
  );
}

/** Οδηγός μελέτης της ενότητας από τη διαδρομή, με επιστροφή στον χάρτη και άσκηση στον tutor. */
export default function OdigosMeletis() {
  const params = useParams<{ enotitaId: string }>();
  const enotitaId = params.enotitaId ?? '';
  const navigate = useNavigate();
  const periballon = xrisiPeriballontos();
  const apothiki = xrisiApothekisis();
  const { kodikosMathimatos } = apothiki;
  const [katastasi, setKatastasi] = useState<Katastasi<OdigosEnotitas>>(fortosi<OdigosEnotitas>());
  const [proseis, setProseis] = useState(0);
  const [dimiourgeitai, setDimiourgeitai] = useState(false);
  const [stadioAnalisis, setStadioAnalisis] = useState(1);
  const [posostoAnalisis, setPosostoAnalisis] = useState(20);
  const privacy = useCourseAiPrivacy(periballon.apothiki, kodikosMathimatos, kodikosMathimatos);
  const selectedModel = apothiki.rytheseis.onomaMontelou || PROEPILOGI_GEMINI_MONTELO;
  const selectedProvider = entopise_paroxo_montelou(selectedModel, apothiki.rytheseis.paroxosLlm);
  const geminiSelected = selectedProvider === 'gemini';

  useEffect(() => {
    let mounted = true;
    setKatastasi(fortosi<OdigosEnotitas>());
    void fortose_odigo_apo_apothiki(
      periballon.apothiki,
      kodikosMathimatos,
      enotitaId
    ).then((apokrisis) => {
      if (mounted) {
        setKatastasi(apokrisis);
      }
    });
    return () => {
      mounted = false;
    };
  }, [periballon.apothiki, kodikosMathimatos, enotitaId, proseis]);

  const epanalipsi = useCallback(() => {
    setProseis((palies) => palies + 1);
  }, []);

  const dimiourgia_odigo = useCallback(async (): Promise<void> => {
    if (!kodikosMathimatos || !enotitaId || dimiourgeitai) return;
    setDimiourgeitai(true);
    setStadioAnalisis(1);
    setPosostoAnalisis(20);
    setKatastasi(fortosi<OdigosEnotitas>());

    const xronodiakoptis = setInterval(() => {
      setPosostoAnalisis((palio) => {
        if (palio < 45) {
          return palio + 10;
        }
        if (palio < 75) {
          setStadioAnalisis(2);
          return palio + 10;
        }
        if (palio < 95) {
          setStadioAnalisis(3);
          return palio + 5;
        }
        return palio;
      });
    }, 400);

    try {
      await me_tilemetria(
        'dimiourgia_odigou',
        async () => {
          const result = await generateCourseGuide(
            periballon,
            kodikosMathimatos,
            enotitaId,
            selectedModel,
            privacy.authorizeGeneration,
            selectedProvider,
          );
          if (!result.ok) {
            setKatastasi({ katastasi: 'sfalma', sfalma: result.sfalma });
            return;
          }
          setStadioAnalisis(3);
          setPosostoAnalisis(100);
          const loaded = await fortose_odigo_apo_apothiki(periballon.apothiki, kodikosMathimatos, enotitaId);
          setKatastasi(loaded);
          if (loaded.katastasi === 'adeio') {
            setKatastasi({ katastasi: 'sfalma', sfalma: { kodikos: 'MI_EGKYRO_SXIMA', minima: 'Ο οδηγός παράχθηκε αλλά δεν μπόρεσε να φορτωθεί.' } });
          }
        },
        { kodikosMathimatos, enotitaId, selectedModel, selectedProvider }
      );
    } catch (reason) {
      setKatastasi({
        katastasi: 'sfalma',
        sfalma: {
          kodikos: 'DIKTYO',
          minima: reason instanceof Error ? reason.message : 'Δεν δημιουργήθηκε ο οδηγός.',
        },
      });
    } finally {
      clearInterval(xronodiakoptis);
      setDimiourgeitai(false);
    }
  }, [dimiourgeitai, enotitaId, kodikosMathimatos, periballon, privacy.authorizeGeneration, selectedModel, selectedProvider]);

  const parametroi = new URLSearchParams({ enotita: enotitaId });
  const kseis = (
    <>
      <IonButton
        size="small"
        fill="outline"
        onClick={() => {
          navigate('/xartis');
        }}
        data-testid="odigos-episostrofh"
      >
        ← Χάρτης
      </IonButton>
      <IonButton
        size="small"
        onClick={() => {
          navigate(`/tutor?${parametroi.toString()}`);
        }}
        data-testid="odigos-tutor"
      >
        Άσκηση στον tutor
      </IonButton>
    </>
  );

  return (
    <div className="odigos-kyrio" data-testid="odigos-ekran">
      <ProskelesioOmonimas
        titlos={
          katastasi.katastasi === 'etimo' ? katastasi.dedomena.titlos : `Οδηγός ${enotitaId}`
        }
        ypokeimeno="Οδός μελέτης με παραπομπές στο υλικό."
        akseis={kseis}
      />
      {katastasi.katastasi === 'adeio' ? (
        <Karta
          titlos="Δημιουργία οδηγού μελέτης"
          ypokeimeno="Αυτός ο οδηγός παράγεται όταν τον ζητήσεις από τα ήδη συγχρονισμένα αρχεία του μαθήματος."
          stoixeia={
            <div className="odoni-lista">
              {geminiSelected && (
                <label className="odoni-xeiris">
                  <input
                    type="checkbox"
                    checked={privacy.optIn}
                    disabled={privacy.loading || privacy.saving || !kodikosMathimatos}
                    onChange={(event) => void privacy.setOptIn(event.target.checked).catch(() => undefined)}
                    data-testid="odigos-gemini-optin"
                  />
                  Επιτρέπω στο Gemini να λαμβάνει το υλικό αυτού του μαθήματος. Θα επιβεβαιώνω κάθε αποστολή ξεχωριστά.
                </label>
              )}
              {privacy.error !== null && <p role="alert" className="karta-ypokeimeno">{privacy.error}</p>}
              <button
                type="button"
                className="pilegma pilegma-entono"
                disabled={!kodikosMathimatos || dimiourgeitai || privacy.loading || privacy.saving || (geminiSelected && !privacy.optIn)}
                onClick={() => void dimiourgia_odigo()}
                data-testid="odigos-dimiourgia"
              >
                {dimiourgeitai ? 'Δημιουργία οδηγού…' : 'Δημιουργία οδηγού'}
              </button>
              {!kodikosMathimatos && <p role="status">Επίλεξε και συγχρόνισε πρώτα ένα μάθημα.</p>}
            </div>
          }
        />
      ) : katastasi.katastasi === 'fortosi' ? (
        <OloniKatastasis katastasi={katastasi} epanalipsi={epanalipsi}>{() => null}</OloniKatastasis>
      ) : katastasi.katastasi === 'sfalma' ? (
        <Karta
          titlos="Δεν φορτώθηκε ο οδηγός"
          ypokeimeno={katastasi.sfalma.minima}
          stoixeia={
            <div className="odoni-lista">
              {geminiSelected && (
                <label className="odoni-xeiris">
                  <input
                    type="checkbox"
                    checked={privacy.optIn}
                    disabled={privacy.loading || privacy.saving || !kodikosMathimatos}
                    onChange={(event) => void privacy.setOptIn(event.target.checked).catch(() => undefined)}
                    data-testid="odigos-gemini-optin"
                  />
                  Επιτρέπω στο Gemini να λαμβάνει το υλικό αυτού του μαθήματος. Θα επιβεβαιώνω κάθε αποστολή ξεχωριστά.
                </label>
              )}
              {privacy.error !== null && <p role="alert" className="karta-ypokeimeno">{privacy.error}</p>}
              <button type="button" className="pilegma" onClick={() => void dimiourgia_odigo()} disabled={dimiourgeitai || privacy.loading || privacy.saving || (geminiSelected && !privacy.optIn)}>Δημιουργία ξανά</button>
            </div>
          }
        />
      ) : (
        <>
          {privacy.error !== null && <p role="alert" className="karta-ypokeimeno">{privacy.error}</p>}
          <OloniKatastasis katastasi={katastasi} epanalipsi={epanalipsi}>
            {(odigos) => (
          <>
            {LEKIKIA_TMIMATON.map((kleidi) => {
              const tmima = odigos.tmimata[kleidi];
              return (
                <section key={kleidi}>
                  <h2 className="odigos-epikefalida" data-testid="odigos-epikefalida">
                    {EPKEFALIDES_TMIMATON[kleidi]}
                  </h2>
                  {kleidi === 'autoelegchos' ? (
                    <AutoelegchosAkordeon
                      keimena={tmima.keimena}
                      kodikosMathimatos={kodikosMathimatos}
                      enotitaId={enotitaId}
                    />
                  ) : (
                    <div className="odigos-paragrafos">
                      {tmima.keimena.map((keimeno) => (
                        <p key={keimeno}>{keimeno}</p>
                      ))}
                    </div>
                  )}
                  <ParapompiTmimatos parapompi={tmima.parapompi} />
                </section>
              );
            })}
          </>
        )}
          </OloniKatastasis>
        </>
      )}
      {dimiourgeitai && (
        <ProodosDimiourgiasOdigou
          stadio={stadioAnalisis}
          pososto={posostoAnalisis}
        />
      )}
      {privacy.dialog}
    </div>
  );
}
