# dps-guide — CLI για Windows

Node CLI του **DPS.guide**: σύνδεση στο Open eClass, συγχρονισμός αρχείων μαθημάτων,
ανάλυση υλικού σε χάρτη ενοτήτων, lazy παραγωγή οδηγών και πρόγραμμα μελέτης.
Local-first, χωρίς backend (D2): τα δεδομένα μένουν σε αρχεία κάτω από τη ρίζα (`--riza`).

Η όλη ορχήστρωση (βήματα, cache, idempotency) ανήκει στο `@dps/pipeline`· το CLI είναι
μόνο το «σκέτο»: αναλύει τα ορίσματα, στήνει τα ports με τα Node adapters, καλεί το
σωστό βήμα και τυπώνει το αποτέλεσμα.

## Εντολές

```text
dps-guide <εντολή> [ορίσματα] [σημαίες]
```

| Εντολή | Ορίσματα | Τι κάνει (§4) |
|---|---|---|
| `syndesi` | — | Βήμα 1: σύνδεση με το eClass από τα μυστικά. |
| `mathimata` | — | Βήμα 2: λίστα μαθημάτων → `mathimata.json`. |
| `sygxronismos` | `[KODIKOS]` | Βήμα 3: αρχεία ενός μαθήματος ή, χωρίς κωδικό, όλων των **επιλεγμένων**. |
| `analysi KODIKOS` | `KODIKOS` | Βήματα 4–7: `exagogi → perigramma → xartis → megethi`. |
| `odigos ENOTITA_ID` | `ENOTITA_ID` | Βήμα 8: lazy παραγωγή οδηγού ενότητας. |
| `programma` | — | Βήμα 10: πρόγραμμα μέχρι τις εξετάσεις. |
| `run` | — | Πλήρης ροή: σύνδεση → μαθήματα → συγχρονισμός → ανάλυση. |

## Σημαίες

| Σημαία | Σημασία |
|---|---|
| `--riza <διαδρομή>` | Ρίζα αποθήκευσης. Προεπιλογή: `./data`. |
| `--montelo <όνομα>` | Μοντέλο LLM. Αν λείπει, διαβάζεται το `montelo` του `<riza>/rythmiseis.json`. |
| `--json` | Μία εγγραφή JSON στο stdout. |
| `--help`, `-h` | Βοήθεια (έξοδος 0). |

Οι σημαίες μπορούν να έρθουν πριν ή μετά τα ορίσματα. Μετά το `--` όλα τα tokens
θεωρούνται ορίσματα.

**Δεν υπάρχει hardcoded μοντέλο.** Προτεραιότητα: `--montelo` → `<riza>/rythmiseis.json`
→ σφάλμα με οδηγίες. Οι εντολές που δεν παράγουν κείμενο (`mathimata`, `sygxronismos`,
`programma`) τρέχουν κανονικά χωρίς μοντέλο· αν ζητηθεί από αυτές LLM κλήση,
επιστρέφεται σφάλμα, όχι κρυφό default.

## Μυστικά

Τα διαπιστευτήρια διαβάζονται **μόνο για ανάγνωση** από το `MystikaPyli`:
πρώτα το Windows Credential Manager, με fallback στις μεταβλητές περιβάλλοντος.

| Κλειδί | Μεταβλητή περιβάλλοντος (fallback) | Χρήση |
|---|---|---|
| `eclass_onoma_xristi` | `ECLASS_USERNAME` | Σύνδεση στο eClass |
| `eclass_kodikos` | `ECLASS_PASSWORD` | Σύνδεση στο eClass |
| `llm_api_key` | `GEMINI_API_KEY` | Κλήσεις Gemini |

Παράδειγμα (PowerShell):

```powershell
$env:ECLASS_USERNAME = 'am-12345'
$env:ECLASS_PASSWORD = '...'
$env:GEMINI_API_KEY  = '...'
dps-guide syndesi
```

Η εντολή `syndesi` δεν γράφει ποτέ μυστικά στο keyring· η αποθήκευση διαπιστευτηρίων
αποτελεί ξεχωριστό βήμα onboarding (δεν περιλαμβάνεται ακόμα). Οι τιμές των μυστικών
**ποτέ** δεν εκτυπώνονται — μόνο αν βρέθηκαν ή λείπουν.

## Παραδείγματα

```powershell
# Βοήθεια
dps-guide --help

# Λίστα μαθημάτων
dps-guide mathimata

# Συγχρονισμός ενός μαθήματος
dps-guide sygxronismos MATH101

# Συγχρονισμός όλων των επιλεγμένων (από το mathimata.json)
dps-guide sygxronismos

# Ανάλυση μαθήματος σε ρίζα αποθήκευσης
dps-guide analysi MATH101 --riza D:\dps-data --montelo gemini-2.5-flash

# Οδηγός ενότητας
dps-guide odigos en-3

# Πρόγραμμα, μηχανικά αναγνώσιμο
dps-guide programma --json
```

