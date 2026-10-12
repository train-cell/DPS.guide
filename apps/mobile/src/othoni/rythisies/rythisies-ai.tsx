import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { xrisiApothekisis } from '../../apothiki/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import { Karta, Pilegma, ProskelesioOmonimas } from '../../koinima/index.js';

/** Αναγνωριστικά υποστηριζόμενων παρόχων AI. */
export type IdParoxou = 'gemini' | 'openai' | 'claude' | 'ollama';

/** Επιλογή διαθέσιμου μοντέλου ανά πάροχο. */
export interface EpilogiMontelou {
  readonly id: string;
  readonly titlos: string;
}

/** Πληροφορίες και προεπιλογές ενός παρόχου. */
export interface PliroforiaParoxou {
  readonly id: IdParoxou;
  readonly titlos: string;
  readonly perigrafi: string;
  readonly apaitisiKleidiou: boolean;
  readonly montela: readonly EpilogiMontelou[];
  readonly proepilegmenoMontelo: string;
  readonly proepilegmenoUrl?: string;
}

/** Κατάλογος των τεσσάρων υποστηριζόμενων παρόχων AI. */
export const PAROXOI_LLM: readonly PliroforiaParoxou[] = [
  {
    id: 'gemini',
    titlos: 'Google Gemini',
    perigrafi: 'Μοντέλα Google Gemini για γρήγορη και αξιόπιστη εκπαιδευτική ανάλυση.',
    apaitisiKleidiou: true,
    montela: [
      { id: 'gemini-2.5-flash', titlos: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', titlos: 'Gemini 2.5 Pro' },
    ],
    proepilegmenoMontelo: 'gemini-2.5-flash',
  },
  {
    id: 'openai',
    titlos: 'OpenAI ChatGPT',
    perigrafi: 'Μοντέλα OpenAI GPT-4o και O-series για σύνθετη επίλυση προβλημάτων.',
    apaitisiKleidiou: true,
    montela: [
      { id: 'gpt-4o', titlos: 'GPT-4o' },
      { id: 'gpt-4o-mini', titlos: 'GPT-4o Mini' },
      { id: 'o3-mini', titlos: 'o3-mini' },
    ],
    proepilegmenoMontelo: 'gpt-4o',
  },
  {
    id: 'claude',
    titlos: 'Anthropic Claude',
    perigrafi: 'Μοντέλα Claude για υψηλή κατανόηση ακαδημαϊκού κειμένου.',
    apaitisiKleidiou: true,
    montela: [
      { id: 'claude-3-7-sonnet', titlos: 'Claude 3.7 Sonnet' },
      { id: 'claude-3-5-haiku', titlos: 'Claude 3.5 Haiku' },
    ],
    proepilegmenoMontelo: 'claude-3-7-sonnet',
  },
  {
    id: 'ollama',
    titlos: 'Local Ollama / Self-Hosted',
    perigrafi: 'Τοπική εκτέλεση χωρίς αποστολή δεδομένων σε τρίτους διακομιστές.',
    apaitisiKleidiou: false,
    montela: [
      { id: 'llama3.2', titlos: 'Llama 3.2' },
      { id: 'mistral', titlos: 'Mistral' },
      { id: 'deepseek-r1', titlos: 'DeepSeek R1' },
    ],
    proepilegmenoMontelo: 'llama3.2',
    proepilegmenoUrl: 'http://localhost:11434',
  },
];

/** Εντοπίζει τον πάροχο στον οποίο αντιστοιχεί ένα όνομα μοντέλου. */
export function entopise_paroxo_montelou(onomaMontelou: string): IdParoxou {
  const mikro = onomaMontelou.toLowerCase().trim();
  if (mikro.startsWith('gemini')) {
    return 'gemini';
  }
  if (mikro.startsWith('gpt') || mikro.startsWith('o3')) {
    return 'openai';
  }
  if (mikro.startsWith('claude')) {
    return 'claude';
  }
  if (mikro.includes('llama') || mikro.includes('mistral') || mikro.includes('deepseek')) {
    return 'ollama';
  }
  for (const paroxos of PAROXOI_LLM) {
    if (paroxos.montela.some((m) => m.id === mikro)) {
      return paroxos.id;
    }
  }
  return 'gemini';
}

/** Προεπιλεγμένος πάροχος σε περίπτωση μη έγκυρου id. */
export const PROEPILOGI_PAROXOU: PliroforiaParoxou = {
  id: 'gemini',
  titlos: 'Google Gemini',
  perigrafi: 'Μοντέλα Google Gemini για γρήγορη και αξιόπιστη εκπαιδευτική ανάλυση.',
  apaitisiKleidiou: true,
  montela: [
    { id: 'gemini-2.5-flash', titlos: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', titlos: 'Gemini 2.5 Pro' },
  ],
  proepilegmenoMontelo: 'gemini-2.5-flash',
};

/** Οθόνη ρύθμισης AI Μοντέλου και Zero-Knowledge Hardware Vault. */
export default function RythisiesAi() {
  const apothiki = xrisiApothekisis();
  const periballon = xrisiPeriballontos();
  const navigate = useNavigate();

  const trexonMontelo = apothiki.rytheseis.onomaMontelou || 'gemini-2.5-flash';
  const [paroxosId, setParoxosId] = useState<IdParoxou>(() =>
    entopise_paroxo_montelou(trexonMontelo)
  );
  const [epilegmenoMontelo, setEpilegmenoMontelo] = useState<string>(trexonMontelo);
  const [kleidiApi, setKleidiApi] = useState<string>('');
  const [exeiVaultKleidi, setExeiVaultKleidi] = useState<boolean>(apothiki.rytheseis.exeiKleidiLlm);
  const [deikseKleidi, setDeikseKleidi] = useState<boolean>(false);
  const [urlOllama, setUrlOllama] = useState<string>('http://localhost:11434');
  const [dokimiApotelesma, setDokimiApotelesma] = useState<{
    epitixia: boolean;
    minima: string;
  } | null>(null);
  const [dokimiSeEkseliksi, setDokimiSeEkseliksi] = useState<boolean>(false);
  const [apothikefthike, setApothikefthike] = useState<boolean>(false);

  useEffect(() => {
    let zalive = true;
    void (async () => {
      const kleidi = await periballon.mystika.pare('llm_api_key');
      if (!zalive) {
        return;
      }
      if (kleidi !== null && kleidi.length > 0) {
        setKleidiApi(kleidi);
        setExeiVaultKleidi(true);
      }
    })();
    return () => {
      zalive = false;
    };
  }, [periballon.mystika]);

  const paroxosTrexon = PAROXOI_LLM.find((p) => p.id === paroxosId) ?? PROEPILOGI_PAROXOU;

  function allaxe_paroxo(neosParoxosId: IdParoxou): void {
    setParoxosId(neosParoxosId);
    const vrethike = PAROXOI_LLM.find((p) => p.id === neosParoxosId);
    if (vrethike !== undefined) {
      const anikei = vrethike.montela.some((m) => m.id === epilegmenoMontelo);
      if (!anikei) {
        setEpilegmenoMontelo(vrethike.proepilegmenoMontelo);
      }
    }
    setDokimiApotelesma(null);
    setApothikefthike(false);
  }

  async function elegxos_syndesis(): Promise<void> {
    if (paroxosTrexon.apaitisiKleidiou && kleidiApi.trim().length === 0) {
      setDokimiApotelesma({
        epitixia: false,
        minima: 'Απαιτείται API Key για τον επιλεγμένο πάροχο.',
      });
      return;
    }

    if (paroxosId === 'ollama' && urlOllama.trim().length === 0) {
      setDokimiApotelesma({
        epitixia: false,
        minima: 'Απαιτείται διεύθυνση διακομιστή για το Ollama.',
      });
      return;
    }

    setDokimiSeEkseliksi(true);
    setDokimiApotelesma(null);

    try {
      const apotelesma = await periballon.llm.parage_keimeno({
        systima: 'Έλεγχος σύνδεσης συστήματος',
        minimata: [{ rolos: 'xristis', keimeno: 'ping' }],
        ekdosi_prompt: '1',
        thermokrasia: 0,
      });

      if (apotelesma.ok) {
        setDokimiApotelesma({
          epitixia: true,
          minima: `Επιτυχής σύνδεση με ${paroxosTrexon.titlos} (${epilegmenoMontelo})!`,
        });
      } else {
        setDokimiApotelesma({
          epitixia: false,
          minima: `Αποτυχία σύνδεσης: ${apotelesma.sfalma.minima}`,
        });
      }
    } catch {
      setDokimiApotelesma({
        epitixia: false,
        minima: 'Σφάλμα επικοινωνίας κατά τον έλεγχο σύνδεσης.',
      });
    } finally {
      setDokimiSeEkseliksi(false);
    }
  }

  async function apothikefse_kai_epestrepse(erevma?: FormEvent<HTMLFormElement>): Promise<void> {
    if (erevma !== undefined) {
      erevma.preventDefault();
    }

    const exeiNeoKleidi = kleidiApi.trim().length > 0;
    if (exeiNeoKleidi) {
      await periballon.mystika.vale('llm_api_key', kleidiApi.trim());
      setExeiVaultKleidi(true);
    } else if (paroxosTrexon.apaitisiKleidiou) {
      await periballon.mystika.svise('llm_api_key');
      setExeiVaultKleidi(false);
    }

    const exeiKleidi = exeiNeoKleidi || (paroxosId === 'ollama' ? true : false);
    await apothiki.allaxe_rytheseis({
      ...apothiki.rytheseis,
      onomaMontelou: epilegmenoMontelo,
      exeiKleidiLlm: exeiKleidi,
    });

    setApothikefthike(true);
    navigate('/rythisies');
  }

  async function diagrafi_kleidiou_vault(): Promise<void> {
    await periballon.mystika.svise('llm_api_key');
    setKleidiApi('');
    setExeiVaultKleidi(false);
    await apothiki.allaxe_rytheseis({
      ...apothiki.rytheseis,
      exeiKleidiLlm: false,
    });
    setDokimiApotelesma(null);
    setApothikefthike(true);
  }

  return (
    <form
      className="odoni-lista"
      data-testid="rythisies-ai-ekran"
      onSubmit={(erevma) => void apothikefse_kai_epestrepse(erevma)}
    >
      <ProskelesioOmonimas
        titlos="Μοντέλο AI & Vault"
        ypokeimeno="Επιλογή παρόχου, μοντέλου και ασφαλής αποθήκευση κλειδιού στο Hardware Vault."
        akseis={
          <Link
            to="/rythisies"
            className="pilegma pilegma-entono"
            data-testid="ai-epistrofi-link"
          >
            ← Επιστροφή στις Ρυθμίσεις
          </Link>
        }
      />

      <Karta
        titlos="Πάροχος AI"
        ypokeimeno="Επίλεξε την υπηρεσία νοημοσύνης που θα απαντά στις ερωτήσεις σου."
        stoixeia={
          <div>
            <div className="odoni-xeiris">
              {PAROXOI_LLM.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`pilegma${paroxosId === p.id ? ' pilegma-entono' : ''}`}
                  onClick={() => allaxe_paroxo(p.id)}
                  data-testid={`paroxos-${p.id}`}
                  aria-pressed={paroxosId === p.id}
                >
                  {p.titlos}
                </button>
              ))}
            </div>
            <label className="odoni-xeiris-zeugos" htmlFor="ai-paroxos-select">
              Αναπτυσσόμενη επιλογή παρόχου
            </label>
            <select
              id="ai-paroxos-select"
              data-testid="ai-paroxos-select"
              className="proedri-travla-gramma"
              value={paroxosId}
              onChange={(erevma) => allaxe_paroxo(erevma.target.value as IdParoxou)}
              aria-label="Επιλογή Παρόχου AI"
            >
              {PAROXOI_LLM.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titlos}
                </option>
              ))}
            </select>
            <p className="karta-ypokeimeno">{paroxosTrexon.perigrafi}</p>
          </div>
        }
      />

      <Karta
        titlos="Επιλογή Μοντέλου"
        ypokeimeno={`Διαθέσιμα μοντέλα για ${paroxosTrexon.titlos}.`}
        stoixeia={
          <div>
            <div className="odoni-xeiris">
              {paroxosTrexon.montela.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`pilegma${epilegmenoMontelo === m.id ? ' pilegma-entono' : ''}`}
                  onClick={() => {
                    setEpilegmenoMontelo(m.id);
                    setApothikefthike(false);
                  }}
                  data-testid={`montelo-${m.id}`}
                  aria-pressed={epilegmenoMontelo === m.id}
                >
                  {m.titlos}
                </button>
              ))}
            </div>
            <label className="odoni-xeiris-zeugos" htmlFor="ai-montelo-select">
              Επιλογή μοντέλου
            </label>
            <select
              id="ai-montelo-select"
              data-testid="ai-montelo-select"
              className="proedri-travla-gramma"
              value={epilegmenoMontelo}
              onChange={(erevma) => {
                setEpilegmenoMontelo(erevma.target.value);
                setApothikefthike(false);
              }}
              aria-label="Επιλογή Μοντέλου AI"
            >
              {paroxosTrexon.montela.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.titlos} ({m.id})
                </option>
              ))}
            </select>
            {paroxosId === 'ollama' && (
              <div>
                <label className="odoni-xeiris-zeugos" htmlFor="ai-ollama-url">
                  Διεύθυνση Ollama Base URL
                </label>
                <input
                  id="ai-ollama-url"
                  data-testid="ai-ollama-url"
                  className="proedri-travla-gramma"
                  type="url"
                  value={urlOllama}
                  onChange={(erevma) => setUrlOllama(erevma.target.value)}
                  placeholder="http://localhost:11434"
                  aria-label="Διεύθυνση Ollama Base URL"
                />
              </div>
            )}
          </div>
        }
      />

      <Karta
        titlos="Zero-Knowledge Hardware Vault"
        ypokeimeno="Το API Key αποθηκεύεται αποκλειστικά στο Hardware Vault της συσκευής και δεν διαρρέει ποτέ."
        stoixeia={
          <div>
            <div className="odoni-xeiris">
              <Pilegma
                keimeno={
                  exeiVaultKleidi
                    ? 'Hardware Vault: Κλειδωμένο & Ενεργό'
                    : 'Hardware Vault: Κενό'
                }
                entono={exeiVaultKleidi}
              />
            </div>
            <label className="odoni-xeiris-zeugos" htmlFor="ai-api-key">
              API Key Παρόχου {paroxosTrexon.apaitisiKleidiou ? '(Απαιτείται)' : '(Προαιρετικό)'}
            </label>
            <input
              id="ai-api-key"
              data-testid="ai-api-key"
              name="kleidiApi"
              className="proedri-travla-gramma"
              type={deikseKleidi ? 'text' : 'password'}
              value={kleidiApi}
              onChange={(erevma) => {
                setKleidiApi(erevma.target.value);
                setApothikefthike(false);
              }}
              placeholder={exeiVaultKleidi ? '••••••••••••••••' : 'Εισάγετε API Key...'}
              autoComplete="off"
              aria-label="API Key Παρόχου"
            />
            <div className="odoni-xeiris">
              <button
                type="button"
                className="pilegma"
                onClick={() => setDeikseKleidi((palio) => !palio)}
                data-testid="ai-toggle-oratoklidi"
                aria-label={deikseKleidi ? 'Απόκρυψη κλειδιού' : 'Εμφάνιση κλειδιού'}
              >
                {deikseKleidi ? 'Απόκρυψη' : 'Εμφάνιση'}
              </button>
              {exeiVaultKleidi && (
                <button
                  type="button"
                  className="pilegma"
                  onClick={() => void diagrafi_kleidiou_vault()}
                  data-testid="ai-diagrafi-kleidiou"
                  aria-label="Διαγραφή κλειδιού από το Vault"
                >
                  Διαγραφή από το Vault
                </button>
              )}
            </div>
          </div>
        }
      />

      <Karta
        titlos="Δοκιμή & Επαλήθευση"
        ypokeimeno="Επαλήθευσε ότι το κλειδί και το μοντέλο μπορούν να απαντήσουν επιτυχώς."
        stoixeia={
          <div className="odoni-xeiris">
            <button
              type="button"
              className="pilegma pilegma-entono"
              onClick={() => void elegxos_syndesis()}
              data-testid="ai-dokimi-syndesis"
              aria-label="Έλεγχος Σύνδεσης"
              disabled={dokimiSeEkseliksi}
            >
              {dokimiSeEkseliksi ? 'Έλεγχος…' : 'Έλεγχος Σύνδεσης'}
            </button>
            {dokimiApotelesma !== null && (
              <div data-testid="ai-dokimi-apotelesma">
                <Pilegma
                  keimeno={dokimiApotelesma.minima}
                  entono={dokimiApotelesma.epitixia}
                />
              </div>
            )}
          </div>
        }
      />

      <div className="odoni-xeiris">
        <button
          type="submit"
          className="pilegma pilegma-entono"
          data-testid="ai-apothikeysi"
          aria-label="Αποθήκευση και Επιστροφή"
        >
          Αποθήκευση &amp; Επιστροφή
        </button>
        {apothikefthike && <Pilegma keimeno="Αποθηκεύτηκε" entono />}
      </div>
    </form>
  );
}
