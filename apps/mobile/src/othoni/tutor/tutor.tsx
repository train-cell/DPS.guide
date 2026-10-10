import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IonButton, IonSpinner } from '@ionic/react';
import { Pilegma, OloniKatastasis, ProskelesioOmonimas } from '../../koinima/index.js';
import { fortosi, etimo, type Katastasi } from '../../kathstasi/index.js';
import { KATHYSTERISI_PSEDON_MS, pseudos_xartis } from '../../pseudomata/index.js';
import type { Enotita } from '@dps/core';

/** Η απάντηση-φράγκος του tutor όταν δεν υπάρχει τεκμηρίωση στο υλικό. */
export const APANTISI_YPARXEIS_STO_YLIKO = 'Δεν υπάρχει στο υλικό';

/** Χρόνος εικονικής «σκέψης» του tutor πριν την απάντηση, ώστε η αναμονή να είναι ορατή. */
export const KATHYSTERISI_APANTISIS_MS = 420;

/** Ποιος έγραψε ένα γράμμα στην ιστορικό. */
export type RologosImerrologiou = 'xristis' | 'tutor';

/** Ένα γράμμα της ιστορικού, είτε ερώτημα είτε απάντηση. */
export interface GrammiImerrologiou {
  readonly rolos: RologosImerrologiou;
  readonly keimeno: string;
}

/** Ιδιότητες του context του tutor: η ενεργή ενότητα και το πρώτο γράμμα. */
export interface KontekstoTutor {
  readonly enotita: Enotita | null;
  readonly arxikes_grammata: readonly GrammiImerrologiou[];
}

/** Ιδιότητες μιας ψεύτικης απάντησης του tutor και των λέξεων-κλειδιών της. */
interface ApantisiPseudos {
  readonly kleidi: readonly string[];
  readonly keimeno: string;
}

const TONI_ME_TONO: Readonly<Record<string, string>> = {
  'ά': 'α',
  'έ': 'ε',
  'ή': 'η',
  'ί': 'ι',
  'ϊ': 'ι',
  'ΐ': 'ι',
  'ό': 'ο',
  'ύ': 'υ',
  'ΰ': 'υ',
  'ώ': 'ω',
};

const APANTISEIS_PSEDES: readonly ApantisiPseudos[] = [
  {
    kleidi: ['μεταβλητη', 'μεταβλητες', 'int', 'float', 'τυπος'],
    keimeno:
      'Μεταβλητή είναι ένα όνομα που δεσμεύει θέση στη μνήμη, και ο τύπος της (int, float, boolean) καθορίζει τι επιτρέπεται να αποθηκεύσει. Δηλώνεται μία φορά και μετά αλλάζει τιμή με εκχωρήσεις.',
  },
  {
    kleidi: ['παγιδα', 'παγιδες', 'sos'],
    keimeno:
      'Οι συχνότερες παγίδες: στην Python το 5 / 2 δεν κάνει στρογγυλό, τα δείκτες ξεκινούν από 0 και το range(1, 5) σταματά στο 4.',
  },
  {
    kleidi: ['εντολη', 'if', 'else', 'elif', 'συνθηκη'],
    keimeno:
      'Η επιλεκτική εκτέλεση if / elif / else τρέχει το πρώτο κλάδημα που ικανοποιεί τη συνθήκη. Δύο ανεξάρτητα if δεν κάνουν «αλλιώς»· γι’ αυτό υπάρχει το elif.',
  },
  {
    kleidi: ['βροχο', 'while', 'for', 'επαναληψη'],
    keimeno:
      'Ο while επαναλαμβάνει όσο η συνθήκη κρατάει, ο for όσο διατρέχει μια ακολουθία. Χωρίς αρχικοποίηση ή επαύξηση της συνθήκης ο βρόχος δεν τερματίζει ποτέ.',
  },
  {
    kleidi: ['πινακ', 'array', 'δεικτη', 'δεικτες'],
    keimeno:
      'Ο πίνακας αποθηκεύει στοιχεία ίδιου τύπου με συνεχείς δείκτες από το 0, οπότε ο τελευταίος έχει τιμή len(p) - 1.',
  },
  {
    kleidi: ['συναρτησ', 'function', 'return'],
    keimeno:
      'Η συνάρτηση δέχεται παραμέτρους και επιστρέφει τιμή με return. Χωρίς return επιστρέφει None, και οι μεταβλητές μέσα της είναι τοπικές.',
  },
  {
    kleidi: ['αλγοριθμ', 'διαδρομη εκτελεσης', 'προγραμμ'],
    keimeno:
      'Ο αλγόριθμος είναι η ιδέα της λύσης και το πρόγραμμα η γραμμή κώδικα που την εκφράζει. Η διαδρομή εκτέλεσης είναι η σειρά των εντολών όπως τρέχουν πραγματικά.',
  },
  {
    kleidi: ['αυτοελεγχο', 'εξετασ', 'τελικη'],
    keimeno:
      'Ο αυτοέλεγχος έχει 3–5 ερωτήσεις με κρυφές απαντήσεις. Κάθε απάντηση παραπέμπει στη σελίδα της πηγής, ώστε να ελέγχεται στο υλικό.',
  },
];

