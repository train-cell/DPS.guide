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

/** Synolo ton vimaton sto Bevel-style onboarding wizard. */
export const SYNOLA_VIMATA = 4;

/** Filtra kathgorion panepistimion gia tis kapsoules filtron. */
const FILTRA_KATHGORION: readonly { readonly id: KatigoriaPanepistimiou; readonly titlos: string }[] = [
  { id: 'ola', titlos: 'Όλα' },
  { id: 'stem', titlos: 'Πληροφορική/STEM' },
  { id: 'athina', titlos: 'Αθήνα' },
  { id: 'thessaloniki', titlos: 'Θεσσαλονίκη' },
  { id: 'perifereia', titlos: 'Περιφέρεια' },
  { id: 'custom', titlos: 'Custom' },
];

/** Proepilegmeno panepistimio gia anaktisi me asfaleia typon. */
const PROEPILEGMENTO_PANEPISTIMIO: PanepistimioDedomena = {
  id: 'unipi',
  onoma: 'Πανεπιστήμιο Πειραιώς',
  syntomiOnomasia: 'ΠΑΠΕΙ',
  baseEclass: 'https://thales.cs.unipi.gr',
  katigoria: 'athina',
  perigrafi: 'Τμήμα Πληροφορικής & eClass ΠΑΠΕΙ',
};

/** Titloi ton vimaton gia ton deikti proodou. */
const PERIGRAFI_VIMATOS: readonly string[] = [
  'Βήμα 1 από 4 • Φιλοσοφία & Ασφάλεια',
  'Βήμα 2 από 4 • Επιλογή Ιδρύματος',
  'Βήμα 3 από 4 • Σύνδεση & Διαπιστευτήρια',
  'Βήμα 4 από 4 • Ολοκλήρωση & Επισκόπηση',
];

/** Ιδιότητες της οθόνης πρώτης εκτέλεσης. */
export interface ProedriProps {
  /** Περιβάλλον πυλών· όταν λείπει χτίζεται με τις προεπιλογές ψεύτικες πύλες. */
  readonly periballon?: Periballon;
}

