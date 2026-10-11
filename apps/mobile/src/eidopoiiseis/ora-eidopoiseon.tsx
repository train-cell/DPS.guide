/**
 * Παρουσιαστικό κομμάτι της οθόνης ειδοποιήσεων (κάρτα P3).
 *
 * Καθαρή παρουσίαση: δεν κάνει I/O και δεν έχει κατάσταση. Όλα έρχονται ως props,
 * ώστε οι καταστάσεις Loading/Empty/Error να είναι εξαντλητικά ελέγχιμες χωρίς
 * συσκευή και χωρίς δίκτυο (ίδια αρχή με το `OdomosEnotiton` στην οθόνη χάρτη).
 *
 * D7: ΜΟΝΟ τοπικές ειδοποιήσεις· κανένα κωδικός μαθήματος ή μυστικό στην οθόνη.
 * D11: dark-only design system μέσω υπαρχουσών τάξεων — κανένα inline style.
 */

import { Karta, OloniKatastasis, Pilegma, ProskelesioOmonimas } from '../koinima/index.js';
import type { Katastasi } from '../kathstasi/index.js';
import {
  einai_chorigimeni,
  etiketa_lepton,
  keimeno_adias,
  keimeno_diakopti,
  MINIMA_ADEIO,
  MINIMA_SFALMA,
} from './eidopoiiseis-ypiresies.js';
import { LEPTES_PROEIDOPOISIS } from './eidopoiiseis-typoi.js';
import type {
  EidopoiisiProgrammatismeni,
  KatastasiAdieas,
  RytheseisEidopoiseon,
} from './eidopoiiseis-typoi.js';

/** Ιδιότητες του παρουσιαστικού κομματιού. */
export interface OraEidopoiseonProps {
  /** Η κατάσταση της λίστας: φόρτωση, κενό, σφάλμα ή έτοιμα δεδομένα. */
  readonly katastasi: Katastasi<EidopoiisiProgrammatismeni[]>;
  /** Κατάσταση άδειας ή null όσο δεν έχει διαβαστεί. */
  readonly adia: KatastasiAdieas | null;
  /** Οι ρυθμίσεις που εμφανίζει η οθόνη. */
  readonly rytheseis: RytheseisEidopoiseon;
  /** Αλλαγή λεπτών προειδοποίησης από τον χρήστη. */
  readonly allaze_lepta: (lepta: number) => void;
  /** Κλικ στον διακόπτη ενεργοποίησης (ζητά άδεια). */
  readonly zitise_adeia: () => void;
  /** Κλικ στη δοκιμαστική ειδοποίηση. */
  readonly dokimi: () => void;
  /** Κλικ στη μαζική ακύρωση. */
  readonly akiro_oles: () => void;
  /** Επανάληψη φόρτωσης μετά από σφάλμα. */
  readonly epanalipsi: () => void;
  /** Τελευταίο μήνυμα ενεργείας ή null. */
  readonly apotel: string | null;
  /** Ελεύθερο κείμενο ενότητας για τα μηνύματα — ποτέ κωδικός μαθήματος. */
  readonly onoma: string;
}

