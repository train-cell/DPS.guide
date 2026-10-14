# DPS.guide CLI

Προαιρετικό Node εργαλείο για Windows με Open eClass connector. Είναι ξεχωριστό από την browser/Capacitor εφαρμογή και **δεν παρέχει το κρυπτογραφημένο vault**: τα μαθήματα και τα αρχεία που γράφει κάτω από το `--riza` αποθηκεύονται ως κανονικά αρχεία. Μην το χρησιμοποιείς για προσωπικό υλικό όταν χρειάζεσαι την προστασία του vault.

Οι εντολές δημιουργίας AI (`analysi`, `odigos`, `run`) αποτυγχάνουν ρητά. Το CLI δεν έχει τη συναίνεση Gemini ανά μάθημα ούτε την επιβεβαίωση του ακριβούς prompt που προσφέρει η εφαρμογή. Χρησιμοποίησε την browser/Capacitor εφαρμογή για δημιουργία AI.

## Εκτέλεση

Από τη ρίζα του repository:

```powershell
pnpm install
pnpm --filter @dps/cli build
node apps/cli/dist/index.js --help
```

Στα Windows μπορείς επίσης να χρησιμοποιήσεις το `apps/cli/bin/dps-guide.cmd` μετά το build.

## Εντολές

| Εντολή | Τι κάνει |
|---|---|
| `panepistimia [ΑΝΑΖΗΤΗΣΗ]` | Αναζητά στον κατάλογο ιδρυμάτων/portals. |
| `syndesi` | Συνδέεται στο Open eClass με τα αποθηκευμένα διαπιστευτήρια. |
| `mathimata` | Ανακτά τα μαθήματα του λογαριασμού. |
| `sygxronismos [ΚΩΔΙΚΟΣ]` | Συγχρονίζει ένα μάθημα ή τα επιλεγμένα μαθήματα. |
| `programma` | Υπολογίζει το τοπικό πρόγραμμα μελέτης. |
| `analysi ΚΩΔΙΚΟΣ`, `odigos ΕΝΟΤΗΤΑ_ID`, `run` | Δεν υποστηρίζονται από το CLI επειδή περιλαμβάνουν παραγωγή AI χωρίς την απαιτούμενη επιβεβαίωση αποστολής. |

Οι σημαίες είναι `--riza <διαδρομή>` (προεπιλογή `./data`), `--json`, `--help`/`-h`. Η παλιά σημαία `--montelo` γίνεται δεκτή για συμβατότητα scripts, αλλά δεν ενεργοποιεί AI.

## Σύνδεση

Το CLI αναγνωρίζει Open eClass standard login. Στην προεπιλεγμένη εγκατάσταση, τα διαπιστευτήρια διαβάζονται από τις μεταβλητές `ECLASS_USERNAME` και `ECLASS_PASSWORD`. Η προαιρετική σύνδεση με Windows Credential Manager ενεργοποιείται μόνο αν το περιβάλλον εκτέλεσης παρέχει ξεχωριστά το `@napi-rs/keyring`· το workspace δεν το εγκαθιστά. Το CLI δεν αποθηκεύει credentials. Το `ECLASS_BASE_URL` ή το πεδίο `base_url` στο `<riza>/rythmiseis.json` ορίζει το portal. Το αρχείο ρυθμίσεων δεν πρέπει να περιέχει κωδικούς.

Παράδειγμα προσωρινών μεταβλητών σε PowerShell:

```powershell
$env:ECLASS_USERNAME = 'το-όνομα-χρήστη'
$env:ECLASS_PASSWORD = 'ο-κωδικός'
$env:ECLASS_BASE_URL = 'https://το-portal.example'
node apps/cli/dist/index.js syndesi
```

Η εντολή `syndesi` δεν γράφει credentials στο keyring. Τα μυστικά δεν εμφανίζονται στην έξοδο· το CLI αναφέρει μόνο αν υπάρχουν.

## Αποθήκευση και έξοδος

Τα αρχεία μαθημάτων και ανάλυσης γράφονται κάτω από το `--riza`, μεταξύ άλλων στα `mathimata.json`, `<ΚΩΔΙΚΟΣ>/.spoudes/` και `<ΚΩΔΙΚΟΣ>/arxeia/`. Δεν κρυπτογραφούνται από το CLI.

Με `--json`, το stdout περιέχει μία εγγραφή JSON· τα logs και τα σφάλματα πάνε στο stderr. Κωδικός εξόδου `0` σημαίνει επιτυχία και `1` αποτυχία.

## Έλεγχοι ανάπτυξης

```powershell
pnpm --filter @dps/cli test
pnpm --filter @dps/cli build
pnpm lint
```