/** Κανονικοποιεί ελληνικό κείμενο σε μικρά γράμματα χωρίς τόνους, για ανθεκτική αντιστοίχιση. */
export function kanonikopoiei(keimeno: string): string {
  return keimeno
    .toLowerCase()
    .replaceAll('ς', 'σ')
    .split('')
    .map((char) => TONI_ME_TONO[char] ?? char)
    .join('');
}

/** Αναμένει το δοθέντο αριθμό χιλιοστών του δευτερολέπτου, όπως οι ψεύτικες υπηρεσίες του repo. */
function anastoli(chronos_ms: number): Promise<void> {
  return new Promise((lise) => {
    setTimeout(lise, chronos_ms);
  });
}

/** Επιστρέφει την ενότητα του ψεύτικου χάρτη, ή null αν το id είναι κενό ή άγνωστο. */
export function psedoi_enotita(enotita_id: string | null): Enotita | null {
  if (enotita_id === null || kanonikopoiei(enotita_id).trim() === '') {
    return null;
  }
  const zitoumeni = kanonikopoiei(enotita_id);
  const enotita = pseudos_xartis().enotites.find((katixeino) => kanonikopoiei(katixeino.id) === zitoumeni);
  return enotita ?? null;
}

/** Δίνει την απάντηση του tutor· χωρίς αντιστοίχιση επιστρέφει ακριβώς «Δεν υπάρχει στο υλικό». */
export function apantisa_tutor(erotisi: string): string {
  const zitoumeni = kanonikopoiei(erotisi).trim();
  if (zitoumeni === '') {
    return APANTISI_YPARXEIS_STO_YLIKO;
  }
  for (const apantisi of APANTISEIS_PSEDES) {
    for (const kleidi of apantisi.kleidi) {
      if (zitoumeni.includes(kanonikopoiei(kleidi))) {
        return apantisi.keimeno;
      }
    }
  }
  return APANTISI_YPARXEIS_STO_YLIKO;
}

/** Φορτώνει το αρχικό context του tutor για την ενότητα που ζητήθηκε από το query string. */
export async function fortise_konteksto(enotita: Enotita | null): Promise<Katastasi<KontekstoTutor>> {
  await anastoli(KATHYSTERISI_PSEDON_MS);
  const xairetismata = enotita === null ? 'το μάθημα' : `την ενότητα «${enotita.titlos}»`;
  return etimo({
    enotita,
    arxikes_grammata: [
      {
        rolos: 'tutor',
        keimeno: `Γεια σου, ρώτα με γλώσσα του μαθήματος για ${xairetismata}. Αν κάτι δεν τεκμηριώνεται στο υλικό, θα το πω.`,
      },
    ],
  });
}

