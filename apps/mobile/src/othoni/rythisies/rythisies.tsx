import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { xrisiApothekisis } from '../../apothiki/index.js';
import type { Rytheseis } from '../../apothiki/index.js';
import { Karta, Pilegma, ProskelesioOmonimas } from '../../koinima/index.js';
import {
  pare_trexon_thema,
  thete_thema,
  type ThemaId,
} from '../../design/themata.js';
import { EikonidioPanepistimiou, PANEPISTIMIA_LISTA } from '../../design/eikonidia-panepistimion.js';
import type { PanepistimioId } from '../../design/eikonidia-panepistimion.js';

/** Επιλογές διαθέσιμων θεμάτων εμφάνισης. */
const THEMATA_EPILOGES: readonly { readonly id: ThemaId; readonly titlos: string }[] = [
  { id: 'midnight', titlos: 'Midnight OLED' },
  { id: 'unistudents', titlos: 'UniStudents Blue' },
  { id: 'emerald', titlos: 'Emerald Green' },
  { id: 'light', titlos: 'Clean Light' },
];

/** Τα πεδία των ρυθμίσεων που ο χρήστης μπορεί να αλλάξει από την οθόνη. */
export interface GrammataRythmiseon {
  /** Διεύθυνση του eClass. */
  readonly baseUrl: string;
  /** Αν οι τοπικές ειδοποιήσεις είναι ενεργές. */
  readonly einaiEidopoieseis: boolean;
}

/** Επιλέγει από τις αποθηκευμένες ρυθμίσεις τα πεδία που μπορεί να επεξεργαστεί ο χρήστης. */
export function pare_editable_rytheseis(rytheseis: Rytheseis): GrammataRythmiseon {
  return {
    baseUrl: rytheseis.baseUrl,
    einaiEidopoieseis: rytheseis.einaiEidopoieseis,
  };
}

/** Οθόνη ρυθμίσεων: τιμές από την αποθήκευση, επεξεργάσιμες και αποθηκευμένες στη συσκευή. */
export default function Rythisies() {
  const apothiki = xrisiApothekisis();
  const { baseUrl, einaiEidopoieseis } = apothiki.rytheseis;
  const [grammata, setGrammata] = useState<GrammataRythmiseon>(() =>
    pare_editable_rytheseis(apothiki.rytheseis)
  );
  const [apothikefthike, setApothikefthike] = useState(false);
  const [trexonThema, setTrexonThema] = useState<ThemaId>(() => pare_trexon_thema(apothiki.rytheseis.themaId));

  useEffect(() => {
    setGrammata({ baseUrl, einaiEidopoieseis });
  }, [baseUrl, einaiEidopoieseis]);

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

  function allaxe_thema(themaId: ThemaId): void {
    thete_thema(themaId);
    setTrexonThema(themaId);
    void apothiki.allaxe_rytheseis({ ...apothiki.rytheseis, themaId });
  }

  function ypostiripse(erevma: FormEvent<HTMLFormElement>): void {
    erevma.preventDefault();
    setApothikefthike(false);
    void apothikefse(trexouses());
  }

  const exeiKleidiLlm = apothiki.rytheseis.exeiKleidiLlm;
  const panepistimioId = (apothiki.rytheseis.panepistimioId ?? 'unipi') as PanepistimioId;
  const panepistimio =
    PANEPISTIMIA_LISTA.find((p) => p.id === panepistimioId) ?? {
      id: 'unipi' as PanepistimioId,
      onoma: 'Πανεπιστήμιο Πειραιώς',
      syntomiOnomasia: 'ΠΑΠΕΙ',
      baseEclass: 'https://thales.cs.unipi.gr',
      katigoria: 'athina' as const,
      perigrafi: 'Τμήμα Πληροφορικής & eClass ΠΑΠΕΙ',
    };

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
            <div className="simera-panepistimio-badge">
              <EikonidioPanepistimiou id={panepistimioId} megethos={18} />
              <span>{panepistimio.onoma} ({panepistimio.syntomiOnomasia})</span>
            </div>
            <div className="odoni-xeiris">
              <Link to="/proedri" className="pilegma pilegma-entono" data-testid="rythisies-allagi-panepistimiou">
                Αλλαγή Πανεπιστημίου / Επανασύνδεση →
              </Link>
            </div>
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
        ypokeimeno="Ο πάροχος και το μοντέλο ρυθμίζονται από την ειδική οθόνη AI."
        stoixeia={
          <div data-testid="rythisies-seira-montelo">
            <div className="odoni-xeiris">
              <Link
                to="/rythisies/ai"
                className="pilegma pilegma-entono"
                data-testid="rythisies-link-ai"
              >
                Ρύθμιση Παρόχου &amp; Κλειδιού Vault →
              </Link>
            </div>
            <p
              className="karta-ypokeimeno"
              data-testid="rythisies-gramma-montelo"
              aria-label="Όνομα μοντέλου AI"
            >
              {apothiki.rytheseis.onomaMontelou}
            </p>
            <Pilegma
              keimeno={exeiKleidiLlm ? 'Κλειδί: Ρυθμισμένο' : 'Κλειδί: Μη ρυθμισμένο'}
              entono={exeiKleidiLlm}
            />
          </div>
        }
      />

      <Karta
        titlos="Εμφάνιση"
        ypokeimeno="Επιλογή θέματος για άνετη μελέτη μέρα και νύχτα."
        stoixeia={
          <div className="odoni-xeiris">
            {THEMATA_EPILOGES.map((th) => (
              <button
                key={th.id}
                type="button"
                className={`pilegma${trexonThema === th.id ? ' pilegma-entono' : ''}`}
                onClick={() => allaxe_thema(th.id)}
                data-testid={`thema-${th.id}`}
              >
                {th.titlos}
              </button>
            ))}
          </div>
        }
      />

      <Karta
        titlos="Αποθήκευση"
        ypokeimeno="Τα αρχεία και οι πόροι των μαθημάτων μένουν στη συσκευή σου."
        stoixeia={
          <div data-testid="rythisies-apothikeysi">
            <Pilegma keimeno="Τοπικό κρυπτογραφημένο vault στη συσκευή" />
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
          <div>
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
            <Link
              to="/eidopoiseis"
              className="pilegma pilegma-entono"
              data-testid="rythisies-eidopoiseis-othoni"
            >
              Ρυθμίσεις ειδοποιήσεων
            </Link>
          </div>
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
