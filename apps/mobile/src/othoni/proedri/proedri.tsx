import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { IonButton } from '@ionic/react';
import type { Mathima } from '@dps/core';
import { Karta, OloniKatastasis, Pilegma } from '../../koinima/index.js';
import { adeio, fortosi, sfalma } from '../../kathstasi/index.js';
import type { Katastasi } from '../../kathstasi/index.js';
import { ftiaxe_periballon } from '../../periballon/index.js';
import type { Periballon } from '../../periballon/index.js';
import { fortose_mathimata_apo_apothiki } from '../../ypiresies/index.js';
import {
  EikonidioAsfaleias,
  EikonidioPanepistimiou,
  PANEPISTIMIA_LISTA,
  type KatigoriaPanepistimiou,
  type PanepistimioDedomena,
} from '../../design/eikonidia-panepistimion.js';
import { pare_tip_imeras } from './foititika-tips.js';
import './proedri.css';

/** Η προεπιλεγμένη διεύθυνση του eClass στο Πανεπιστήμιο Πειραιώς. */
export const PROEDRI_BASE_URL = 'https://thales.cs.unipi.gr';

/** Filtra kathgorion panepistimion gia tis kapsoules filtron. */
const FILTRA_KATHGORION: readonly { readonly id: KatigoriaPanepistimiou; readonly titlos: string }[] = [
  { id: 'ola', titlos: 'Όλα' },
  { id: 'stem', titlos: 'Πληροφορική/STEM' },
  { id: 'athina', titlos: 'Αθήνα' },
  { id: 'thessaloniki', titlos: 'Θεσσαλονίκη' },
  { id: 'perifereia', titlos: 'Περιφέρεια' },
  { id: 'custom', titlos: 'Custom' },
];

/** Ιδιότητες της οθόνης πρώτης εκτέλεσης. */
export interface ProedriProps {
  /** Περιβάλλον πυλών· όταν λείπει χτίζεται με τις προεπιλογές ψεύτικες πύλες. */
  readonly periballon?: Periballon;
}

