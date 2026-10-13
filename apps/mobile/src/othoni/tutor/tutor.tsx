import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IonButton, IonSpinner } from '@ionic/react';
import type { Enotita, Mathima, Selida } from '@dps/core';
import { Karta, Pilegma, ProskelesioOmonimas } from '../../koinima/index.js';
import { xrisiApothekisis } from '../../apothiki/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import type { Periballon } from '../../periballon/index.js';
import {
  fortose_synomilia_apo_apothiki,
  fortose_xartis_apo_apothiki,
  diadromi_synomilias,
} from '../../ypiresies/index.js';
import { fortose_mathimata_apo_apothiki } from '../../ypiresies/mathimata.js';
import { read_course_gemini_opt_in, write_course_gemini_opt_in } from '../../ypiresies/ai-policy.js';

export const APANTISI_YPARXEIS_STO_YLIKO = 'Δεν υπάρχει στο υλικό.';

export interface GrammiImerrologiou {
  readonly rolos: 'xristis' | 'tutor';
  readonly keimeno: string;
}

export interface KontekstoTutor {
  readonly enotita: Enotita | null;
  readonly arxikes_grammata: readonly GrammiImerrologiou[];
}

export interface TutorCourseContext {
  readonly course: Mathima;
  readonly section: Enotita | null;
  readonly pages: readonly Selida[];
  readonly promptContext: string;
}

export const DRASEIS_TUTOR = [
  { titlos: '🎯 Κάνε μου ερωτήσεις', prompt: 'Δημιούργησε ένα σύντομο quiz από το υλικό που δόθηκε. Περίμενε την απάντησή μου πριν εξηγήσεις.' },
  { titlos: '💡 Εξήγησε την ύλη', prompt: 'Εξήγησε τα βασικά σημεία του υλικού που δόθηκε, ξεκινώντας από τα θεμέλια.' },
  { titlos: '⚠️ Σημεία προσοχής', prompt: 'Εντόπισε τις παρανοήσεις ή τα δύσκολα σημεία που τεκμηριώνονται στο υλικό.' },
  { titlos: '🧪 Πρότεινε άσκηση', prompt: 'Πρότεινε μία άσκηση βασισμένη στο υλικό. Μην εμφανίσεις λύση μέχρι να απαντήσω.' },
] as const;

const MAX_CONTEXT_CHARACTERS = 24_000;
const MAX_HISTORY_MESSAGES = 10;
const GREETING = 'Έχω φορτώσει τοπικά το κείμενο των αρχείων αυτού του μαθήματος. Ρώτησέ με κάτι που τεκμηριώνεται σε αυτό.';

function safeCourseSegment(value: string): string {
  return encodeURIComponent(value).replaceAll('%', '_');
}

function pagesForSection(pages: readonly Selida[], section: Enotita | null): Selida[] {
  if (section === null || section.piges.length === 0) return [...pages];
  const ranges = new Map(section.piges.map((source) => [source.arxeio_id, source]));
  return pages.filter((page) => {
    const range = ranges.get(page.arxeio_id);
    return range !== undefined && page.arithmos >= range.apo && page.arithmos <= range.eos;
  });
}

async function loadCourseContext(
  periballon: Periballon,
  course: Mathima,
  sectionId: string,
): Promise<TutorCourseContext> {
  const chartState = await fortose_xartis_apo_apothiki(periballon.apothiki, course.kodikos);
  const chart = chartState.katastasi === 'etimo' ? chartState.dedomena : null;
  const section = chart?.enotites.find((entry) => entry.id === sectionId) ?? null;
  const directory = `${course.kodikos}/.spoudes/keimeno`;
  const files = await periballon.apothiki.lista(directory);
  if (!files.ok) {
    return { course, section, pages: [], promptContext: '' };
  }
  const pages: Selida[] = [];
  for (const path of files.timi.filter((file) => file.endsWith('.json')).sort()) {
    const loaded = await periballon.apothiki.diavase_keimeno(path);
    if (!loaded.ok) continue;
    try {
      const parsed: unknown = JSON.parse(loaded.timi);
      if (Array.isArray(parsed)) {
        for (const page of parsed) {
          if (typeof page === 'object' && page !== null && 'keimeno' in page &&
              'arithmos' in page && 'arxeio_id' in page && typeof page.keimeno === 'string' &&
              typeof page.arithmos === 'number' && typeof page.arxeio_id === 'string') {
            pages.push(page as Selida);
          }
        }
      }
    } catch {
      // One damaged extraction is skipped; no content is invented to replace it.
    }
  }
  const selectedPages = pagesForSection(pages, section);
  let length = 0;
  const citations: string[] = [];
  for (const page of selectedPages) {
    const text = page.keimeno.trim();
    if (!text) continue;
    const citation = `[[${page.arxeio_id}: σ. ${page.arithmos}]]`;
    const entry = `${citation}\n${text}`;
    if (length + entry.length > MAX_CONTEXT_CHARACTERS) break;
    citations.push(entry);
    length += entry.length;
  }
  return { course, section, pages: selectedPages, promptContext: citations.join('\n\n') };
}