/** Οθόνη πρώτης εκτέλεσης: Bevel-style Onboarding Wizard & Σύνδεση στο eClass. */
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
  const [trexonVima, setTrexonVima] = useState<number>(1);

  const tipImeras = useMemo(() => pare_tip_imeras(), []);

  const epilegmenoPanepistimio = useMemo<PanepistimioDedomena>(
    () => PANEPISTIMIA_LISTA.find((pan) => pan.id === epilegmenoPanepistimioId) ?? PROEPILEGMENTO_PANEPISTIMIO,
    [epilegmenoPanepistimioId]
  );

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

  function allagi_vimatos(neoVima: number): void {
    if (neoVima >= 1 && neoVima <= SYNOLA_VIMATA) {
      setTrexonVima(neoVima);
    }
  }

  function proigoumeno_vima(): void {
    if (trexonVima > 1) {
      setTrexonVima((palio) => palio - 1);
    }
  }

  function epomeno_vima(): void {
    if (trexonVima < SYNOLA_VIMATA) {
      if (trexonVima === 3 && xekinisei) {
        void pane_syndexi();
      }
      setTrexonVima((palio) => palio + 1);
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
        setTrexonVima(4);
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
      {/* 1. Bevel-style Segmented Progress Bar stin koryfi */}
      <div
        className="onboarding-vima-mpara"
        role="progressbar"
        aria-valuenow={trexonVima}
        aria-valuemin={1}
        aria-valuemax={SYNOLA_VIMATA}
        aria-label={PERIGRAFI_VIMATOS[trexonVima - 1]}
      >
        {[1, 2, 3, 4].map((vima) => (
          <button
            key={vima}
            type="button"
            className={`vima-tmima${trexonVima >= vima ? ' energo' : ''}${trexonVima === vima ? ' trexon' : ''}`}
            onClick={() => allagi_vimatos(vima)}
            aria-label={`Μετάβαση στο Βήμα ${vima}`}
          />
        ))}
      </div>

      <div className="onboarding-vima-deiktis">{PERIGRAFI_VIMATOS[trexonVima - 1]}</div>

      {/* 2. Step 1: Eisagogi, Filosofia & Zero-Knowledge Vault */}
      <div className={`onboarding-vima-periexomeno vima-1${trexonVima === 1 ? ' vima-energo' : ' vima-krifo'}`}>
        <div className="onboarding-iroas-kouti">
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

        <div className="onboarding-xaraktiristika-karta">
          <span className="onboarding-karta-ypotitlos">Πώς λειτουργεί το DPS.guide</span>
          <div className="onboarding-xaraktiristiko-grammi">
            <div className="onboarding-eikonidio-kouti" aria-hidden="true">
              🔒
            </div>
            <div className="onboarding-xaraktiristiko-keimeno">
              <h3>100% Τοπική Ασφάλεια</h3>
              <p>Τα διαπιστευτήρια και τα αρχεία σου αποθηκεύονται αποκλειστικά στη συσκευή σου.</p>
            </div>
          </div>
          <div className="onboarding-xaraktiristiko-grammi">
            <div className="onboarding-eikonidio-kouti" aria-hidden="true">
              ⚡
            </div>
            <div className="onboarding-xaraktiristiko-keimeno">
              <h3>Offline-First Μελέτη</h3>
              <p>Όλο το υλικό, PDFs, σημειώσεις και πρόγραμμα είναι διαθέσιμα χωρίς σύνδεση.</p>
            </div>
          </div>
          <div className="onboarding-xaraktiristiko-grammi">
            <div className="onboarding-eikonidio-kouti" aria-hidden="true">
              🧠
            </div>
            <div className="onboarding-xaraktiristiko-keimeno">
              <h3>Τοπικός AI Tutor</h3>
              <p>Ερωτοαπαντήσεις και χάρτης γνώσης με απόλυτη ιδιωτικότητα και δικό σου κλειδί.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Step 2: Epilogi Panepistimiou & eClass Portal */}
      <div className={`onboarding-vima-periexomeno vima-2${trexonVima === 2 ? ' vima-energo' : ' vima-krifo'}`}>
        <div className="onboarding-vima-epikefalida">
          <h2>Επίλεξε Ίδρυμα</h2>
          <p>Σε ποιο πανεπιστήμιο ή πολυτεχνείο σπουδάζεις;</p>
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
      </div>

      {/* 4. Step 3: Syndesi sto eClass & Forma Diapistevtirion */}
      <div className={`onboarding-vima-periexomeno vima-3${trexonVima === 3 ? ' vima-energo' : ' vima-krifo'}`}>
        <div className="onboarding-vima-epikefalida">
          <h2>Σύνδεση στο eClass</h2>
          <p>Συνδέσου με τα ακαδημαϊκά σου διαπιστευτήρια.</p>
        </div>

        <div className="epilegmeno-panepistimio-proepiskopisi">
          <div className="panepistimio-tautotita">
            <EikonidioPanepistimiou id={epilegmenoPanepistimio.id} megethos={28} />
            <span className="panepistimio-onomasia-sygk">
              {epilegmenoPanepistimio.syntomiOnomasia}
            </span>
          </div>
          <button
            type="button"
            className="allagi-panepistimiou-koumpi"
            onClick={() => setTrexonVima(2)}
          >
            Αλλαγή
          </button>
        </div>

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

          <button
            type="button"
            className="proedri-parakampsis-koumpi"
            onClick={() => setTrexonVima(4)}
          >
            Δοκιμή σε Τοπική Λειτουργία (Demo / Offline)
          </button>
        </form>
      </div>

      {/* 5. Step 4: Epivevaiosi & Oloklirosi (Receipt & Confirmation opws IMG_0495) */}
      <div className={`onboarding-vima-periexomeno vima-4${trexonVima === 4 ? ' vima-energo' : ' vima-krifo'}`}>
        <div className="onboarding-vima-epikefalida">
          <h2>Επιβεβαίωση & Επισκόπηση</h2>
          <p>Όλα είναι έτοιμα για την έναρξη των σπουδών σου.</p>
        </div>

        <div className="onboarding-apodeixi-karta">
          <div className="onboarding-apodeixi-koryfi">
            <span className="onboarding-apodeixi-sygxaritiria">Συγχαρητήρια! 🎉</span>
            <h3 className="onboarding-apodeixi-titlos">Το ακαδημαϊκό σου προφίλ είναι έτοιμο</h3>
          </div>
          <div className="onboarding-apodeixi-grammes">
            <div className="onboarding-apodeixi-grammi">
              <span className="apodeixi-etiketa">Πανεπιστήμιο</span>
              <span className="apodeixi-timi">{epilegmenoPanepistimio.onoma}</span>
            </div>
            <div className="onboarding-apodeixi-grammi">
              <span className="apodeixi-etiketa">Πύλη eClass</span>
              <span className="apodeixi-timi">{base}</span>
            </div>
            <div className="onboarding-apodeixi-grammi">
              <span className="apodeixi-etiketa">Ασφάλεια</span>
              <span className="apodeixi-timi">Zero-Knowledge Hardware Vault</span>
            </div>
            <div className="onboarding-apodeixi-grammi">
              <span className="apodeixi-etiketa">Λειτουργία</span>
              <span className="apodeixi-timi">100% Τοπική (Offline-first)</span>
            </div>
          </div>
        </div>

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

      {/* 6. Bevel Bottom Navigation Dock (opws IMG_0475, IMG_0477) */}
      <nav className="onboarding-ploigisi-mpara" aria-label="Πλοήγηση onboarding">
        <button
          type="button"
          className={`onboarding-koumpi-piso${trexonVima === 1 ? ' aoratos' : ''}`}
          onClick={proigoumeno_vima}
          aria-label="Προηγούμενο βήμα"
          disabled={trexonVima === 1}
        >
          ←
        </button>
        <button
          type="button"
          className="onboarding-koumpi-epomeno"
          onClick={epomeno_vima}
          data-testid="onboarding-epomeno-koumpi"
        >
          {trexonVima === 1 && 'Επόμενο: Ίδρυμα →'}
          {trexonVima === 2 && 'Επόμενο: Σύνδεση →'}
          {trexonVima === 3 && (xekinisei ? 'Σύνδεση στο eClass →' : 'Συνέχεια →')}
          {trexonVima === 4 && 'Είσοδος στην Εφαρμογή ✓'}
        </button>
      </nav>
    </div>
  );
}