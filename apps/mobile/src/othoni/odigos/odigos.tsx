import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IonButton } from '@ionic/react';
import { Karta, OloniKatastasis, ProskelesioOmonimas } from '../../koinima/index.js';
import { fortosi, type Katastasi } from '../../kathstasi/index.js';
import { xrisiApothekisis } from '../../apothiki/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import { fortose_odigo_apo_apothiki } from '../../ypiresies/index.js';
import type { OdigosEnotitas } from '../../ypiresies/index.js';
import { LEKIKIA_TMIMATON, EPKEFALIDES_TMIMATON } from '../../ypiresies/index.js';
import { analise_parapompi, diadromi_provolis, stilise_parapompi } from '../../provoli-pdf/index.js';
import { useCourseAiPrivacy } from '../../ypiresies/ai-generation-approval.js';
import { generateCourseGuide } from '../../ypiresies/pipeline-analisis.js';
import { PROEPILOGI_GEMINI_MONTELO } from '../../ypiresies/ai-models.js';

/** Μία παραπομπή τμήματος οδηγού: tap ανοίγει το PDF στη σωστή σελίδα, αλλιώς μένει απλό κείμενο. */
export function ParapompiTmimatos({ parapompi }: { readonly parapompi: string }) {
  const navigate = useNavigate();
  const analise = analise_parapompi(parapompi);
  if (analise === null) {
    return <p className="odigos-parapompi">{parapompi}</p>;
  }
  return (
    <button
      type="button"
      className="odigos-parapompi odigos-parapompi-koumpi"
      data-testid="odigos-parapompi"
      onClick={() => {
        navigate(diadromi_provolis(analise));
      }}
    >
      {stilise_parapompi(analise)}
    </button>
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
  const privacy = useCourseAiPrivacy(periballon.apothiki, kodikosMathimatos, kodikosMathimatos);
  const selectedModel = apothiki.rytheseis.onomaMontelou || PROEPILOGI_GEMINI_MONTELO;
  const geminiSelected = selectedModel.toLowerCase().startsWith('gemini-');

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
    setKatastasi(fortosi<OdigosEnotitas>());
    try {
      const result = await generateCourseGuide(
        periballon,
        kodikosMathimatos,
        enotitaId,
        selectedModel,
        privacy.authorizeGeneration,
      );
      if (!result.ok) {
        setKatastasi({ katastasi: 'sfalma', sfalma: result.sfalma });
        return;
      }
      const loaded = await fortose_odigo_apo_apothiki(periballon.apothiki, kodikosMathimatos, enotitaId);
      setKatastasi(loaded);
      if (loaded.katastasi === 'adeio') {
        setKatastasi({ katastasi: 'sfalma', sfalma: { kodikos: 'MI_EGKYRO_SXIMA', minima: 'Ο οδηγός παράχθηκε αλλά δεν μπόρεσε να φορτωθεί.' } });
      }
    } catch (reason) {
      setKatastasi({
        katastasi: 'sfalma',
        sfalma: {
          kodikos: 'DIKTYO',
          minima: reason instanceof Error ? reason.message : 'Δεν δημιουργήθηκε ο οδηγός.',
        },
      });
    } finally {
      setDimiourgeitai(false);
    }
  }, [dimiourgeitai, enotitaId, kodikosMathimatos, periballon, privacy.authorizeGeneration, selectedModel]);

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
                  <div className="odigos-paragrafos">
                    {tmima.keimena.map((keimeno) => (
                      <p key={keimeno}>{keimeno}</p>
                    ))}
                  </div>
                  <ParapompiTmimatos parapompi={tmima.parapompi} />
                </section>
              );
            })}
          </>
        )}
          </OloniKatastasis>
        </>
      )}
      {dimiourgeitai && <p role="status" className="karta-ypokeimeno">Δημιουργία οδηγού από τοπικά αποθηκευμένο υλικό…</p>}
      {privacy.dialog}
    </div>
  );
}