export function xairetisma_tutor(section: Enotita | null, courseCode?: string): GrammiImerrologiou {
  const title = section === null ? 'το υλικό του μαθήματος' : `την ενότητα «${section.titlos}»`;
  const course = courseCode ? ` ${courseCode}` : '';
  return { rolos: 'tutor', keimeno: `Γεια σου. Συζητάμε για${course} και ${title}. ${GREETING}` };
}

/** Runs a real provider against locally extracted course pages; no sample answer or fallback exists. */
export async function apantisi_me_llm_i_topika(
  question: string,
  periballon: Periballon,
  courseCode: string,
  section: Enotita | null,
  history: readonly GrammiImerrologiou[],
  courseText: string,
): Promise<{ readonly keimeno: string }> {
  if (courseText.trim() === '') return { keimeno: APANTISI_YPARXEIS_STO_YLIKO };
  const output = await periballon.llm.parage_keimeno({
    systima: [
      `Είσαι tutor για το μάθημα ${courseCode}${section ? `, ενότητα «${section.titlos}»` : ''}.`,
      'Χρησιμοποίησε αποκλειστικά τις αποσπάσεις πηγών που ακολουθούν.',
      'Μην επινοείς παραπομπές ή πληροφορίες. Κάθε τεκμηριωμένη απάντηση να παραπέμπει με την ακριβή ετικέτα πηγής.',
      `Αν η ερώτηση δεν τεκμηριώνεται στις αποσπάσεις, απάντησε ακριβώς: «${APANTISI_YPARXEIS_STO_YLIKO}».`,
      '',
      'Υλικό πηγών:',
      courseText,
    ].join('\n'),
    minimata: [
      ...history.slice(-MAX_HISTORY_MESSAGES).map((entry) => ({
        rolos: entry.rolos === 'tutor' ? ('montelo' as const) : ('xristis' as const),
        keimeno: entry.keimeno,
      })),
      { rolos: 'xristis', keimeno: question },
    ],
    ekdosi_prompt: 'tutor-course-material-v1',
    thermokrasia: 0.2,
  });
  if (!output.ok) throw new Error(output.sfalma.minima);
  return { keimeno: output.timi.trim() || APANTISI_YPARXEIS_STO_YLIKO };
}

type PendingQuestion = { readonly text: string; readonly gemini: boolean };