/** Συνομιλία με τον tutor: ιστορικό γραμμάτων, ορατή αναμονή και κανόνας «Δεν υπάρχει στο υλικό». */
export default function TutorChat() {
  const [parametroi] = useSearchParams();
  const enotitaId = parametroi.get('enotita');
  const enotita = psedoi_enotita(enotitaId);
  const [katastasi, setKatastasi] = useState<Katastasi<KontekstoTutor>>(fortosi());
  const [exomena, setExomena] = useState<readonly GrammiImerrologiou[]>([]);
  const [trima, setTrima] = useState('');
  const [apostolto, setApostolto] = useState(false);
  const alive = useRef(true);
  const xronologia = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    alive.current = true;
    setKatastasi(fortosi());
    void fortise_konteksto(psedoi_enotita(enotitaId)).then((apokrisis) => {
      if (alive.current) {
        setKatastasi(apokrisis);
      }
    });
    return () => {
      alive.current = false;
      for (const xronos of xronologia.current) {
        clearTimeout(xronos);
      }
      xronologia.current = [];
    };
  }, [enotitaId]);

  const apostoli_erotisi = (): void => {
    if (apostolto || trima.trim() === '') {
      return;
    }
    const katharis = trima.trim();
    setExomena((palia) => [...palia, { rolos: 'xristis', keimeno: katharis }]);
    setTrima('');
    setApostolto(true);
    const xronos = setTimeout(() => {
      if (!alive.current) {
        return;
      }
      setExomena((palia) => [
        ...palia,
        { rolos: 'tutor', keimeno: apantisa_tutor(katharis) },
      ]);
      setApostolto(false);
    }, KATHYSTERISI_APANTISIS_MS);
    xronologia.current.push(xronos);
  };

  const pilegmaEnotitas = `Ενότητα: ${enotita?.titlos ?? enotitaId ?? 'γενικά'}`;

  return (
      <div className="episkefsi" data-testid="tutor-ekran">
        <ProskelesioOmonimas
          titlos="Tutor"
          ypokeimeno="Απαντά μόνο από το υλικό του μαθήματος."
          akseis={<Pilegma keimeno={pilegmaEnotitas} entono />}
        />
        <OloniKatastasis katastasi={katastasi} adeioMinima="Δεν υπάρχει ακόμη συνομιλία.">
          {(konteksto) => (
            <>
              <div className="imerologia" data-testid="tutor-imerologia">
                {[...konteksto.arxikes_grammata, ...exomena].map((gramma, thesi) => (
                  <div
                    key={`${thesi}-${gramma.keimeno}`}
                    className={
                      gramma.rolos === 'xristis'
                        ? 'imerologia-gramma imerologia-bolakia'
                        : 'imerologia-gramma imerologia-apantisi'
                    }
                  >
                    {gramma.keimeno}
                  </div>
                ))}
              </div>
              {apostolto && (
                <div className="katastasi-periochos" data-testid="tutor-fortisi">
                  <IonSpinner name="crescent" aria-label="Ο tutor γράφει" />
                  <p className="katastasi-ypokeimeno">Ο tutor γράφει…</p>
                </div>
              )}
              <div className="imerologia-paixidi" data-testid="tutor-paixidi">
                <input
                  className="imerologia-paixidi-gramma"
                  value={trima}
                  placeholder="Γράψε την ερώτησή σου…"
                  aria-label="Ερώτηση για τον tutor"
                  onChange={(γεγονός) => {
                    setTrima(γεγονός.target.value);
                  }}
                  onKeyDown={(γεγονός) => {
                    if (γεγονός.key === 'Enter') {
                      apostoli_erotisi();
                    }
                  }}
                />
                <IonButton
                  size="small"
                  disabled={apostolto || trima.trim() === ''}
                  onClick={apostoli_erotisi}
                  data-testid="tutor-apomilosi"
                >
                  Αποστολή
                </IonButton>
              </div>
            </>
          )}
        </OloniKatastasis>
      </div>
  );
}
