import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent as GeventoPedomati } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IonProgressBar } from '@ionic/react';
import type { Enotita, Proapaitoumeno, XartisMathimatos } from '@dps/core';
import {
  Karta,
  MetrikosRing,
  OloniKatastasis,
  Pilegma,
  ProskelesioOmonimas,
} from '../../koinima/index.js';
import { xrisiApothekisis } from '../../apothiki/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import type { Katastasi } from '../../kathstasi/index.js';
import { fortosi, sfalma } from '../../kathstasi/index.js';
import { fortose_apodosi, fortose_xartis_apo_apothiki, pososto_aristeias } from '../../ypiresies/index.js';
import { useCourseAiPrivacy } from '../../ypiresies/ai-generation-approval.js';
import { generateCourseMap } from '../../ypiresies/pipeline-analisis.js';
import { PROEPILOGI_GEMINI_MONTELO } from '../../ypiresies/ai-models.js';
import { entopise_paroxo_montelou } from '../../ypiresies/ai-providers.js';
import { diadromi_odigou } from '../../navigasi/dromoi.js';
import { me_tilemetria } from '../../tilemetria/tilemetria.js';

/** Λεπτά ανά ώρα, για τη μορφοποίηση του χρόνου εκτίμησης. */
export const LEPTA_PER_ORA = 60;

/** Μήνυμα κενού χάρτη, με οδηγίες αντί για σιωπή. */
export const MINIMA_KENOY_XARTI = 'Δεν έχει δημιουργηθεί ακόμη χάρτης για αυτό το μάθημα.';

/** Μήνυμα σφάλματος φόρτωσης του χάρτη. */
export const MINIMA_SFALMATOS_XARTI = 'Δεν ήταν δυνατή η φόρτωση του χάρτη του μαθήματος.';

/** Κωδικός σφάλματος δικτύου, κοινός σε όλα τα φορτωτά δεδομένα. */
export const KODIKOS_SFALMATOS_DIKTYOU = 'DIKTYO';

/** Κείμενο της ετικέτας όταν η ενότητα δεν έχει εκτίμηση χρόνου. */
export const CHORIS_ESTIMISI = 'Χωρίς εκτίμηση χρόνου';

/** Κείμενο του κουμπιού σήμανσης όσο η ενότητα δεν έχει ολοκληρωθεί. */
export const KEIMENO_STOXOU = 'Σημείωση ως ολοκληρωμένη';

/** Κείμενο του κουμπιού σήμανσης όταν η ενότητα έχει ολοκληρωθεί. */
export const KEIMENO_TELIOU = 'Ολοκληρώθηκε';

/** Στάδια της διαδικασίας ανάλυσης και δημιουργίας χάρτη ύλης. */
export const STADIA_DIMIOURGIAS_XARTI: readonly string[] = [
  'Επεξεργασία διαφανειών...',
  'Τοπολογική ταξινόμηση DAG...',
  'Ολοκλήρωση χάρτη...',
];

/** Ιδιότητες προόδου δημιουργίας χάρτη μαθήματος. */
export interface ProodosDimiourgiasXartiProps {
  readonly stadio?: number;
  readonly pososto?: number;
}

