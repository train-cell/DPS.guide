import { useId } from 'react';

export interface StreakFreezeModalProps {
  readonly anoikto: boolean;
  readonly trexwnStreak: number;
  readonly diathesimaTokens: number;
  readonly kindynosDiakopis: boolean;
  readonly onXrisiToken?: () => void;
  readonly onEnarxiBlitz?: () => void;
  readonly onKleisimo: () => void;
}

/**
 * Modal ειδοποίησης διακινδύνευσης streak και διάσωσης μέσω Freeze Tokens ή 2-Minute Blitz Quiz.
 *
 * Συμμορφώνεται 100% με τους κανόνες του DPS.guide:
 * - Κανόνας D11: Μηδενικά hex χρώματα (#...), χρήση μόνο CSS variables (var(--xroma-...)).
 * - Μηδενικά inline CSS styles.
 * - Πλήρης προσβασιμότητα (a11y) με role="dialog", aria-modal="true" και aria-labelledby.
 */
export function StreakFreezeModal({
  anoikto,
  trexwnStreak,
  diathesimaTokens,
  kindynosDiakopis,
  onXrisiToken,
  onEnarxiBlitz,
  onKleisimo,
}: StreakFreezeModalProps) {
  const titlosId = useId();
  const perigrafiId = useId();

  if (!anoikto) {
    return null;
  }

  return (
    <div
      className="streak-freeze-epikalipsi"
      role="presentation"
      onClick={onKleisimo}
    >
      <div
        className="streak-freeze-kouti"
        data-testid="streak-freeze-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titlosId}
        aria-describedby={perigrafiId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="streak-freeze-kefali">
          <div className="streak-freeze-emvlima">❄️</div>
          <h2 id={titlosId} className="streak-freeze-titlos">
            {kindynosDiakopis ? 'Κίνδυνος Διακοπής Streak!' : 'Κατάσταση Streak & Freeze Vault'}
          </h2>
          <p id={perigrafiId} className="streak-freeze-perigrafi">
            {kindynosDiakopis
              ? 'Δεν έχεις καταγράψει μελέτη σήμερα. Χρησιμοποίησε ένα Streak Freeze Token ή ολοκλήρωσε ένα Rapid Blitz Quiz 2 λεπτών για να σώσεις την πρόοδό σου!'
              : 'Το σερί μελέτης σου είναι ασφαλές! Μπορείς να διαχειριστείς τα διαθέσιμα freeze tokens σου.'}
          </p>
        </header>

        <section className="streak-freeze-metriseis">
          <div className="streak-freeze-karta-metrisis">
            <span className="streak-freeze-metrisi-etiketa">Τρέχον Streak:</span>
            <span
              className="streak-freeze-metrisi-timi"
              data-testid="streak-freeze-current-streak"
            >
              {trexwnStreak} {trexwnStreak === 1 ? 'ημέρα' : 'ημέρες'} 🔥
            </span>
          </div>

          <div className="streak-freeze-karta-metrisis">
            <span className="streak-freeze-metrisi-etiketa">Διαθέσιμα Tokens:</span>
            <span
              className="streak-freeze-metrisi-timi"
              data-testid="streak-freeze-tokens-count"
            >
              {diathesimaTokens} 🧊
            </span>
          </div>
        </section>

        <div className="streak-freeze-energeies">
          <button
            type="button"
            className="streak-freeze-koumpi streak-freeze-koumpi-blitz"
            data-testid="streak-freeze-start-blitz"
            onClick={onEnarxiBlitz}
          >
            ⚡ Έναρξη 2-Minute Rapid Blitz Quiz (Δωρεάν Διάσωση)
          </button>

          <button
            type="button"
            className="streak-freeze-koumpi streak-freeze-koumpi-token"
            data-testid="streak-freeze-use-token"
            disabled={diathesimaTokens <= 0}
            onClick={onXrisiToken}
          >
            🧊 Χρήση Freeze Token ({diathesimaTokens} διαθέσιμα)
          </button>

          <button
            type="button"
            className="streak-freeze-koumpi streak-freeze-koumpi-kleisimo"
            data-testid="streak-freeze-close"
            onClick={onKleisimo}
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
}