/** Εμφανίζει φόρτωση, κενό, σφάλμα ή δεδομένα — ποτέ λευκή οθόνη (οδηγός D). */
export function OraEidopoiseon({
  katastasi,
  adia,
  rytheseis,
  allaze_lepta,
  zitise_adeia,
  dokimi,
  akiro_oles,
  epanalipsi,
  apotel,
  onoma,
}: OraEidopoiseonProps) {
  const adiaEinaiGranted = einai_chorigimeni(adia ?? 'prompt');

  return (
    <div className="odoni-lista" data-testid="eidopoiseis-ekran">
      <ProskelesioOmonimas
        titlos="Ειδοποιήσεις"
        ypokeimeno="Τοπικές υπενθυμίσεις στη συσκευή σου. Δεν αποστέλλεται τίποτα σε διακομιστή."
      />

      <Karta
        titlos="Ενεργοποίηση"
        ypokeimeno={
          onoma === '' ? 'Ενεργοποίηση των τοπικών ειδοποιήσεων.' : `Ενεργοποίηση για «${onoma}».`
        }
        stoixeia={
          <div>
            <button
              type="button"
              role="switch"
              aria-checked={rytheseis.einaiEnergies}
              aria-label="Ενεργοποίηση τοπικών ειδοποιήσεων"
              className={`pilegma${rytheseis.einaiEnergies ? ' pilegma-entono' : ''}`}
              data-testid="eidopoiseis-enaktopoieseis"
              onClick={zitise_adeia}
            >
              {keimeno_diakopti(rytheseis.einaiEnergies)}
            </button>
            <div data-testid="eidopoiseis-stathmos">
              <Pilegma
                keimeno={adia === null ? 'Άδεια: άγνωστη' : keimeno_adias(adia)}
                entono={adiaEinaiGranted}
              />
            </div>
          </div>
        }
      />

      <Karta
        titlos="Υπενθύμιση ενότητας"
        ypokeimeno="Πόσο πριν από την έναρξη της ενότητας να σε ενημερώσουμε."
        stoixeia={
          <div>
            <label className="odoni-xeiris-zeugos" htmlFor="eidopoiseis-lekseis">
              Λεπτά προειδοποίησης
            </label>
            <select
              id="eidopoiseis-lekseis"
              data-testid="eidopoiseis-lekseis"
              aria-label="Λεπτά πριν από την ενότητα"
              className="pilegma"
              value={rytheseis.leptaProeidopoisis}
              onChange={(erevma) => allaze_lepta(Number(erevma.target.value))}
            >
              {LEPTES_PROEIDOPOISIS.map((lepta) => (
                <option key={lepta} value={lepta}>
                  {etiketa_lepton(lepta)}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <Karta
        titlos="Δοκιμή"
        ypokeimeno="Στείλε μία υπενθύμιση τώρα για να ελέγξεις ότι λειτουργεί."
        stoixeia={
          <div className="odoni-xeiris">
            <button
              type="button"
              className="pilegma pilegma-entono"
              data-testid="eidopoiseis-dokimi"
              aria-label="Δοκιμή ειδοποίησης τώρα"
              disabled={!adiaEinaiGranted}
              onClick={dokimi}
            >
              Δοκιμή ειδοποίησης
            </button>
            <button
              type="button"
              className="pilegma"
              data-testid="eidopoiseis-akiro-oles"
              aria-label="Ακύρωση όλων των υπενθυμίσεων"
              onClick={akiro_oles}
            >
              Ακύρωση όλων
            </button>
          </div>
        }
      />

      <Karta
        titlos="Προγραμματισμένες"
        ypokeimeno="Τι περιμένει να εμφανιστεί στη συσκευή σου."
        stoixeia={
          <div data-testid="eidopoiseis-metrikos">
            <Pilegma
              keimeno={`Σε αναμονή: ${katastasi.katastasi === 'etimo' ? katastasi.dedomena.length : 0}`}
            />
          </div>
        }
      />

      <OloniKatastasis
        katastasi={katastasi}
        adeioMinima={MINIMA_ADEIO}
        epanalipsiMinima="Δοκίμασε ξανά"
        epanalipsi={epanalipsi}
      >
        {(proedres) => (
          <div data-testid="eidopoiseis-lista">
            {proedres.map((proedri) => (
              <div
                key={proedri.id}
                className="pilegma"
                aria-label={`Υπενθύμιση ${proedri.kleidiEnotitas}`}
              >
                {proedri.titlos}
              </div>
            ))}
          </div>
        )}
      </OloniKatastasis>

      {apotel !== null && <Pilegma keimeno={apotel} entono />}
    </div>
  );
}

export { MINIMA_SFALMA };