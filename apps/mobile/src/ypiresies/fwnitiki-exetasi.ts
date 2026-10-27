/**
 * Υπηρεσία Φωνητικής Αναγνώρισης και Εξέτασης.
 *
 * Wrapper γύρω από το πρότυπο Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * με ασφαλές fallback για περιβάλλοντα χωρίς υποστήριξη (SSR, WebViews χωρίς άδεια μικροφώνου κ.λπ.).
 */

export interface FwnitikiEpilogi {
  /** Γλώσσα αναγνώρισης (προεπιλογή: 'el-GR'). */
  readonly glwssa?: string;
  /** Συνεχής καταγραφή ή απλή απάντηση μίας φράσης (προεπιλογή: false). */
  readonly synexisKatagrafi?: boolean;
  /** Επιστροφή ενδιάμεσων προσωρινών αποτελεσμάτων (προεπιλογή: true). */
  readonly prosorinaApotelesmata?: boolean;
}

export type FwnitikoApotelesmaCallback = (keimeno: string, einaiTeliko: boolean) => void;
export type FwnitikoSfalmaCallback = (sfalma: string) => void;

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    readonly [index: number]: {
      readonly isFinal?: boolean;
      readonly length: number;
      readonly [index: number]: {
        readonly transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function lavoumeSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  const cls = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;
  return typeof cls === 'function' ? cls : null;
}

/**
 * Ελέγχει αν το τρέχον runtime υποστηρίζει Web Speech API.
 */
export function ypostirizetaiFwnitikiAnagnorisi(): boolean {
  return lavoumeSpeechRecognitionClass() !== null;
}

/**
 * Υπηρεσία διαχείρισης φωνητικής απάντησης.
 */
export class FwnitikiExetasiYpiresia {
  private epiloges: FwnitikiEpilogi;
  private recognitionInstance: SpeechRecognitionInstance | null = null;
  private akroasiEnergi = false;

  constructor(epiloges?: FwnitikiEpilogi) {
    this.epiloges = {
      glwssa: epiloges?.glwssa ?? 'el-GR',
      synexisKatagrafi: epiloges?.synexisKatagrafi ?? false,
      prosorinaApotelesmata: epiloges?.prosorinaApotelesmata ?? true,
    };
  }

  /** Ελέγχει διαθεσιμότητα του Web Speech API. */
  public ypostirizetai(): boolean {
    return ypostirizetaiFwnitikiAnagnorisi();
  }

  /** Ελέγχει αν καταγράφει αυτή τη στιγμή. */
  public einaiSeAkroasi(): boolean {
    return this.akroasiEnergi;
  }

  /**
   * Εκκινεί τη φωνητική καταγραφή.
   *
   * @param onApotelesma Callback για ενδιάμεσα και τελικά κείμενα
   * @param onSfalma Callback σε περίπτωση σφάλματος ή μη υποστήριξης
   * @returns true αν ξεκίνησε επιτυχώς, false σε αντίθετη περίπτωση
   */
  public xekina(
    onApotelesma: FwnitikoApotelesmaCallback,
    onSfalma?: FwnitikoSfalmaCallback
  ): boolean {
    const RecognitionCls = lavoumeSpeechRecognitionClass();
    if (!RecognitionCls) {
      if (onSfalma) {
        onSfalma('Το Web Speech API δεν υποστηρίζεται σε αυτό το περιβάλλον.');
      }
      return false;
    }

    try {
      this.stamata();

      const instance = new RecognitionCls();
      instance.lang = this.epiloges.glwssa ?? 'el-GR';
      instance.continuous = this.epiloges.synexisKatagrafi ?? false;
      instance.interimResults = this.epiloges.prosorinaApotelesmata ?? true;

      instance.onresult = (event: SpeechRecognitionEventLike) => {
        let telikoKeimeno = '';
        let prosorinoKeimeno = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item && item[0]) {
            if (item.isFinal) {
              telikoKeimeno += item[0].transcript;
            } else {
              prosorinoKeimeno += item[0].transcript;
            }
          }
        }

        const apotelesma = (telikoKeimeno || prosorinoKeimeno).trim();
        const einaiTeliko = Boolean(telikoKeimeno);
        if (apotelesma) {
          onApotelesma(apotelesma, einaiTeliko);
        }
      };

      instance.onerror = (event: SpeechRecognitionErrorEventLike) => {
        this.akroasiEnergi = false;
        if (onSfalma) {
          onSfalma(event.error || 'Σφάλμα φωνητικής αναγνώρισης.');
        }
      };

      instance.onend = () => {
        this.akroasiEnergi = false;
      };

      this.recognitionInstance = instance;
      this.recognitionInstance.start();
      this.akroasiEnergi = true;
      return true;
    } catch (err) {
      this.akroasiEnergi = false;
      const minima = err instanceof Error ? err.message : String(err);
      if (onSfalma) {
        onSfalma(`Αποτυχία εκκίνησης φωνητικής αναγνώρισης: ${minima}`);
      }
      return false;
    }
  }

  /**
   * Διακόπτει ομαλά την ακρόαση και επεξεργάζεται την τρέχουσα φράση.
   */
  public stamata(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {
        // αγνόηση αν έχει ήδη σταματήσει
      }
      this.recognitionInstance = null;
    }
    this.akroasiEnergi = false;
  }

  /**
   * Ακυρώνει αμέσως την ακρόαση χωρίς περαιτέρω επεξεργασία.
   */
  public akyrwse(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.abort();
      } catch {
        // αγνόηση
      }
      this.recognitionInstance = null;
    }
    this.akroasiEnergi = false;
  }
}
