import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IonButton } from '@ionic/react';
import { OloniKatastasis, ProskelesioOmonimas } from '../../koinima/index.js';
import { fortosi, type Katastasi } from '../../kathstasi/index.js';
import { xrisiApothekisis } from '../../apothiki/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import { fortose_odigo_apo_apothiki } from '../../ypiresies/index.js';
import type { OdigosEnotitas } from '../../ypiresies/index.js';
import { LEKIKIA_TMIMATON, EPKEFALIDES_TMIMATON } from '../../ypiresies/index.js';
import { analise_parapompi, diadromi_provolis, stilise_parapompi } from '../../provoli-pdf/index.js';

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
  const { kodikosMathimatos } = xrisiApothekisis();
  const [katastasi, setKatastasi] = useState<Katastasi<OdigosEnotitas>>(fortosi<OdigosEnotitas>());
  const [proseis, setProseis] = useState(0);

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
      <OloniKatastasis
        katastasi={katastasi}
        adeioMinima="Αυτή η ενότητα δεν έχει ακόμη οδηγό."
        epanalipsiMinima="Ξανάφορτο"
        epanalipsi={epanalipsi}
      >
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
    </div>
  );
}
