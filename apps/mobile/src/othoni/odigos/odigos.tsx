import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IonButton } from '@ionic/react';
import { OloniKatastasis, ProskelesioOmonimas } from '../../koinima/index.js';
import { fortosi, etimo, sfalma, type Katastasi } from '../../kathstasi/index.js';
import { KATHYSTERISI_PSEDON_MS, pseudos_xartis } from '../../pseudomata/index.js';
import { analise_parapompi, diadromi_provolis, stilise_parapompi } from '../../provoli-pdf/index.js';

/** Οι υποχρεωτικές ενότητες ενός οδηγού μελέτης, με τη σειρά του προϊόντος. */
export const LEKIKIA_TMIMATON = [
  'stoxoi',
  'eli5',
  'theoria',
  'paradeigma',
  'pagides',
  'syndeseis',
  'autoelegchos',
] as const;

/** Κωδικός μιας υποχρεωτικής ενότητας οδηγού. */
export type KleidiTmimatos = (typeof LEKIKIA_TMIMATON)[number];

/** Ιδιότητες μιας ενότητας οδηγού: παράγραφοι και παραπομπή στην πηγή. */
export interface TmimaOdigou {
  readonly keimena: readonly string[];
  readonly parapompi: string;
}

/** Ιδιότητες του οδηγού μιας ενότητας μελέτης. */
export interface OdigosEnotitas {
  readonly enotita_id: string;
  readonly titlos: string;
  readonly tmimata: Readonly<Record<KleidiTmimatos, TmimaOdigou>>;
}

/** Ιδιότητες του ακατέργαστου ψεύτικου οδηγού, χωρίς τίτλο από τον χάρτη. */
interface OdigosPsedos {
  readonly tmimata: Readonly<Record<KleidiTmimatos, TmimaOdigou>>;
}

/** Οι επτά επικεφαλίδες των υποχρεωτικών ενοτήτων, όπως τις ζητά το προϊόν. */
export const EPKEFALIDES_TMIMATON: Readonly<Record<KleidiTmimatos, string>> = {
  stoxoi: '🎯 Στόχοι',
  eli5: '👶 ELI5',
  theoria: '🔬 Θεωρία',
  paradeigma: '🧪 Λυμένο παράδειγμα',
  pagides: '⚠️ Παγίδες',
  syndeseis: '🔗 Συνδέσεις',
  autoelegchos: '✅ Αυτοέλεγχος',
};

