import { Karta, Pilegma, ProskelesioOmonimas } from '../../koinima/index.js';

/** Ιδιότητες της οθόνης ρυθμίσεων· κάθε τιμή έρχεται από τις ρυθμίσεις, όχι από σταθερό κείμενο. */
export interface RythisiesProps {
  /** Διεύθυνση του eClass στη ρύθμιση σύνδεσης. */
  readonly baseUrl: string;
  /** Τα μαθήματα που συγχρονίζονται με το eClass. */
  readonly mathimataSynch: readonly string[];
  /** Όνομα του μοντέλου AI όπως το δίνει η ρύθμιση. */
  readonly onomaMontelou: string;
  /** Αν έχει οριστεί κλειδί LLM — η τιμή του κλειδιού δεν φτάνει ποτέ στην οθόνη. */
  readonly exeiKleidiLlm: boolean;
  /** Θέση αποθήκευσης αρχείων στη συσκευή, όπως τη δίνει η ρύθμιση. */
  readonly onomasApothikefsis: string;
  /** Αν οι τοπικές ειδοποιήσεις είναι ενεργές. */
  readonly einaiEidopoieseis: boolean;
}

/** Οθόνη ρυθμίσεων: σύνδεση, μοντέλο AI, αποθήκευση και ειδοποιήσεις, όλα τοπικά. */
export default function Rythisies({
  baseUrl,
  mathimataSynch,
  onomaMontelou,
  exeiKleidiLlm,
  onomasApothikefsis,
  einaiEidopoieseis,
}: RythisiesProps) {
  return (
    <div className="odoni-lista" data-testid="rythisies-ekran">
      <ProskelesioOmonimas
        titlos="Ρυθμίσεις"
        ypokeimeno="Ό,τι αποθηκεύεται εδώ παραμένει στη συσκευή σου."
      />

      <Karta
        titlos="Σύνδεση"
        ypokeimeno="Διεύθυνση του eClass και μαθήματα που συγχρονίζονται."
        stoixeia={
          <div>
            <Pilegma keimeno={baseUrl} />
            {mathimataSynch.length === 0 ? (
              <Pilegma keimeno="Συγχρονισμός: κανένα μάθημα" />
            ) : (
              mathimataSynch.map((titlos) => <Pilegma key={titlos} keimeno={titlos} />)
            )}
          </div>
        }
      />

      <Karta
        titlos="Μοντέλο AI"
        ypokeimeno="Το μοντέλο που χρησιμοποιείται για απαντήσεις και περιλήψεις."
        stoixeia={
          <div>
            <div data-testid="rythisies-seira-montelo">
              <Pilegma keimeno={onomaMontelou} entono />
            </div>
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
            <Pilegma keimeno={onomasApothikefsis} />
          </div>
        }
      />

      <Karta
        titlos="Ειδοποιήσεις"
        ypokeimeno="Οι ειδοποιήσεις είναι τοπικές· δεν αποστέλλονται δεδομένα σε διακομιστή."
        stoixeia={
          <Pilegma
            keimeno={einaiEidopoieseis ? 'Ενεργές' : 'Ανενεργές'}
            entono={einaiEidopoieseis}
          />
        }
      />
    </div>
  );
}