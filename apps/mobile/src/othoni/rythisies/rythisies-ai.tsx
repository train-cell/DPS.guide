import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ftiaxe_gemini_llm, ftiaxe_ollama_llm } from '@dps/ai';
import type { LlmPyli, MystikaPyli } from '@dps/core';
import { xrisiApothekisis } from '../../apothiki/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import { Karta, Pilegma, ProskelesioOmonimas } from '../../koinima/index.js';
import { useVaultSecurity } from '../../vault/vault-gate.js';
import { BridgePairingCard } from '../../vault/bridge-pairing.js';
import { deliverEncryptedBackup } from '../../vault/backup-file.js';
import { GEMINI_MODEL_OPTIONS, PROEPILOGI_GEMINI_MONTELO } from '../../ypiresies/ai-models.js';

/** Αναγνωριστικά υποστηριζόμενων παρόχων AI. */
export type IdParoxou = 'gemini' | 'ollama';

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

/** Κατάλογος των πραγματικά υλοποιημένων παρόχων AI. */
export const PAROXOI_LLM: readonly PliroforiaParoxou[] = [
  {
    id: 'gemini',
    titlos: 'Google Gemini',
    perigrafi: 'Μοντέλα Google Gemini για γρήγορη και αξιόπιστη εκπαιδευτική ανάλυση.',
    apaitisiKleidiou: true,
    montela: GEMINI_MODEL_OPTIONS,
    proepilegmenoMontelo: PROEPILOGI_GEMINI_MONTELO,
  },
  {
    id: 'ollama',
    titlos: 'Τοπικό Ollama',
    perigrafi: 'Εκτέλεση στον ίδιο υπολογιστή Windows/macOS. Δεν είναι διαθέσιμο από κινητό.',
    apaitisiKleidiou: false,
    montela: [
      { id: 'llama3.2', titlos: 'Llama 3.2' },
      { id: 'mistral', titlos: 'Mistral' },
      { id: 'deepseek-r1', titlos: 'DeepSeek R1' },
      { id: 'qwen2.5', titlos: 'Qwen 2.5' },
    ],
    proepilegmenoMontelo: 'llama3.2',
    proepilegmenoUrl: 'http://localhost:11434',
  },
];

/** Εντοπίζει τον πάροχο στον οποίο αντιστοιχεί ένα όνομα μοντέλου. */
export function entopise_paroxo_montelou(onomaMontelou: string): IdParoxou {
  const mikro = onomaMontelou.toLowerCase().trim();
  if (/^(llama|mistral|deepseek|qwen|gemma|phi|codellama)([.:\d-]|$)/.test(mikro)) return 'ollama';
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
  montela: GEMINI_MODEL_OPTIONS,
  proepilegmenoMontelo: PROEPILOGI_GEMINI_MONTELO,
};

