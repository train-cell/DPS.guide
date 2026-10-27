import { useState, useCallback, useId } from 'react';
import {
  parage_akronymio_kai_leikseis,
  kataskevase_prompt_mnemonikou,
  type EidosMnemonikou,
  type MnemonikoAitima,
} from '@dps/core';

export interface MnemonikaProps {
  readonly arxikoiOroi?: readonly string[];
  readonly arxikoEidos?: EidosMnemonikou;
  readonly thema?: string;
  readonly onDimiourgia?: (apotelesma: { akronymio: string; prompt: string }) => void;
}

/**
 * Component παραγωγής μνημονικών κανόνων & ακρωνυμίων (Automated Mnemonics Engine UI).
 *
 * Συμμορφώνεται 100% με τους κανόνες του DPS.guide:
 * - Κανόνας D11: Μηδενικά hex χρώματα, χρήση μόνο CSS variables (var(--xroma-...)).
 * - Μηδενικά inline CSS styles.
 * - Πλήρης προσβασιμότητα (a11y) με σωστά labels, roles και aria attributes.
 */
export function Mnemonika({
  arxikoiOroi = [],
  arxikoEidos = 'akronymio',
  thema: arxikoThema = '',
  onDimiourgia,
}: MnemonikaProps) {
  const oroiId = useId();
  const eidosId = useId();
  const themaId = useId();

  const [keimenoOron, setKeimenoOron] = useState<string>(
    arxikoiOroi.join('\n')
  );
  const [eidos, setEidos] = useState<EidosMnemonikou>(arxikoEidos);
  const [thema, setThema] = useState<string>(arxikoThema);

  // Αρχικός υπολογισμός εφόσον δόθηκαν αρχικοί όροι
  const arxikoResult = parage_akronymio_kai_leikseis(arxikoiOroi);
  const [akronymio, setAkronymio] = useState<string>(arxikoResult.akronymio);
  const [katanomi, setKatanomi] = useState<Record<string, string[]>>(
    arxikoResult.katanomi
  );
  const [paragomenoPrompt, setParagomenoPrompt] = useState<string>(() => {
    if (arxikoiOroi.length === 0) return '';
    return kataskevase_prompt_mnemonikou({
      oroi: arxikoiOroi,
      eidos: arxikoEidos,
      thema: arxikoThema,
    });
  });

  const xeirismosYpovolis = useCallback(
    (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      const oroi = keimenoOron
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const result = parage_akronymio_kai_leikseis(oroi);
      const trimmedThema = thema.trim();
      const aitima: MnemonikoAitima = {
        oroi,
        eidos,
        ...(trimmedThema ? { thema: trimmedThema } : {}),
      };
      const prompt = kataskevase_prompt_mnemonikou(aitima);

      setAkronymio(result.akronymio);
      setKatanomi(result.katanomi);
      setParagomenoPrompt(prompt);

      onDimiourgia?.({
        akronymio: result.akronymio,
        prompt,
      });
    },
    [keimenoOron, eidos, thema, onDimiourgia]
  );

  return (
    <div className="mnemonika-periektis">
      <header className="mnemonika-kefali">
        <h2 className="mnemonika-titlos">Μνημονικός Βοηθός (50/50 AI Co-pilot)</h2>
        <p className="mnemonika-ypotitlos">
          Αυτόματη παραγωγή ακρωνυμίων και αυστηρών prompts για απομνημόνευση χωρίς μαθηματικά hallucinations.
        </p>
      </header>

      <form
        className="mnemonika-forma"
        data-testid="mnemonika-form"
        onSubmit={xeirismosYpovolis}
      >
        <div className="mnemonika-pedio">
          <label htmlFor={oroiId} className="mnemonika-etiketa">
            Όροι προς απομνημόνευση (ένας ανά γραμμή ή διαχωρισμένοι με κόμμα)
          </label>
          <textarea
            id={oroiId}
            className="mnemonika-keimeno"
            data-testid="mnemonika-input-oroi"
            rows={4}
            value={keimenoOron}
            onChange={(e) => setKeimenoOron(e.target.value)}
            placeholder="π.χ.&#10;Δυαδική Αναζήτηση&#10;Πολυπλοκότητα&#10;Στοίβα"
          />
        </div>

        <div className="mnemonika-pedio-diadromi">
          <div className="mnemonika-pedio">
            <label htmlFor={eidosId} className="mnemonika-etiketa">
              Είδος Μνημονικού
            </label>
            <select
              id={eidosId}
              className="mnemonika-epilogi"
              data-testid="mnemonika-select-eidos"
              value={eidos}
              onChange={(e) => setEidos(e.target.value as EidosMnemonikou)}
            >
              <option value="akronymio">Ακρωνύμιο & Φράση-Κλειδί</option>
              <option value="peg_system">Peg System (Σύστημα Αγκίστρων)</option>
              <option value="istoria">Μνημονική Ιστορία (Narrative)</option>
            </select>
          </div>

          <div className="mnemonika-pedio">
            <label htmlFor={themaId} className="mnemonika-etiketa">
              Θεματικό Πλαίσιο (Προαιρετικό)
            </label>
            <input
              id={themaId}
              type="text"
              className="mnemonika-eisodos"
              data-testid="mnemonika-input-thema"
              value={thema}
              onChange={(e) => setThema(e.target.value)}
              placeholder="π.χ. Δομές Δεδομένων"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mnemonika-koumpi-ypovolis"
          data-testid="mnemonika-submit"
        >
          Δημιουργία Μνημονικού
        </button>
      </form>

      {akronymio.length > 0 && (
        <section
          className="mnemonika-apotelesmata"
          data-testid="mnemonika-apotelesmata"
          aria-label="Παραγόμενα Μνημονικά Στοιχεία"
        >
          <div className="mnemonika-akronymio-karta">
            <span className="mnemonika-akronymio-etiketa">Παραγόμενο Ακρωνύμιο:</span>
            <div
              className="mnemonika-akronymio-keimeno"
              data-testid="mnemoniko-akronymio"
              role="status"
              aria-live="polite"
            >
              {akronymio}
            </div>
            <div
              className="mnemonika-eidos-badge"
              data-testid="mnemoniko-eidos-badge"
            >
              {eidos}
            </div>
          </div>

          <div
            className="mnemonika-katanomi-kouti"
            data-testid="mnemoniko-katanomi"
          >
            <h3 className="mnemonika-katanomi-titlos">Κατανομή Όρων ανά Γράμμα:</h3>
            <ul className="mnemonika-katanomi-lista">
              {Object.entries(katanomi).map(([gramma, lista]) => (
                <li key={gramma} className="mnemonika-katanomi-grammi">
                  <span className="mnemonika-katanomi-gramma">{gramma}:</span>
                  <span className="mnemonika-katanomi-oroi">
                    {lista.join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {paragomenoPrompt.length > 0 && (
            <div className="mnemonika-prompt-kouti">
              <h3 className="mnemonika-prompt-titlos">
                Δομημένο Prompt Σύνθεσης (50/50 Co-Pilot):
              </h3>
              <pre
                className="mnemonika-prompt-proepiskopisi"
                data-testid="mnemoniko-prompt"
                tabIndex={0}
                aria-label="Προεπισκόπηση Prompt"
              >
                {paragomenoPrompt}
              </pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