/** Component πολυσταδιακής προόδου δημιουργίας χάρτη μαθήματος. */
export function ProodosDimiourgiasXarti({
  stadio = 1,
  pososto,
}: ProodosDimiourgiasXartiProps) {
  const trexonStadio = Math.max(1, Math.min(STADIA_DIMIOURGIAS_XARTI.length, stadio));
  const telikoPososto = pososto !== undefined
    ? Math.max(0, Math.min(100, Math.round(pososto)))
    : Math.round((trexonStadio / STADIA_DIMIOURGIAS_XARTI.length) * 100);
  const trexonKeimeno = STADIA_DIMIOURGIAS_XARTI[trexonStadio - 1] ?? STADIA_DIMIOURGIAS_XARTI[0];

  return (
    <div
      className="proodos-analisis-plaisio"
      data-testid="xartis-proodos-analisis"
      role="status"
      aria-live="polite"
    >
      <div className="proodos-analisis-kefali">
        <span className="proodos-analisis-titlos">
          Ανάλυση Ύλης Μαθήματος (Στάδιο {trexonStadio}/{STADIA_DIMIOURGIAS_XARTI.length})
        </span>
        <span className="proodos-analisis-pososto" data-testid="xartis-proodos-pososto">
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
        {STADIA_DIMIOURGIAS_XARTI.map((titlosStadiou, deiktis) => {
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

/** Μετατρέπει λεπτά σε «ώρες και λεπτά», π.χ. 75 → «1 ζ 15 λ». */
export function stilise_lepta(lepta: number | null): string {
  if (lepta === null) {
    return CHORIS_ESTIMISI;
  }
  const ores = Math.floor(lepta / LEPTA_PER_ORA);
  const ipolipa = lepta % LEPTA_PER_ORA;
  if (ores === 0) {
    return `${ipolipa} λ`;
  }
  if (ipolipa === 0) {
    return `${ores} ζ`;
  }
  return `${ores} ζ ${ipolipa} λ`;
}

/** Μετατρέπει την ισχύ προαπαίτησης σε ελληνική λέξη. */
export function stilise_isxya(isxys: Proapaitoumeno['isxys']): string {
  return isxys === 'isxyri' ? 'ισχυρό' : 'ασθενικό';
}

/** Γράφει τη γραμμή «Προαπαιτείται: <id> (ισχυρό/ασθενικό)» μιας προαπαίτησης. */
export function grammi_proapasitis(proapasiti: Proapaitoumeno): string {
  return `Προαπαιτείται: ${proapasiti.enotita_id} (${stilise_isxya(proapasiti.isxys)})`;
}

/** Υπολογίζει αν η ενότητα είναι κλειδωμένη βάσει ισχυρών προαπαιτουμένων που δεν έχουν ολοκληρωθεί. */
export function einai_kleidomeni_enotita(
  enotita: Enotita,
  telies: readonly string[] = []
): boolean {
  return enotita.proapaitoumenes.some(
    (proapasiti) => proapasiti.isxys === 'isxyri' && !telies.includes(proapasiti.enotita_id)
  );
}

/** Ιδιότητες της κάρτας μιας ενότητας του χάρτη. */
export interface KartaEnotitasProps {
  readonly enotita: Enotita;
  readonly tetagmeni: boolean;
  readonly allaxe_telia: (id: string) => Promise<void>;
  readonly telies?: readonly string[] | undefined;
  readonly titloiEnotiton?: Readonly<Record<string, string>> | undefined;
  readonly apodosi?: number | null | undefined;
}

/** Κάρτα ενότητας: κλικ στην κάρτα ανοίγει τον οδηγό, το κουμπί τη σημειώνει ως ολοκληρωμένη. */
export function KartaEnotitas({
  enotita,
  tetagmeni,
  allaxe_telia,
  telies = [],
  titloiEnotiton,
  apodosi,
}: KartaEnotitasProps) {
  const navigate = useNavigate();
  const dromos = diadromi_odigou(enotita.id);
  const kleidomeni = einai_kleidomeni_enotita(enotita, telies);
  const apodosiMonadon = apodosi ?? enotita.apodosi_exetasis ?? 0;

  const simaProspatheias = useCallback(
    async (gevento: GeventoPedomati<HTMLButtonElement>): Promise<void> => {
      gevento.preventDefault();
      gevento.stopPropagation();
      await allaxe_telia(enotita.id);
    },
    [allaxe_telia, enotita.id]
  );

  const karta = (
    <Karta
        titlos={enotita.titlos}
        ypokeimeno={`Σειρά ${enotita.seira} · ${stilise_lepta(enotita.lepta_ektimisi)}`}
        akseis={
          <div className="karta-mathimatos-akseis">
            {apodosiMonadon > 0 && (
              <span
                data-testid="xartis-apodosi-badge"
                className="pilegma pilegma-apodosi"
              >
                ⭐ Θέματα: +{apodosiMonadon} μονάδες
              </span>
            )}
            <span
              data-testid="xartis-katastasi-kleidomatos"
              className={`pilegma ${kleidomeni ? 'pilegma-kleidomeni' : 'pilegma-xekleidoti'}`}
            >
              {kleidomeni ? '🔒 Κλειδωμένη' : '🔓 Ξεκλείδωτη'}
            </span>
            <Pilegma keimeno={`Σειρά ${enotita.seira}`} entono={tetagmeni} />
          </div>
        }
        stoixeia={
          <div>
            <div className="odoni-xeiris">
              {enotita.ennoies.map((ennea) => (
                <Pilegma key={ennea} keimeno={ennea} />
              ))}
            </div>
            <div className="enotita-kartela" data-testid="xartis-proiresi">
              {enotita.proapaitoumenes.length === 0 ? (
                <p className="enotita-xreomeni">Χωρίς προαπαιτούμενες</p>
              ) : (
                <>
                  {enotita.proapaitoumenes.map((proapasiti) => (
                    <p key={proapasiti.enotita_id} className="enotita-xreomeni">
                      {grammi_proapasitis(proapasiti)}
                    </p>
                  ))}
                  <div className="dag-syndeseis">
                    {enotita.proapaitoumenes.map((proapasiti) => {
                      const einaiTetagmeni = telies.includes(proapasiti.enotita_id);
                      const titlosEnotitas =
                        titloiEnotiton?.[proapasiti.enotita_id] ?? proapasiti.enotita_id;
                      const keimeno = einaiTetagmeni
                        ? `✓ ${titlosEnotitas}`
                        : `⏳ ${titlosEnotitas} (${stilise_isxya(proapasiti.isxys)})`;
                      const diadromi = diadromi_odigou(proapasiti.enotita_id);

                      return (
                        <button
                          key={proapasiti.enotita_id}
                          type="button"
                          className={`pilegma${einaiTetagmeni ? ' pilegma-entono' : ''}`}
                          data-testid="xartis-dag-syndesi"
                          onClick={(symvan) => {
                            symvan.preventDefault();
                            symvan.stopPropagation();
                            if (diadromi !== null) {
                              navigate(diadromi);
                            }
                          }}
                        >
                          {keimeno}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            {dromos === null && (
              <p role="status">Η ενότητα έχει μη έγκυρο αναγνωριστικό και δεν μπορεί να ανοιχτεί.</p>
            )}
            <button
              type="button"
              className={`pilegma${tetagmeni ? ' pilegma-entono' : ''}`}
              aria-pressed={tetagmeni}
              data-testid={`xartis-aristeia-${enotita.id}`}
              onClick={simaProspatheias}
            >
              {tetagmeni ? KEIMENO_TELIOU : KEIMENO_STOXOU}
            </button>
          </div>
        }
    />
  );

  return dromos === null ? (
    <div data-testid="xartis-enotita">{karta}</div>
  ) : (
    <Link to={dromos} data-testid="xartis-enotita">
      {karta}
    </Link>
  );
}

/** Ιδιότητες του χάρτη με τις ενότητες και τις ολοκληρωμένες επιλογές. */
export interface OdomosEnotitonProps {
  readonly xartis: XartisMathimatos;
  readonly telies: readonly string[];
  readonly allaxe_telia: (id: string) => Promise<void>;
  readonly apodosi?: Readonly<Record<string, number>> | undefined;
}

/** Ο χάρτης του μαθήματος: ενότητες ταξινομημένες κατά σειρά και δακτύλιος προόδου. */
export function OdomosEnotiton({
  xartis,
  telies,
  allaxe_telia,
  apodosi = {},
}: OdomosEnotitonProps) {
  const taxinomisi = [...xartis.enotites].sort((prwti, defteri) => prwti.seira - defteri.seira);
  const titloiEnotiton: Record<string, string> = Object.fromEntries(
    xartis.enotites.map((enot) => [enot.id, enot.titlos])
  );
  return (
    <div>
      <div className="odoni-lista" data-testid="xartis-lista">
        {taxinomisi.map((enotita) => (
          <KartaEnotitas
            key={enotita.id}
            enotita={enotita}
            tetagmeni={telies.includes(enotita.id)}
            allaxe_telia={allaxe_telia}
            telies={telies}
            titloiEnotiton={titloiEnotiton}
            apodosi={apodosi[enotita.id]}
          />
        ))}
      </div>
      <div className="simera-stoxos" data-testid="xartis-telos">
        <p className="simera-stoxos-titlos">Πρόοδος μαθήματος</p>
        <MetrikosRing
          pososto={pososto_aristeias(xartis.enotites, telies)}
          ypokeimeno={`${telies.length} από ${xartis.enotites.length} ενότητες`}
          ariaEtiketa="Πρόοδος μαθήματος"
        />
      </div>
    </div>
  );
}

/** Χάρτης ενοτήτων του επιλεγμένου μαθήματος με φόρτωση, κενό, σφάλμα και δεδομένα. */
export default function XartisEnotiton() {
  const apothiki = xrisiApothekisis();
  const periballon = xrisiPeriballontos();
  const [katastasi, setKatastasi] = useState<Katastasi<XartisMathimatos>>(fortosi<XartisMathimatos>());
  const [apodosi, setApodosi] = useState<Record<string, number>>({});
  const [prospatheies, setProspatheies] = useState(0);
  const [dimiourgeitai, setDimiourgeitai] = useState(false);
  const [stadioAnalisis, setStadioAnalisis] = useState(1);
  const [posostoAnalisis, setPosostoAnalisis] = useState(20);
  const privacy = useCourseAiPrivacy(
    periballon.apothiki,
    apothiki.kodikosMathimatos,
    apothiki.kodikosMathimatos,
  );
  const selectedModel = apothiki.rytheseis.onomaMontelou || PROEPILOGI_GEMINI_MONTELO;
  const selectedProvider = entopise_paroxo_montelou(selectedModel, apothiki.rytheseis.paroxosLlm);
  const geminiSelected = selectedProvider === 'gemini';

  useEffect(() => {
    let zontas = true;
    void fortose_xartis_apo_apothiki(periballon.apothiki, apothiki.kodikosMathimatos)
      .then((apothike) => {
        if (zontas) {
          setKatastasi(apothike);
        }
      })
      .catch(() => {
        if (zontas) {
          setKatastasi(
            sfalma({ kodikos: KODIKOS_SFALMATOS_DIKTYOU, minima: MINIMA_SFALMATOS_XARTI })
          );
        }
      });

    if (apothiki.kodikosMathimatos) {
      void fortose_apodosi(periballon.apothiki, apothiki.kodikosMathimatos)
        .then((dedomenaApodosis) => {
          if (zontas) {
            setApodosi(dedomenaApodosis);
          }
        })
        .catch(() => {
          if (zontas) {
            setApodosi({});
          }
        });
    } else {
      setApodosi({});
    }

    return () => {
      zontas = false;
    };
  }, [periballon.apothiki, apothiki.kodikosMathimatos, prospatheies]);

  const epanalipsi = useCallback(() => {
    setKatastasi(fortosi<XartisMathimatos>());
    setProspatheies((prospathia) => prospathia + 1);
  }, []);

  const sygxronismena = apothiki.rytheseis.mathimataSynch;

  const dimiourgia_xarti = useCallback(async (): Promise<void> => {
    const courseCode = apothiki.kodikosMathimatos;
    if (!courseCode || dimiourgeitai) return;
    setDimiourgeitai(true);
    setStadioAnalisis(1);
    setPosostoAnalisis(20);
    setKatastasi(fortosi<XartisMathimatos>());

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
        'dimiourgia_xarti',
        async () => {
          const result = await generateCourseMap(
            periballon,
            courseCode,
            selectedModel,
            privacy.authorizeGeneration,
            selectedProvider,
          );
          setStadioAnalisis(3);
          setPosostoAnalisis(100);
          setKatastasi(result.ok ? { katastasi: 'etimo', dedomena: result.timi } : sfalma(result.sfalma));
        },
        { courseCode, selectedModel, selectedProvider }
      );
    } catch (reason) {
      setKatastasi(sfalma({
        kodikos: KODIKOS_SFALMATOS_DIKTYOU,
        minima: reason instanceof Error ? reason.message : MINIMA_SFALMATOS_XARTI,
      }));
    } finally {
      clearInterval(xronodiakoptis);
      setDimiourgeitai(false);
    }
  }, [apothiki.kodikosMathimatos, dimiourgeitai, periballon, privacy.authorizeGeneration, selectedModel, selectedProvider]);

  return (
    <div className="episkefsi" data-testid="xartis-ekran">
      <ProskelesioOmonimas
        titlos="Χάρτης"
        ypokeimeno={apothiki.kodikosMathimatos || 'Επίλεξε μάθημα για να δεις την ύλη.'}
        akseis={!apothiki.kodikosMathimatos ? <Link to="/mathimata">Άνοιγμα μαθημάτων →</Link> : undefined}
      />
      {sygxronismena.length > 1 && (
        <div className="kapsoules-filtra-mpara">
          {sygxronismena.map((kodikos) => {
            const einaiEnergo = kodikos === apothiki.kodikosMathimatos;
            return (
              <button
                key={kodikos}
                type="button"
                className={einaiEnergo ? 'kapsoula-filtrou energi' : 'kapsoula-filtrou'}
                onClick={() => {
                  apothiki.allaxe_kodiko_mathimatos(kodikos);
                }}
                aria-pressed={einaiEnergo}
              >
                {kodikos}
              </button>
            );
          })}
        </div>
      )}
      {katastasi.katastasi === 'etimo' ? (
        <OdomosEnotiton
          xartis={katastasi.dedomena}
          telies={apothiki.proodhos.aristeiesEnotiton}
          allaxe_telia={apothiki.allaxe_telia}
          apodosi={apodosi}
        />
      ) : katastasi.katastasi === 'fortosi' ? (
        <OloniKatastasis katastasi={katastasi} adeioMinima={MINIMA_KENOY_XARTI} epanalipsi={epanalipsi}>
          {() => null}
        </OloniKatastasis>
      ) : (
        <Karta
          titlos={katastasi.katastasi === 'adeio' ? 'Δημιουργία χάρτη μαθήματος' : 'Ο χάρτης χρειάζεται ανάλυση'}
          ypokeimeno={katastasi.katastasi === 'adeio'
            ? MINIMA_KENOY_XARTI
            : katastasi.sfalma.minima}
          stoixeia={
            <div className="odoni-lista">
              {geminiSelected && (
                <label className="odoni-xeiris">
                  <input
                    type="checkbox"
                    checked={privacy.optIn}
                    disabled={privacy.loading || privacy.saving || !apothiki.kodikosMathimatos}
                    onChange={(event) => void privacy.setOptIn(event.target.checked).catch(() => undefined)}
                    data-testid="xartis-gemini-optin"
                  />
                  Επιτρέπω στο Gemini να λαμβάνει το υλικό αυτού του μαθήματος. Θα επιβεβαιώνω κάθε αποστολή ξεχωριστά.
                </label>
              )}
              {privacy.error !== null && <p role="alert" className="karta-ypokeimeno">{privacy.error}</p>}
              <button
                type="button"
                className="pilegma pilegma-entono"
                disabled={!apothiki.kodikosMathimatos || dimiourgeitai || privacy.loading || privacy.saving || (geminiSelected && !privacy.optIn)}
                onClick={() => void dimiourgia_xarti()}
                data-testid="xartis-dimiourgia"
              >
                {dimiourgeitai ? 'Ανάλυση υλικού…' : katastasi.katastasi === 'adeio' ? 'Δημιουργία χάρτη' : 'Επανάληψη ανάλυσης'}
              </button>
              {!apothiki.kodikosMathimatos && <Link to="/mathimata">Επίλεξε συγχρονισμένο μάθημα →</Link>}
            </div>
          }
        />
      )}
      {dimiourgeitai && (
        <ProodosDimiourgiasXarti
          stadio={stadioAnalisis}
          pososto={posostoAnalisis}
        />
      )}
      {privacy.dialog}
    </div>
  );
}