/** Οθόνη πρώτης εκτέλεσης: σύνδεση στο eClass με διαπιστευτήρια που παραμένουν στη συσκευή. */
export default function Proedri({ periballon }: ProedriProps) {
  const pyles = useMemo(() => periballon ?? ftiaxe_periballon(), [periballon]);
  const [base, setBase] = useState(PROEDRI_BASE_URL);
  const [xristis, setXristis] = useState('');
  const [kodikos, setKodikos] = useState('');
  const [anamemeni, setAnamemeni] = useState(false);
  const [epixeirithike, setEpixeirithike] = useState(false);
  const [katastasi, setKatastasi] = useState<Katastasi<readonly Mathima[]>>(adeio);
  const [epilegmeniKatigoria, setEpilegmeniKatigoria] = useState<KatigoriaPanepistimiou>('ola');
  const [epilegmenoPanepistimioId, setEpilegmenoPanepistimioId] = useState<string>('unipi');
  const [anazitisi, setAnazitisi] = useState('');

  const tipImeras = useMemo(() => pare_tip_imeras(), []);

  const fildarismenaPanepistimia = useMemo(() => {
    let lista =
      epilegmeniKatigoria === 'ola'
        ? PANEPISTIMIA_LISTA
        : PANEPISTIMIA_LISTA.filter((pan) => pan.katigoria === epilegmeniKatigoria);

    const lexi = anazitisi.trim().toLowerCase();
    if (lexi.length > 0) {
      lista = lista.filter(
        (pan) =>
          pan.onoma.toLowerCase().includes(lexi) ||
          pan.syntomiOnomasia.toLowerCase().includes(lexi) ||
          pan.perigrafi.toLowerCase().includes(lexi) ||
          pan.id.toLowerCase().includes(lexi)
      );
    }
    return lista;
  }, [epilegmeniKatigoria, anazitisi]);

  const xekinisei = xristis.trim().length > 0 && kodikos.trim().length > 0;

  function epilexe_panepistimio(panepistimio: PanepistimioDedomena): void {
    setEpilegmenoPanepistimioId(panepistimio.id);
    if (panepistimio.baseEclass.length > 0) {
      setBase(panepistimio.baseEclass);
    }
  }

  async function pane_syndexi(): Promise<void> {
    setAnamemeni(true);
    setEpixeirithike(true);
    setKatastasi(fortosi());
    try {
      const apotelesma = await fortose_mathimata_apo_apothiki(pyles.apothiki);
      if (apotelesma.katastasi === 'etimo') {
        await pyles.mystika.vale('eclass_onoma_xristi', xristis.trim());
        await pyles.mystika.vale('eclass_kodikos', kodikos.trim());
        await pyles.mystika.vale('eclass_panepistimio_id', epilegmenoPanepistimioId);
        await pyles.mystika.vale('eclass_base_url', base.trim());
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('eclass_panepistimio_id', epilegmenoPanepistimioId);
            localStorage.setItem('eclass_onoma_xristi', xristis.trim());
            localStorage.setItem('dps_sindesi_energi', 'true');
          } catch {
            // Ignored se private mode
          }
        }
      }
      setKatastasi(apotelesma);
    } catch {
      setKatastasi(
        sfalma({
          kodikos: 'AGNOSTO',
          minima: 'Η σύνδεση διέκοψε απρόσμενα. Μπορείς να δοκιμάσεις ξανά.',
        })
      );
    } finally {
      setAnamemeni(false);
    }
  }

  function ypostiripse(erevma: FormEvent<HTMLFormElement>): void {
    erevma.preventDefault();
    void pane_syndexi();
  }

  function ananevei(): void {
    void pane_syndexi();
  }

  function akriveia(mathimata: readonly Mathima[]) {
    return (
      <div className="proedri-epityxia-perioxh">
        <Karta
          titlos="Επιτυχής σύνδεση"
          ypokeimeno="Η σύνδεση με το eClass ολοκληρώθηκε. Τα διαπιστευτήρια αποθηκεύτηκαν μόνο στη συσκευή σου."
          stoixeia={<Pilegma keimeno={`Μαθήματα: ${mathimata.length}`} entono />}
        />
        <IonButton
          expand="block"
          routerLink="/simera"
          routerDirection="forward"
          className="proedri-eisodos-koumpi"
          data-testid="proedri-eisodos-koumpi"
        >
          Είσοδος στην Εφαρμογή →
        </IonButton>
      </div>
    );
  }

  return (
    <div className="proedri-plaka" data-testid="proedri-ekran">
      <div>
        <h1 className="proedri-megalo">DPS.guide</h1>
        <p className="proedri-keimeno">
          Ο βοηθός σου για το eClass: μαθήματα, αρχεία και ετοιμότητα για τις εξετάσεις, αποκλειστικά στο
          κινητό σου.
        </p>
      </div>

      <div className="asfaleia-shma" data-testid="asfaleia-shma">
        <span className="asfaleia-shma-eikonidio">
          <EikonidioAsfaleias megethos={16} />
        </span>
        <span>Zero-Knowledge Hardware Vault • Κρυπτογραφημένα τοπικά</span>
      </div>

      <div className="foititiko-tip-kouti" data-testid="foititiko-tip-kouti">
        <span aria-hidden="true">💡</span>
        <p>{tipImeras}</p>
      </div>

      <div
        className="kapsoules-filtra-mpara"
        role="tablist"
        aria-label="Φίλτρα πανεπιστημίων"
        data-testid="filtra-panepistimion"
      >
        {FILTRA_KATHGORION.map((filtro) => {
          const einaiEnergi = epilegmeniKatigoria === filtro.id;
          return (
            <button
              key={filtro.id}
              type="button"
              role="tab"
              aria-selected={einaiEnergi}
              className={`kapsoula-filtrou${einaiEnergi ? ' energi' : ''}`}
              onClick={() => setEpilegmeniKatigoria(filtro.id)}
              data-testid={`filtro-${filtro.id}`}
            >
              {filtro.titlos}
            </button>
          );
        })}
      </div>

      <div className="anazitisi-panepistimiou-perioxh">
        <input
          type="search"
          className="anazitisi-panepistimiou-pedio"
          placeholder="Αναζήτηση σχολής, τμήματος ή πόλης..."
          value={anazitisi}
          onChange={(erevma) => setAnazitisi(erevma.target.value)}
          data-testid="anazitisi-panepistimiou-pedio"
          aria-label="Αναζήτηση σχολής ή πανεπιστημίου"
        />
      </div>

      {fildarismenaPanepistimia.length === 0 ? (
        <div className="lista-panepistimion-keno" data-testid="lista-panepistimion-keno">
          <p>Δεν βρέθηκε ίδρυμα με αυτόν τον όρο.</p>
          <button
            type="button"
            className="kapsoula-filtrou energi"
            onClick={() => {
              setEpilegmeniKatigoria('custom');
              setAnazitisi('');
              setEpilegmenoPanepistimioId('custom');
            }}
            data-testid="koumpi-epilogi-custom"
          >
            Επιλογή Custom eClass URL
          </button>
        </div>
      ) : (
        <div className="lista-panepistimion-grid" data-testid="lista-panepistimion">
          {fildarismenaPanepistimia.map((panepistimio) => {
            const einaiEpilegmeno = epilegmenoPanepistimioId === panepistimio.id;
            return (
              <div
                key={panepistimio.id}
                role="button"
                tabIndex={0}
                className={`karta-panepistimiou${einaiEpilegmeno ? ' epilegmeni' : ''}`}
                onClick={() => epilexe_panepistimio(panepistimio)}
                onKeyDown={(erevma) => {
                  if (erevma.key === 'Enter' || erevma.key === ' ') {
                    epilexe_panepistimio(panepistimio);
                  }
                }}
                data-testid={`karta-panepistimiou-${panepistimio.id}`}
                aria-pressed={einaiEpilegmeno}
              >
                <EikonidioPanepistimiou id={panepistimio.id} megethos={32} />
                <div className="karta-panepistimiou-periexomeno">
                  <span className="karta-panepistimiou-titlos">
                    {panepistimio.syntomiOnomasia} — {panepistimio.onoma}
                  </span>
                  <span className="karta-panepistimiou-ypotitlos">{panepistimio.perigrafi}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form className="proedri-travla" data-testid="proedri-forma" onSubmit={ypostiripse}>
        <label className="odoni-xeiris-zeugos" htmlFor="proedri-gramma-base">
          Διεύθυνση eClass
        </label>
        <input
          className="proedri-travla-gramma"
          id="proedri-gramma-base"
          data-testid="proedri-gramma-base"
          name="base"
          type="url"
          inputMode="url"
          autoComplete="url"
          value={base}
          onChange={(erevma) => setBase(erevma.target.value)}
          aria-label="Διεύθυνση eClass"
        />

        <label className="odoni-xeiris-zeugos" htmlFor="proedri-gramma-xristis">
          Όνομα χρήστη eClass
        </label>
        <input
          className="proedri-travla-gramma"
          id="proedri-gramma-xristis"
          data-testid="proedri-gramma-xristis"
          name="username"
          type="text"
          autoComplete="username"
          value={xristis}
          onChange={(erevma) => setXristis(erevma.target.value)}
          aria-label="Όνομα χρήστη eClass"
        />

        <label className="odoni-xeiris-zeugos" htmlFor="proedri-gramma-kodikos">
          Κωδικός πρόσβασης eClass
        </label>
        <input
          className="proedri-travla-gramma"
          id="proedri-gramma-kodikos"
          data-testid="proedri-gramma-kodikos"
          name="password"
          type="password"
          autoComplete="current-password"
          value={kodikos}
          onChange={(erevma) => setKodikos(erevma.target.value)}
          aria-label="Κωδικός πρόσβασης eClass"
        />

        <p className="proedri-ypostirixtiki">
          Το όνομα χρήστη και ο κωδικός αποθηκεύονται μόνο στη συσκευή σου, σε ασφαλή αποθήκευση, και
          χρησιμοποιούνται μόνο για τη σύνδεση με τον διακομιστή του eClass. Δεν περνούν από κανέναν δικό
          μας διακομιστή.
        </p>

        <IonButton
          type="submit"
          expand="block"
          disabled={!xekinisei || anamemeni}
          data-testid="proediri-syndeon"
          aria-label="Σύνδεση στο eClass"
          onClick={ananevei}
        >
          Σύνδεση
        </IonButton>
      </form>

      <OloniKatastasis
        katastasi={katastasi}
        adeioMinima={
          epixeirithike
            ? 'Δεν βρέθηκαν μαθήματα για αυτόν τον λογαριασμό.'
            : 'Πατήστε «Σύνδεση» για να δείτε τα μαθήματά σας.'
        }
        epanalipsiMinima="Δοκίμασε ξανά"
        epanalipsi={ananevei}
      >
        {akriveia}
      </OloniKatastasis>
    </div>
  );
}