export const ODIGOI_PSEUDOI: Readonly<Record<string, OdigosPsedos>> = {
  'en-1': {
    tmimata: {
      stoxoi: {
        keimena: [
          'Να εξηγείς τι σημαίνει αλγόριθμος και πώς διαφέρει από ένα πρόγραμμα.',
          'Να περιγράφεις τη διαδρομή εκτέλεσης ενός προγράμματος βήμα προς βήμα.',
        ],
        parapompi: '[[arx-1: σ. 3]]',
      },
      eli5: {
        keimena: [
          'Φαντάσου μια συνταγή μαγειρέματος: τα υλικά είναι τα δεδομένα, τα βήματα είναι η εκτέλεση.',
          'Αν αλλάξεις τη σειρά των βημάτων, παίρνεις άλλο φαγητό — αυτό είναι η διαδρομή εκτέλεσης.',
        ],
        parapompi: '[[arx-1: σ. 4]]',
      },
      theoria: {
        keimena: [
          'Ο αλγόριθμος είναι μια πεπλεγμένη, τελειωμένη διαδικασία που λύνει μια κλάση προβλημάτων.',
          'Η διαδρομή εκτέλεσης είναι η σειρά των εντολών όπως εκτελούνται πραγματικά από τη μηχανή.',
          'Το ιστορικό της γλώσσας συνδέεται με τη μηχανή του Turing και τη θεωρία υπολογισιμότητας.',
        ],
        parapompi: '[[arx-1: σ. 5–7]]',
      },
      paradeigma: {
        keimena: [
          'Άθλημα: ζητήθηκε ο μέσος όρος δύο αριθμών. Εκτελείται πρώτα η ανάγνωση και μετά ο υπολογισμός.',
          'Λύση: x = (a + b) / 2, με τις εισόδους a και b να διαβάζονται πριν τον υπολογισμό.',
        ],
        parapompi: '[[arx-1: σ. 9]]',
      },
      pagides: {
        keimena: [
          'Μην μπερδεύεις το πρόγραμμα (γραμμή κώδικα) με τον αλγόριθμο (η ιδέα της λύσης).',
          'Μην ισχύεις ότι η διαδρομή εκτέλεσης ακολουθεί το κείμενο γραμμή-γραμμή· μπορεί να υπάρχει επανάληψη.',
        ],
        parapompi: '[[arx-1: σ. 10]]',
      },
      syndeseis: {
        keimena: [
          'Η ενότητα αυτή στηρίζει την ενότητα «Μεταβλητές και τύποι», που εξαρτάται από αυτή.',
          'Συνδέεται με τις ενότητες του ελέγχου ροής: η ροή προκύπτει από τη σειρά των βημάτων.',
        ],
        parapompi: '[[arx-2: σ. 2]]',
      },
      autoelegchos: {
        keimena: [
          'Πώς διαφέρει ένας αλγόριθμος από ένα τυχαίο πρόγραμμα; Απάντησε σε μία πρόταση.',
          'Δώσε δύο εντολές που θα μπορούσαν να εκτελεστούν με διαφορετική σειρά.',
          'Σε τι διαφέρει η θεωρητική διαδρομή εκτέλεσης από την πραγματική;',
        ],
        parapompi: '[[arx-1: σ. 11]]',
      },
    },
  },
  'en-2': {
    tmimata: {
      stoxoi: {
        keimena: [
          'Να ορίζεις μεταβλητές και να επιλέγεις τον κατάλληλο τύπο για κάθε τιμή.',
          'Να εξηγείς τη διαφορά μεταξύ int, float και boolean στη μνήμη και στην εμφάνιση.',
        ],
        parapompi: '[[arx-1: σ. 13]]',
      },
      eli5: {
        keimena: [
          'Η μεταβλητη είναι ένα ετικετάκι με όνομα που κοιτάζει μια τιμή, σαν κουτί με αυτοκόλλητο.',
          'Ο τύπος λέει στη μηχανή πόσο μεγάλο είναι το κουτί και τι επιτρέπεται να βάλεις μέσα.',
        ],
        parapompi: '[[arx-1: σ. 14]]',
      },
      theoria: {
        keimena: [
          'Μια μεταβλητη δεσμεύει μνήμη με βάση τον τύπο της· ο τύπος καθορίζει το εύρος τιμών.',
          'Το int αποθηκεύει ακέραια, το float αποθηκεύει δεκαδικά, το boolean δύο καταστάσεις.',
          'Η εκχώρηση αλλάζει την τιμή της μεταβλητής, ενώ η δήλωση δημιουργεί το όνομα για πρώτη φορά.',
        ],
        parapompi: '[[arx-1: σ. 16–18]]',
      },
      paradeigma: {
        keimena: [
          'Άθλημα: να δηλωθούν οι μεταβλητές x = 5, y = 2.5, flag = true και να τυπωθούν οι τιμές τους.',
          'Λύση: οι δηλώσεις εκτελούνται με τη σειρά και κάθε εκχώρηση δίνει τιμή στη μνήμη.',
        ],
        parapompi: '[[arx-1: σ. 21]]',
      },
      pagides: {
        keimena: [
          'Το 5 / 2 δεν κάνει στρογγυλο στην Python· για αυτό υπάρχει το float και η κόλληση όπως 5.0 / 2.',
          'Μην ανακατεύεις δήλωση με εκχώρηση: η δήλωση δημιουργεί, η εκχώρηση αλλάζει.',
          'Ένα boolean δεν δέχεται αριθμό· μην γράφεις flag = 1 αντί για flag = true.',
        ],
        parapompi: '[[arx-1: σ. 24]]',
      },
      syndeseis: {
        keimena: [
          'Χρειάζεται τη βασική έννοια της διαδρομής εκτέλεσης για να καταλάβεις πότε εκτελείται η εκχώρηση.',
          'Συνδέεται με την ενότητα «Έλεγχος ροής», όπου οι τιμές των μεταβλητών αλλάζουν μέσα σε συνθήκες.',
        ],
        parapompi: '[[arx-2: σ. 5]]',
      },
      autoelegchos: {
        keimena: [
          'Ποιος τύπος χρειάζεται για την ηλικία ενός ατόμου και γιατί;',
          'Τι θα εκτυπώσει ο κώδικας x = 3· x = x / 2· print(x); Αιτιολόγησε.',
          'Γιατί η άσκηση x = 5 / 2 δεν δίνει 2.5 στο Python 3;',
        ],
        parapompi: '[[arx-1: σ. 26]]',
      },
    },
  },
  'en-3': {
    tmimata: {
      stoxoi: {
        keimena: [
          'Να διαλέγεις ανάμεσα σε if και elif όταν η συνθήκη είναι αμοιβαία αποκλειστική.',
          'Να γράφεις βρόχους while και for για επανάληψη με γνωστό ή άγνωστο αριθμό επαναλήψεων.',
        ],
        parapompi: '[[arx-2: σ. 3]]',
      },
      eli5: {
        keimena: [
          'Το if είναι προσθιοθήμα στον δρόμο: αν η συνθήκη είναι αληθινή πας δεξιά, αλλιώς συνεχίζεις.',
          'Ο βρόχος είναι ένας κύκλος: κάνεις την ίδια δουλειά όσο η συνθήκη κρατάει.',
        ],
        parapompi: '[[arx-2: σ. 4]]',
      },
      theoria: {
        keimena: [
          'Η επιλεκτική εκτέλεση if/elif/else εκτελεί το πρώτο κλάδημα που ικανοποιεί τη συνθήκη.',
          'Ο βρόχος while επαναλαμβάνει όσο η συνθήκη είναι αληθινή· ο for όσο διατρέχει μια ακολουθία.',
          'Χωρίς σωστή αρχικοποίηση ή επαυξησή τους, οι βρόχοι μπορούν να μην τερματίσουν ποτέ.',
        ],
        parapompi: '[[arx-2: σ. 6–9]]',
      },
      paradeigma: {
        keimena: [
          'Άθλημα: να τυπωθούν οι αριθμοί από 1 έως και 5.',
          'Λύση: for i in range(1, 6): print(i) — το range(1, 6) παράγει 1, 2, 3, 4, 5.',
        ],
        parapompi: '[[arx-2: σ. 12]]',
      },
      pagides: {
        keimena: [
          'Ένα ξεχνημένο range(1, 5) σταματά στο 4· πρόσεξε πότε είναι αποκλειστικό το πάνω όριο.',
          'Μην αφήνεις έναν while χωρίς αλλαγή της μεταβλητής συνθήκης, γιατί κολλάει σε ατέρμονο βρόχο.',
          'Ένα if με δύο ανεξάρτητες συνθήκες πρέπει να είναι elif, αλλιώς το δεύτερο ποτέ δεν εκτελείται.',
        ],
        parapompi: '[[arx-2: σ. 14]]',
      },
      syndeseis: {
        keimena: [
          'Χτίζει πάνω στις μεταβλητές και τους τύπους, γιατί κρίνει τιμές και τις αλλάζει.',
          'Οι βρόχοι χρειάζονται για τις δομές δεδομένων της επόμενης ενότητας, τους πίνακες.',
        ],
        parapompi: '[[arx-2: σ. 17]]',
      },
      autoelegchos: {
        keimena: [
          'Πότε προτιμάς while από for; Δώσε ένα παράδειγμα που ταιριάζει στο υλικό.',
          'Τι θα εκτυπώσει ο κώδικας x = 0· while x < 3: print(x)· x = x + 1;',
          'Γιατί το elif δεν χρειάζεται else μέσα σε αλυσίδα if;',
        ],
        parapompi: '[[arx-2: σ. 15]]',
      },
    },
  },
  'en-4': {
    tmimata: {
      stoxoi: {
        keimena: [
          'Να δημιουργείς πίνακες, να τους γεμίζεις και να διαβάζεις στοιχεία με δείκτη.',
          'Να γράφεις συναρτήσεις με παραμέτρους και τιμή επιστροφής, και να τις καλείς.',
        ],
        parapompi: '[[arx-2: σ. 19]]',
      },
      eli5: {
        keimena: [
          'Ο πίνακας είναι μια σειρά από ντουπιές με αριθμούς, και ο δείκτης λέει σε ποια ντουπιά κοιτάς.',
          'Η συνάρτηση είναι μια μηχανή: της δίνεις πρώτες ύλες και σου επιστρέφει ένα αποτέλεσμα.',
        ],
        parapompi: '[[arx-2: σ. 20]]',
      },
      theoria: {
        keimena: [
          'Ο πίνακας αποθηκεύει στοιχεία ίδιου τύπου με συνεχείς δείκτες ξεκινώντας από το 0.',
          'Η συνάρτηση ομαδοποιεί εντολές, δέχεται παραμέτρους και επιστρέφει τιμή μέσω return.',
          'Οι πίνακες μπορούν να περιέχουν και συναρτήσεις, οπότε η μία δομή χρησιμοποιεί την άλλη.',
        ],
        parapompi: '[[arx-2: σ. 22–24]]',
      },
      paradeigma: {
        keimena: [
          'Άθλημα: να βρεθεί ο μέγιστος αριθμός ενός πίνακα.',
          'Λύση: def max_(p): ... επιστρέφει τη μεγαλύτερη τιμή αφού διατρέξει τον πίνακα μία φορά.',
        ],
        parapompi: '[[arx-2: σ. 28]]',
      },
      pagides: {
        keimena: [
          'Οι δείκτες ξεκινούν από 0, οπότε ο τελευταίος έχει τιμή len(p) - 1· προσοχή στο off-by-one.',
          'Μια συνάρτηση χωρίς return επιστρέφει None· αν χρειάζεται αποτέλεσμα, γράψε ρητά return.',
          'Μην περνάς τον πίνακα «κατά κομμάτια» σε συναρτήσεις που τον τροποποιούν χωρίς να το ξεκινούν.',
        ],
        parapompi: '[[arx-2: σ. 30]]',
      },
      syndeseis: {
        keimena: [
          'Χτίζει πάνω στον έλεγχο ροής: κάθε βρόχος μέσα σε συνάρτηση χρειάζεται if και μεταβλητές.',
          'Χρησιμοποιεί τις μεταβλητές και τους τύπους ως τύπο επιστροφής και ως δείκτες πίνακα.',
        ],
        parapompi: '[[arx-2: σ. 31]]',
      },
      autoelegchos: {
        keimena: [
          'Γιατί ο πρώτος δείκτης είναι 0 και όχι 1;',
          'Τι επιστρέφει μια συνάρτηση που έχει μόνο print χωρίς return;',
          'Δώσε ένα παράδειγμα πίνακα που χρειάζεται βρόχο for.',
        ],
        parapompi: '[[arx-2: σ. 33]]',
      },
    },
  },
};