/** Οθόνη ρύθμισης παρόχου AI, encrypted vault και τοπικού bridge. */
export default function RythisiesAi() {
  const apothiki = xrisiApothekisis();
  const periballon = xrisiPeriballontos();
  const vaultSecurity = useVaultSecurity();
  const navigate = useNavigate();

  const trexonMontelo = apothiki.rytheseis.onomaMontelou || PROEPILOGI_GEMINI_MONTELO;
  const [paroxosId, setParoxosId] = useState<IdParoxou>(() =>
    entopise_paroxo_montelou(trexonMontelo)
  );
  const [epilegmenoMontelo, setEpilegmenoMontelo] = useState<string>(trexonMontelo);
  const [kleidiApi, setKleidiApi] = useState<string>('');
  const [exeiVaultKleidi, setExeiVaultKleidi] = useState<boolean>(apothiki.rytheseis.exeiKleidiLlm);
  const [deikseKleidi, setDeikseKleidi] = useState<boolean>(false);
  const [urlOllama, setUrlOllama] = useState<string>(apothiki.rytheseis.urlOllama ?? 'http://localhost:11434');
  const [dokimiApotelesma, setDokimiApotelesma] = useState<{
    epitixia: boolean;
    minima: string;
  } | null>(null);
  const [pendingGeminiTest, setPendingGeminiTest] = useState<string | null>(null);
  const [dokimiSeEkseliksi, setDokimiSeEkseliksi] = useState<boolean>(false);
  const [apothikefthike, setApothikefthike] = useState<boolean>(false);
  const [vaultMinima, setVaultMinima] = useState<string | null>(null);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const ollamaDiathesimo = !Capacitor.isNativePlatform() &&
    typeof location !== 'undefined' && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

  useEffect(() => {
    let zalive = true;
    void (async () => {
      const kleidi = await periballon.mystika.pare('llm_api_key');
      if (!zalive) {
        return;
      }
      if (kleidi !== null && kleidi.length > 0) {
        setExeiVaultKleidi(true);
      }
      setUrlOllama(apothiki.rytheseis.urlOllama ?? 'http://localhost:11434');
    })();
    return () => {
      zalive = false;
    };
  }, [periballon.mystika, apothiki.rytheseis.urlOllama]);

  useEffect(() => {
    if (!ollamaDiathesimo && paroxosId === 'ollama') {
      setParoxosId('gemini');
      setEpilegmenoMontelo(PROEPILOGI_GEMINI_MONTELO);
    }
  }, [ollamaDiathesimo, paroxosId]);

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

    if (paroxosId === 'gemini') {
      setPendingGeminiTest(epilegmenoMontelo);
      return;
    }

    await ektelese_dokimi_syndesis(epilegmenoMontelo, paroxosId);
  }

  async function ektelese_dokimi_syndesis(model: string, providerId: IdParoxou): Promise<void> {
    if (providerId === 'gemini' && kleidiApi.trim().length === 0) {
      setDokimiApotelesma({ epitixia: false, minima: 'Απαιτείται API Key για τον επιλεγμένο πάροχο.' });
      return;
    }
    setDokimiSeEkseliksi(true);
    setDokimiApotelesma(null);

    try {
      let testLlm: LlmPyli;
      if (providerId === 'ollama') {
        testLlm = ftiaxe_ollama_llm(periballon.http, model, urlOllama, periballon.katagrafi);
      } else {
        const testSecrets: MystikaPyli = {
          async pare(key) { return key === 'llm_api_key' && kleidiApi.trim() ? kleidiApi.trim() : periballon.mystika.pare(key); },
          vale: (key, value) => periballon.mystika.vale(key, value),
          svise: (key) => periballon.mystika.svise(key),
        };
        testLlm = ftiaxe_gemini_llm(periballon.http, testSecrets, periballon.rologi, periballon.katagrafi, { montelo: model });
      }
      const apotelesma = await testLlm.parage_keimeno({
        systima: 'Έλεγχος σύνδεσης συστήματος',
        minimata: [{ rolos: 'xristis', keimeno: 'ping' }],
        ekdosi_prompt: '1',
        thermokrasia: 0,
      });

      if (apotelesma.ok) {
        setDokimiApotelesma({
          epitixia: true,
          minima: `Επιτυχής σύνδεση με ${PAROXOI_LLM.find((provider) => provider.id === providerId)?.titlos ?? providerId} (${model})!`,
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

  async function exportBackup(): Promise<void> {
    if (vaultSecurity === null) {
      setBackupMessage('Δεν είναι διαθέσιμο το vault runtime.');
      return;
    }
    setBackupBusy(true);
    setBackupMessage(null);
    try {
      const backup = await vaultSecurity.createEncryptedBackup(backupPassword);
      await deliverEncryptedBackup(backup);
      setBackupPassword('');
      setBackupMessage('Το encrypted backup δημιουργήθηκε. Φύλαξε χωριστά τον κωδικό backup.');
    } catch (reason) {
      setBackupMessage(reason instanceof Error ? reason.message : 'Δεν δημιουργήθηκε encrypted backup.');
    } finally {
      setBackupBusy(false);
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
    }

    const exeiKleidi = paroxosId === 'gemini' && (exeiNeoKleidi || exeiVaultKleidi);
    await apothiki.allaxe_rytheseis({
      ...apothiki.rytheseis,
      onomaMontelou: epilegmenoMontelo,
      exeiKleidiLlm: exeiKleidi,
      urlOllama,
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
        ypokeimeno="Επιλογή παρόχου και μοντέλου AI, με κρυπτογραφημένη αποθήκευση του API key στη συσκευή."
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
                  disabled={p.id === 'ollama' && !ollamaDiathesimo}
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
                <option key={p.id} value={p.id} disabled={p.id === 'ollama' && !ollamaDiathesimo}>
                  {p.id === 'ollama' && !ollamaDiathesimo ? `${p.titlos} · διαθέσιμο μόνο στον ίδιο υπολογιστή` : p.titlos}
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
            {paroxosId === 'ollama' && ollamaDiathesimo && (
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
        titlos="Κρυπτογραφημένο vault"
        ypokeimeno="Τα αρχεία, οι ρυθμίσεις και τα API keys αποθηκεύονται κρυπτογραφημένα στη συσκευή."
        stoixeia={
          <div>
            <div className="odoni-xeiris">
              <Pilegma
                keimeno={
                  exeiVaultKleidi
                    ? 'API key αποθηκευμένο κρυπτογραφημένα'
                    : 'Δεν υπάρχει αποθηκευμένο API key'
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
        titlos="Encrypted backup / ανάκτηση"
        ypokeimeno="Εξάγει τοπικά κρυπτογραφημένο αντίγραφο για μεταφορά σε άλλη συσκευή. Χρησιμοποίησε διαφορετικό κωδικό τουλάχιστον 12 χαρακτήρων και φύλαξέ τον χωριστά."
        stoixeia={
          <div className="odoni-xeiris">
            <label className="odoni-xeiris-zeugos" htmlFor="vault-backup-export-password">Κωδικός backup</label>
            <input
              id="vault-backup-export-password"
              className="proedri-travla-gramma"
              type="password"
              autoComplete="new-password"
              minLength={12}
              value={backupPassword}
              onChange={(event) => setBackupPassword(event.target.value)}
              aria-label="Ξεχωριστός κωδικός για encrypted backup"
            />
            <button type="button" className="pilegma pilegma-entono" disabled={backupBusy || backupPassword.trim().length < 12} onClick={() => void exportBackup()}>
              {backupBusy ? 'Δημιουργία backup…' : 'Εξαγωγή encrypted backup'}
            </button>
            <p>Το backup δεν περιλαμβάνει το κλειδί βιομετρικού ξεκλειδώματος. Για επαναφορά επίλεξε το αρχείο στην αρχική οθόνη μιας καθαρής εγκατάστασης.</p>
            {backupMessage !== null && <p role="status">{backupMessage}</p>}
          </div>
        }
      />

      <BridgePairingCard />

      <Karta
        titlos="Γρήγορο ξεκλείδωμα συσκευής"
        ypokeimeno={vaultSecurity?.biometricEnabled
          ? 'Τα βιομετρικά ενεργοποιήθηκαν. Ο κύριος κωδικός και το recovery key εξακολουθούν να λειτουργούν.'
          : 'Προαιρετικά, ξεκλείδωσε με Face ID, Touch ID ή βιομετρικά Android μετά την αρχική ρύθμιση.'}
        stoixeia={
          <div className="odoni-xeiris">
            {vaultSecurity === null ? (
              <Pilegma keimeno="Διαθέσιμο στις native εφαρμογές" />
            ) : vaultSecurity.biometricEnabled ? (
              <button type="button" className="pilegma" onClick={() => void vaultSecurity.disableBiometrics().then(() => setVaultMinima('Το βιομετρικό ξεκλείδωμα απενεργοποιήθηκε.')).catch(() => setVaultMinima('Δεν ήταν δυνατή η απενεργοποίηση.'))}>
                Απενεργοποίηση βιομετρικών
              </button>
            ) : (
              <button type="button" className="pilegma pilegma-entono" disabled={!vaultSecurity.biometricAvailable} onClick={() => void vaultSecurity.enableBiometrics().then(() => setVaultMinima('Τα βιομετρικά ενεργοποιήθηκαν.')).catch((reason: unknown) => setVaultMinima(reason instanceof Error ? reason.message : 'Δεν ενεργοποιήθηκαν τα βιομετρικά.'))}>
                {vaultSecurity.biometricAvailable ? 'Ενεργοποίηση βιομετρικών' : 'Δεν είναι διαθέσιμα σε αυτή τη συσκευή'}
              </button>
            )}
            {vaultMinima !== null && <p role="status">{vaultMinima}</p>}
          </div>
        }
      />

      <Karta
        titlos="Δοκιμή & Επαλήθευση"
        ypokeimeno="Η δοκιμή Gemini ζητά επιβεβαίωση και στέλνει μόνο ένα γενικό ping, χωρίς περιεχόμενο μαθήματος."
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

      {pendingGeminiTest !== null && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="gemini-test-confirm-title" className="karta tutor-confirmation">
          <h2 id="gemini-test-confirm-title">Επιβεβαίωση δοκιμής Gemini</h2>
          <p>Θα σταλεί στην Google μόνο το παρακάτω γενικό αίτημα σύνδεσης. Δεν περιλαμβάνει υλικό ή ιστορικό μαθήματος.</p>
          <pre>{`SYSTEM\nΈλεγχος σύνδεσης συστήματος\n\nUSER\nping`}</pre>
          <p>Μοντέλο: {pendingGeminiTest}</p>
          <div className="odoni-xeiris">
            <button type="button" className="pilegma" disabled={dokimiSeEkseliksi} onClick={() => setPendingGeminiTest(null)}>Ακύρωση</button>
            <button
              type="button"
              className="pilegma pilegma-entono"
              disabled={dokimiSeEkseliksi}
              onClick={() => {
                const model = pendingGeminiTest;
                setPendingGeminiTest(null);
                void ektelese_dokimi_syndesis(model, 'gemini');
              }}
            >
              Επιβεβαίωση και αποστολή ping
            </button>
          </div>
        </div>
      )}

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