Έξοδος σε JSON:

```json
{"ok":true,"apotelesma":{"eidos":"mathimata","mathimata":[…]}}
{"ok":false,"sfalma":{"kodikos":"SESSION_LIXI","minima":"Η συνεδρία λήξησε"}}
```

Σε `--json` η έξοδος είναι **μία** εγγραφή στο stdout. Τα logs του pipeline και τα
σφάλματα σε ανθρώπινη λειτουργία πάνε στο stderr, ώστε το stdout να παραμένει
μηχανικά αναγνώσιμο.

## Κωδικοί εξόδου

| Κώδικας | Πότε |
|---|---|
| `0` | Επιτυχία (ή `--help`). |
| `1` | Σφάλμα βήματος, λανθασμένη χρήση, άγνωστη εντολή ή λείπον όρισμα. |

Το CLI δεν πετάει ποτέ εξαίρεση προς τον χρήστη και δεν επιστρέφει ποτέ ψεύτικη
επιτυχία: κάθε αποτυχία εκτυπώνεται ως σφάλμα με τον κωδικό του `Sfalma`
(§3.9). Δεν γίνεται καμία επανάληψη σε λάθος κωδικό eClass.

## Αποθήκευση

Διάταξη §5.3, με ρίζα το `--riza` (προεπιλογή `./data`):

```text
<riza>/
  mathimata.json
  rythmiseis.json              μη-μυστικές ρυθμίσεις (π.χ. montelo, base_url)
  <ΚΩΔΙΚΟΣ_ΜΑΘΗΜΑΤΟΣ>/
    arxeia/…
    .spoudes/
      keimeno/<arxeio_id>.json
      perigrammata/<arxeio_id>.json
      xartis.json
      odigoi/<enotita_id>.md  +  .meta.json
      cache/llm/<hash>.json
```

Το `rythmiseis.json` είναι το μόνο αρχείο που γράφεται/διαβάζεται από το CLI για
ρυθμίσεις, και μόνο για ανάγνωση:

```json
{ "montelo": "gemini-2.5-flash", "base_url": "https://…" }
```

Άγνωστα πεδία αγνοούνται· άθλιο JSON ή `montelo` που δεν είναι μη κενό κείμενο
θεωρείται «μοντέλο μη ορισμένο» (σφάλμα, όχι default).

## Γνωστά περιορισμά (κατάσταση της κάρτας I2)

1. **Δεν υπάρχει `packages/eclass`** (κάρτες L14/L15). Όσο λείπει, το port
   `EclassPyli` επιστρέφει ρητό `MI_YPOSTIRIZOMENO` σε κάθε μέθοδο — τα βήματα που
   χρειάζονται σύνδεση στο eClass (`mathimata`, `sygxronismos`, `analysi`, `run`)
   αποτυγχάνουν με error state, όχι με ψεύτικα δεδομένα.
2. **Το `bin` δείχνει σε αρχείο TypeScript** (`./src/index.ts`), όπως ζητήθηκε. Το
   Node εκτελεί TypeScript χωρίς bundler, **αλλά** δεν ξαναγράφει τις προδιαγραφές
   `.js` σε `.ts`. Άρα η εκτέλεση απαιτεί TypeScript-aware runner· χωρίς νέο
   dependency δεν εκτελείται απευθείας. Δες `docs/requests/H-01.md`.
3. **Το cache του LLM δεν εφαρμόζεται εδώ**· ανήκει στο `@dps/pipeline` (§4), που
   γνωρίζει τη διαδρομή cache ανά μάθημα.

## Ανάπτυξη

```powershell
# tests (χωρίς δίκτυο, χωρίς credentials)
npx vitest run --root apps/cli

# typecheck
npx tsc --build apps/cli

# lint
npx eslint apps/cli
```

Δομή `src/`:

| Φάκελος | Περιεχόμενο |
|---|---|
| `argv/` | Ανάλυση γραμμής εντολής και κείμενο βοήθειας (χωρίς I/O). |
| `eksodos/` | `ExodosEn` και μορφοποίηση ανθρώπινα / JSON. |
| `entoles/` | Μία εντολή = ένα αρχείο· ο πίνακας `ENTOLES` είναι η μοναδική πηγή αλήθειας. |
| `stathimes/` | Στήνιση ports: adapters-node, Gemini μέσω `HttpPyli`, keyring, ρυθμίσεις. |
| `eksodiki.ts` | Dispatcher: argv → εντολή → ports → βήμα → έξοδος. Χωρίς εξαρτήσεις από την κονσόλα. |
| `index.ts` | Σημείο εισόδου (`bin`): μοιράζει τις ροές της διεργασίας. |
