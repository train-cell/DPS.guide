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

/** Η προεπιλεγμένη διεύθυνση του eClass στο Πανεπιστήμιο Πειραιώς. */
export const PROEDRI_BASE_URL = 'https://thales.cs.unipi.gr';

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

  const xekinisei = xristis.trim().length > 0 && kodikos.trim().length > 0;

  async function pane_syndexi(): Promise<void> {
    setAnamemeni(true);
    setEpixeirithike(true);
    setKatastasi(fortosi());
    try {
      const apotelesma = await fortose_mathimata_apo_apothiki(pyles.apothiki);
      if (apotelesma.katastasi === 'etimo') {
        await pyles.mystika.vale('eclass_onoma_xristi', xristis.trim());
        await pyles.mystika.vale('eclass_kodikos', kodikos.trim());
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
      <Karta
        titlos="Επιτυχής σύνδεση"
        ypokeimeno="Η σύνδεση με το eClass ολοκληρώθηκε. Τα διαπιστευτήρια αποθηκεύτηκαν μόνο στη συσκευή σου."
        stoixeia={<Pilegma keimeno={`Μαθήματα: ${mathimata.length}`} entono />}
      />
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