/** Αναμένει το δοθέντο αριθμό χιλιοστών του δευτερολέπτου, όπως οι ψεύτικες υπηρεσίες του repo. */
function anastoli(chronos_ms: number): Promise<void> {
  return new Promise((lise) => {
    setTimeout(lise, chronos_ms);
  });
}

/** Φορτώνει τον οδηγό της ενότητας· άγνωστο id επιστρέφει σφάλμα DEN_VRETHIKE, όχι κενή οθόνη. */
export async function fortose_odigo(enotita_id: string): Promise<Katastasi<OdigosEnotitas>> {
  const tmimata = ODIGOI_PSEUDOI[enotita_id];
  const enotita = pseudos_xartis().enotites.find((katixeino) => katixeino.id === enotita_id);
  await anastoli(KATHYSTERISI_PSEDON_MS);
  if (tmimata === undefined || enotita === undefined) {
    return sfalma({
      kodikos: 'DEN_VRETHIKE',
      minima: `Δεν βρέθηκε οδηγός για την ενότητα ${enotita_id}.`,
    });
  }
  return etimo({ enotita_id: enotita.id, titlos: enotita.titlos, tmimata: tmimata.tmimata });
}

/** Μία παραπομπή τμήματος οδηγού: tap ανοίγει το PDF στη σωστή σελίδα, αλλιώς μένει απλό κείμενο. */
export function ParapompiTmimatos({ parapompi }: { readonly parapompi: string }) {
  const navigate = useNavigate();
  const analise = analise_parapompi(parapompi);
  if (analise === null) {
    return <p className="odigos-parapompi">{parapompi}</p>;
  }
  return (
    <button
      type="button"
      className="odigos-parapompi odigos-parapompi-koumpi"
      data-testid="odigos-parapompi"
      onClick={() => {
        navigate(diadromi_provolis(analise));
      }}
    >
      {stilise_parapompi(analise)}
    </button>
  );
}