export default function TutorChat() {
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get('enotita') ?? '';
  const periballon = xrisiPeriballontos();
  const { kodikosMathimatos, rytheseis } = xrisiApothekisis();
  const [course, setCourse] = useState<Mathima | null>(null);
  const [courseContext, setCourseContext] = useState<TutorCourseContext | null>(null);
  const [history, setHistory] = useState<readonly GrammiImerrologiou[]>([]);
  const [extraMessages, setExtraMessages] = useState<readonly GrammiImerrologiou[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiConsent, setGeminiConsent] = useState(false);
  const [consentGivenInDialog, setConsentGivenInDialog] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null);
  const selectedModel = rytheseis.onomaMontelou || 'gemini-2.5-flash';
  const geminiSelected = selectedModel.toLowerCase().startsWith('gemini-');
  const activeSection = courseContext?.section ?? null;
  const allMessages = useMemo(() => [...history, ...extraMessages], [history, extraMessages]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setCourseContext(null);
    setHistory([]);
    setExtraMessages([]);
    setError(null);
    void (async () => {
      const coursesState = await fortose_mathimata_apo_apothiki(periballon.apothiki);
      const courses = coursesState.katastasi === 'etimo' ? coursesState.dedomena : [];
      const selected = courses.find((entry) => entry.kodikos === kodikosMathimatos) ?? null;
      if (!active) return;
      setCourse(selected);
      if (selected === null) {
        setLoading(false);
        return;
      }
      const context = await loadCourseContext(periballon, selected, sectionId);
      const threadId = safeCourseSegment(sectionId || 'genika');
      const savedHistory = await fortose_synomilia_apo_apothiki(periballon.apothiki, selected.kodikos, threadId);
      const consent = await read_course_gemini_opt_in(periballon.apothiki, selected.kodikos);
      if (!active) return;
      setCourseContext(context);
      setHistory(savedHistory);
      setGeminiConsent(consent);
      if (savedHistory.length === 0) setExtraMessages([xairetisma_tutor(context.section, selected.kodikos)]);
      setLoading(false);
    })().catch((reason: unknown) => {
      if (active) {
        setError(reason instanceof Error ? reason.message : 'Δεν φορτώθηκε το τοπικό υλικό.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [periballon, kodikosMathimatos, sectionId]);

  async function persistConversation(messages: readonly GrammiImerrologiou[]): Promise<void> {
    if (course === null) return;
    const threadId = safeCourseSegment(sectionId || 'genika');
    const path = diadromi_synomilias(course.kodikos, threadId);
    const serialized = `${messages.map((message) => JSON.stringify(message)).join('\n')}\n`;
    const saved = await periballon.apothiki.grapse_keimeno(path, serialized);
    if (!saved.ok) throw new Error(saved.sfalma.minima);
  }

  function requestGeneration(questionText: string): void {
    const question = questionText.trim();
    if (sending || question === '') return;
    if (course === null || courseContext === null) {
      setError('Επίλεξε πρώτα μάθημα.');
      return;
    }
    if (courseContext.promptContext === '') {
      setError('Δεν υπάρχει εξαγμένο κείμενο για αυτό το μάθημα. Συγχρόνισε τα αρχεία πριν χρησιμοποιήσεις τον Tutor.');
      return;
    }
    setError(null);
    setPendingQuestion({ text: question, gemini: geminiSelected });
    setConsentGivenInDialog(geminiConsent);
  }

  async function confirmGeneration(): Promise<void> {
    if (pendingQuestion === null || course === null || courseContext === null) return;
    if (pendingQuestion.gemini && !consentGivenInDialog) {
      setError('Για Gemini χρειάζεται ρητή συναίνεση για αυτό το μάθημα.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      if (pendingQuestion.gemini && !geminiConsent) {
        await write_course_gemini_opt_in(periballon.apothiki, course.kodikos, true);
        setGeminiConsent(true);
      }
      const answer = await apantisi_me_llm_i_topika(
        pendingQuestion.text,
        periballon,
        course.kodikos,
        activeSection,
        allMessages,
        courseContext.promptContext,
      );
      const pair = [
        ...allMessages,
        { rolos: 'xristis' as const, keimeno: pendingQuestion.text },
        { rolos: 'tutor' as const, keimeno: answer.keimeno },
      ];
      await persistConversation(pair);
      setHistory(pair);
      setExtraMessages([]);
      setInput('');
      setPendingQuestion(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Η δημιουργία απάντησης απέτυχε.');
    } finally {
      setSending(false);
    }
  }

  async function changeGeminiConsent(enabled: boolean): Promise<void> {
    if (course === null) return;
    try {
      await write_course_gemini_opt_in(periballon.apothiki, course.kodikos, enabled);
      setGeminiConsent(enabled);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Δεν αποθηκεύτηκε η επιλογή ιδιωτικότητας.');
    }
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    requestGeneration(input);
  }

  const sectionLabel = activeSection?.titlos ?? (sectionId || 'όλο το μάθημα');

  return (
    <div className="episkefsi" data-testid="tutor-ekran">
      <ProskelesioOmonimas
        titlos="Tutor"
        ypokeimeno={course ? `${course.kodikos} · ${course.titlos}` : 'Επίλεξε μάθημα για να ξεκινήσεις'}
        akseis={course ? <Pilegma keimeno={`Υλικό: ${sectionLabel}`} entono /> : undefined}
      />
      {course === null && !loading && (
        <Karta titlos="Δεν έχει επιλεγεί μάθημα" ypokeimeno="Επίλεξε ή συγχρόνισε μάθημα πριν ανοίξεις τον Tutor." stoixeia={<Link to="/mathimata">Άνοιγμα μαθημάτων →</Link>} />
      )}
      {course !== null && (
        <>
          <Karta
            titlos="Χρήση Google Gemini"
            ypokeimeno="Η συναίνεση αποθηκεύεται χωριστά για κάθε μάθημα. Κάθε αποστολή ζητά νέα επιβεβαίωση."
            stoixeia={
              <label className="odoni-xeiris">
                <input
                  type="checkbox"
                  checked={geminiConsent}
                  onChange={(event) => void changeGeminiConsent(event.target.checked)}
                />
                Επιτρέπω στο Gemini να λάβει το απόσπασμα υλικού και το ιστορικό αυτού του μαθήματος.
              </label>
            }
          />
          <p role="status" className="karta-ypokeimeno">
            {courseContext === null ? 'Φόρτωση τοπικού υλικού…' : courseContext.promptContext
              ? `${courseContext.pages.length} σελίδες από τοπικά αποθηκευμένα αρχεία είναι διαθέσιμες.`
              : 'Δεν βρέθηκε εξαγμένο κείμενο. Συγχρόνισε και εξήγαγε αρχεία του μαθήματος.'}
          </p>
          <div className="imerologia" data-testid="tutor-imerologia" aria-live="polite">
            {allMessages.map((message, index) => (
              <div
                key={`${index}-${message.rolos}`}
                className={message.rolos === 'xristis' ? 'imerologia-gramma imerologia-bolakia' : 'imerologia-gramma imerologia-apantisi'}
              >
                {message.keimeno}
              </div>
            ))}
          </div>
          {sending && <div className="katastasi-periohos"><IonSpinner name="crescent" /><p className="katastasi-ypokeimeno">Δημιουργία απάντησης…</p></div>}
          <div className="tutor-draseis-mpara" role="toolbar" aria-label="Ενέργειες tutor">
            {DRASEIS_TUTOR.map((action) => (
              <button key={action.titlos} type="button" className="pilegma tutor-drasis-koumpi" disabled={sending || courseContext?.promptContext === ''} onClick={() => requestGeneration(action.prompt)}>
                {action.titlos}
              </button>
            ))}
          </div>
          <form className="imerologia-paixidi" data-testid="tutor-paixidi" onSubmit={submit}>
            <input
              className="imerologia-paixidi-gramma"
              value={input}
              placeholder="Ρώτησε για το υλικό του μαθήματος…"
              aria-label="Ερώτηση για τον tutor"
              disabled={sending || courseContext?.promptContext === ''}
              onChange={(event) => setInput(event.target.value)}
            />
            <IonButton type="submit" size="small" disabled={sending || input.trim() === '' || courseContext?.promptContext === ''} data-testid="tutor-apomilosi">
              Αποστολή
            </IonButton>
          </form>
        </>
      )}
      {loading && <div role="status" className="katastasi-periohos"><IonSpinner name="crescent" /><p>Φόρτωση τοπικών δεδομένων…</p></div>}
      {error !== null && <p role="alert" className="karta-ypokeimeno">{error}</p>}
      {pendingQuestion !== null && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="tutor-confirm-title" className="karta tutor-confirmation">
          <h2 id="tutor-confirm-title">Επιβεβαίωση δημιουργίας</h2>
          {pendingQuestion.gemini ? (
            <>
              <p>Θα σταλεί στην Google μέσω Gemini το σχετικό απόσπασμα των τοπικών αρχείων, η ερώτηση και έως 10 προηγούμενα μηνύματα αυτής της συνομιλίας.</p>
              {!geminiConsent && (
                <label className="odoni-xeiris">
                  <input type="checkbox" checked={consentGivenInDialog} onChange={(event) => setConsentGivenInDialog(event.target.checked)} />
                  Επιτρέπω τη χρήση του Gemini για αυτό το μάθημα από εδώ και πέρα.
                </label>
              )}
            </>
          ) : (
            <p>Η ερώτηση και το σχετικό απόσπασμα θα επεξεργαστούν τοπικά από το {selectedModel} στον ίδιο υπολογιστή.</p>
          )}
          <p><strong>Ερώτηση:</strong> {pendingQuestion.text}</p>
          <div className="odoni-xeiris">
            <IonButton type="button" fill="outline" disabled={sending} onClick={() => setPendingQuestion(null)}>Ακύρωση</IonButton>
            <IonButton type="button" disabled={sending || (pendingQuestion.gemini && !consentGivenInDialog)} onClick={() => void confirmGeneration()}>
              {sending ? 'Αποστολή…' : pendingQuestion.gemini ? 'Επιβεβαίωση και αποστολή στο Gemini' : 'Επιβεβαίωση τοπικής δημιουργίας'}
            </IonButton>
          </div>
        </div>
      )}
    </div>
  );
}
