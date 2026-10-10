import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { xrisiApothekisis } from '../../apothiki/index.js';
import type { Rytheseis } from '../../apothiki/index.js';
import { Karta, Pilegma, ProskelesioOmonimas } from '../../koinima/index.js';

/** Τα πεδία των ρυθμίσεων που ο χρήστης μπορεί να αλλάξει από την οθόνη. */
export interface GrammataRythmiseon {
  /** Διεύθυνση του eClass. */
  readonly baseUrl: string;
  /** Όνομα μοντέλου AI, όπως το δίνει η αποθήκευση. */
  readonly onomaMontelou: string;
  /** Αν οι τοπικές ειδοποιήσεις είναι ενεργές. */
  readonly einaiEidopoieseis: boolean;
}

/** Επιλέγει από τις αποθηκευμένες ρυθμίσεις τα πεδία που μπορεί να επεξεργαστεί ο χρήστης. */
export function pare_editable_rytheseis(rytheseis: Rytheseis): GrammataRythmiseon {
  return {
    baseUrl: rytheseis.baseUrl,
    onomaMontelou: rytheseis.onomaMontelou,
    einaiEidopoieseis: rytheseis.einaiEidopoieseis,
  };
}

/** Οθόνη ρυθμίσεων: τιμές από την αποθήκευση, επεξεργάσιμες και αποθηκευμένες στη συσκευή. */
export default function Rythisies() {
  const apothiki = xrisiApothekisis();
  const { baseUrl, onomaMontelou, einaiEidopoieseis } = apothiki.rytheseis;
  const [grammata, setGrammata] = useState<GrammataRythmiseon>(() =>
    pare_editable_rytheseis(apothiki.rytheseis)
  );
  const [apothikefthike, setApothikefthike] = useState(false);

  useEffect(() => {
    setGrammata({ baseUrl, onomaMontelou, einaiEidopoieseis });
  }, [baseUrl, onomaMontelou, einaiEidopoieseis]);

  function trexouses(): Rytheseis {
    return { ...apothiki.rytheseis, ...grammata };
  }

  async function apothikefse(vees: Rytheseis): Promise<void> {
    await apothiki.allaxe_rytheseis(vees);
    setApothikefthike(true);
  }

  function allaze_gramma(allax: Partial<GrammataRythmiseon>): void {
    setGrammata((palies) => ({ ...palies, ...allax }));
    setApothikefthike(false);
  }

  function allaze_eidopoieseis(): void {
    const nees: GrammataRythmiseon = {
      ...grammata,
      einaiEidopoieseis: !grammata.einaiEidopoieseis,
    };
    setGrammata(nees);
    setApothikefthike(false);
    void apothikefse({ ...apothiki.rytheseis, ...nees });
  }

  function ypostiripse(erevma: FormEvent<HTMLFormElement>): void {
    erevma.preventDefault();
    setApothikefthike(false);
    void apothikefse(trexouses());
  }

  const exeiKleidiLlm = apothiki.rytheseis.exeiKleidiLlm;

  return (
    <form className="odoni-lista" data-testid="rythisies-ekran" onSubmit={ypostiripse}>
      <ProskelesioOmonimas
        titlos="Ρυθμίσεις"
        ypokeimeno="Ό,τι αποθηκεύεται εδώ παραμένει στη συσκευή σου."
      />

      <Karta
        titlos="Σύνδεση"
        ypokeimeno="Διεύθυνση του eClass και μαθήματα που συγχρονίζονται."
        stoixeia={
          <div>
            <label className="odoni-xeiris-zeugos" htmlFor="rythisies-gramma-base">
              Διεύθυνση eClass
            </label>
            <input
              className="proedri-travla-gramma"
              id="rythisies-gramma-base"
              data-testid="rythisies-gramma-base"
              name="baseUrl"
              type="url"
              inputMode="url"
              autoComplete="url"
              value={grammata.baseUrl}
              onChange={(erevma) => allaze_gramma({ baseUrl: erevma.target.value })}
              aria-label="Διεύθυνση eClass"
            />
            {apothiki.rytheseis.mathimataSynch.length === 0 ? (
              <Pilegma keimeno="Συγχρονισμός: κανένα μάθημα" />
            ) : (
              apothiki.rytheseis.mathimataSynch.map((titlos) => (
                <Pilegma key={titlos} keimeno={titlos} />
              ))
            )}
          </div>
        }
      />

      <Karta
        titlos="Μοντέλο AI"
        ypokeimeno="Το μοντέλο που χρησιμοποιείται για απαντήσεις και περιλήψεις."
        stoixeia={
          <div data-testid="rythisies-seira-montelo">
            <label className="odoni-xeiris-zeugos" htmlFor="rythisies-gramma-montelo">
              Όνομα μοντέλου
            </label>
            <input
              className="proedri-travla-gramma"
              id="rythisies-gramma-montelo"
              data-testid="rythisies-gramma-montelo"
              name="onomaMontelou"
              type="text"
              autoComplete="off"
              value={grammata.onomaMontelou}
              onChange={(erevma) => allaze_gramma({ onomaMontelou: erevma.target.value })}
              aria-label="Όνομα μοντέλου AI"
            />
            <Pilegma
              keimeno={exeiKleidiLlm ? 'Κλειδί: Ρυθμισμένο' : 'Κλειδί: Μη ρυθμισμένο'}
              entono={exeiKleidiLlm}
            />
          </div>
        }
      />

      <Karta
        titlos="Αποθήκευση"
        ypokeimeno="Τα αρχεία και οι πόροι των μαθημάτων μένουν στη συσκευή σου."
        stoixeia={
          <div data-testid="rythisies-apothikeysi">
            <Pilegma keimeno={apothiki.rytheseis.onomasApothikefsis} />
          </div>
        }
      />

      <Karta
        titlos="Πρόγραμμα μελέτης"
        ypokeimeno="Εξετάσεις, έναρξη εξεταστικής, εβδομαδιαίο template λεπτών και εξαιρέσεις."
        stoixeia={
          <Link to="/programma" className="pilegma pilegma-entono" data-testid="rythisies-programma">
            Ρυθμίσεις προγράμματος
          </Link>
        }
      />

      <Karta
        titlos="Ειδοποιήσεις"
        ypokeimeno="Οι ειδοποιήσεις είναι τοπικές· δεν αποστέλλονται δεδομένα σε διακομιστή."
        stoixeia={
          <button
            type="button"
            role="switch"
            aria-checked={grammata.einaiEidopoieseis}
            aria-label="Τοπικές ειδοποιήσεις"
            className={`pilegma${grammata.einaiEidopoieseis ? ' pilegma-entono' : ''}`}
            data-testid="rythisies-eidopoieseis"
            onClick={allaze_eidopoieseis}
          >
            {grammata.einaiEidopoieseis ? 'Ενεργές' : 'Ανενεργές'}
          </button>
        }
      />

      <div className="odoni-xeiris">
        <button
          type="submit"
          className="pilegma pilegma-entono"
          data-testid="rythisies-apothekeysto"
          aria-label="Αποθήκευση ρυθμίσεων"
        >
          Αποθήκευση
        </button>
        {apothikefthike && <Pilegma keimeno="Αποθηκεύτηκε" entono />}
      </div>
    </form>
  );
}