/** Οδηγός μελέτης της ενότητας από τη διαδρομή, με επιστροφή στον χάρτη και άσκηση στον tutor. */
export default function OdigosMeletis() {
  const params = useParams<{ enotitaId: string }>();
  const enotitaId = params.enotitaId ?? '';
  const navigate = useNavigate();
  const [katastasi, setKatastasi] = useState<Katastasi<OdigosEnotitas>>(fortosi());
  const [proseis, setProseis] = useState(0);

  useEffect(() => {
    let mounted = true;
    setKatastasi(fortosi());
    void fortose_odigo(enotitaId).then((apokrisis) => {
      if (mounted) {
        setKatastasi(apokrisis);
      }
    });
    return () => {
      mounted = false;
    };
  }, [enotitaId, proseis]);

  const parametroi = new URLSearchParams({ enotita: enotitaId });
  const kseis = (
    <>
      <IonButton
        size="small"
        fill="outline"
        onClick={() => {
          navigate('/xartis');
        }}
        data-testid="odigos-episostrofh"
      >
        ← Χάρτης
      </IonButton>
      <IonButton
        size="small"
        onClick={() => {
          navigate(`/tutor?${parametroi.toString()}`);
        }}
        data-testid="odigos-tutor"
      >
        Άσκηση στον tutor
      </IonButton>
    </>
  );

  return (
      <div className="odigos-kyrio" data-testid="odigos-ekran">
        <ProskelesioOmonimas
          titlos={
            katastasi.katastasi === 'etimo'
              ? katastasi.dedomena.titlos
              : `Οδηγός ${enotitaId}`
          }
          ypokeimeno="Οδός μελέτης με παραπομπές στο υλικό."
          akseis={kseis}
        />
        <OloniKatastasis
          katastasi={katastasi}
          adeioMinima="Αυτή η ενότητα δεν έχει ακόμη οδηγό."
          epanalipsiMinima="Ξανάφορτο"
          epanalipsi={() => {
            setProseis((palies) => palies + 1);
          }}
        >
          {(odigos) => (
            <>
              {LEKIKIA_TMIMATON.map((kleidi) => {
                const tmima = odigos.tmimata[kleidi];
                return (
                  <section key={kleidi}>
                    <h2 className="odigos-epikefalida" data-testid="odigos-epikefalida">
                      {EPKEFALIDES_TMIMATON[kleidi]}
                    </h2>
                    <div className="odigos-paragrafos">
                      {tmima.keimena.map((keimeno) => (
                        <p key={keimeno}>{keimeno}</p>
                      ))}
                    </div>
                    <ParapompiTmimatos parapompi={tmima.parapompi} />
                  </section>
                );
              })}
            </>
          )}
        </OloniKatastasis>
      </div>
  );
}
