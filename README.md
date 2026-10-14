# DPS.guide

Το DPS.guide είναι τοπικός βοηθός μελέτης για μαθήματα σε **Open eClass** και **Moodle**. Συγχρονίζει μαθήματα και αρχεία στη συσκευή, δημιουργεί χάρτη ύλης και οδηγούς μελέτης, υποστηρίζει πρόοδο, πρόγραμμα, υπενθυμίσεις και συνομιλία με tutor. Δεν απαιτεί λογαριασμό DPS.guide ή κεντρικό server.

## Πλατφόρμες

| Πλατφόρμα | Εκτέλεση | Σημειώσεις |
| --- | --- | --- |
| Windows / macOS | Browser/PWA μέσω `localhost` | Τοπικός bridge για LMS και AI. Το Ollama λειτουργεί μόνο στον ίδιο υπολογιστή. |
| Android | Capacitor app (debug APK) | Απευθείας σύνδεση με LMS, κρυπτογραφημένο τοπικό vault και native ειδοποιήσεις. |
| iPhone / iPad | Capacitor app (unsigned IPA) | Sideload και τοπική υπογραφή. Δεν απαιτείται εγκατάσταση CA. |

Τα δεδομένα είναι ανεξάρτητα ανά εγκατάσταση και συσκευή. Δεν υπάρχει αυτόματος συγχρονισμός μεταξύ συσκευών. Η PWA ανοίγει μόνο στον υπολογιστή που την εκτελεί· για χρήση από κινητό εγκατέστησε την Android ή iOS εφαρμογή. Ο browser κρατά αξιόπιστες υπενθυμίσεις μόνο όσο η εφαρμογή παραμένει ενεργή· οι native εφαρμογές μπορούν να προγραμματίζουν τοπικές ειδοποιήσεις στο παρασκήνιο.

## Υποστηριζόμενα LMS

- **Open eClass:** τυπική σύνδεση με όνομα χρήστη και κωδικό, εύρεση μαθημάτων και συγχρονισμός υλικού.
- **Moodle:** τυπική σύνδεση και ανάγνωση μαθημάτων/πόρων. Προαιρετικά υποστηρίζεται Web Services token. SSO-only και ιδιοταγείς ροές σύνδεσης δεν υποστηρίζονται και εμφανίζουν σαφές σφάλμα.
- Άλλα ιδρύματα εμφανίζονται ως μη υποστηριζόμενα, εκτός αν το URL τους αναγνωρίζεται ως τυπικό Open eClass ή Moodle.

Τα διαπιστευτήρια χρησιμοποιούνται για σύνδεση στο LMS που επιλέγεις και αποστέλλονται σε αυτό το ίδρυμα.

Για ορισμένα Moodle downloads, το LMS απαιτεί το token στο προσωρινό URL λήψης. Το token δεν αποθηκεύεται στο ευρετήριο της εφαρμογής, όμως ο Moodle server ή ενδιάμεσο proxy ενδέχεται να καταγράψει το URL.

## AI και ιδιωτικότητα

- Μπορείς να χρησιμοποιείς τις βασικές λειτουργίες χωρίς AI.
- **Ollama:** εκτελείται τοπικά στον ίδιο υπολογιστή Windows/macOS. Δεν είναι διαθέσιμο στις native εφαρμογές.
- **Google Gemini:** χρειάζεται δικό σου API key. Η αποστολή υλικού απαιτεί opt-in για κάθε μάθημα και επιβεβαίωση πριν από κάθε νέα, μη αποθηκευμένη δημιουργία. Η οθόνη επιβεβαίωσης δείχνει το περιεχόμενο που πρόκειται να σταλεί στην Google. Ισχύουν επίσης οι όροι και οι πολιτικές διαχείρισης δεδομένων του παρόχου.
- Η εξαγωγή κειμένου και το OCR PDF γίνονται τοπικά. Σαρωμένα PDF αναγνωρίζονται με τοπικά μοντέλα ελληνικών και αγγλικών.

## Αποθήκευση και προστασία δεδομένων

Το vault κρυπτογραφεί τα δεδομένα και τα αρχεία μαθημάτων με AES-256-GCM πριν αποθηκευτούν στο IndexedDB ή στον ιδιωτικό χώρο της native εφαρμογής. Στα νέα vaults, το κλειδί προστατεύεται με PBKDF2-HMAC-SHA256 600.000 επαναλήψεων. Απαιτείται master password τουλάχιστον 12 χαρακτήρων. Ο master password δεν αποθηκεύεται.

Κατά την αρχική ρύθμιση δημιουργείται recovery key και εμφανίζεται για φύλαξη. Αποθήκευσέ το χωριστά και με ασφάλεια· είναι εναλλακτικός τρόπος ξεκλειδώματος. Τα encrypted backups χρησιμοποιούν ξεχωριστό password και επαναφέρονται μόνο σε καθαρή εγκατάσταση. Η επαναφορά backup είναι ο χειροκίνητος τρόπος μεταφοράς δεδομένων ανάμεσα στις συσκευές. Τα βιομετρικά κλειδιά δεν μπαίνουν στο backup. Τα υπάρχοντα vaults και τα παλιότερα backups παραμένουν συμβατά.

Στα native apps, τα credentials και τα API keys φυλάσσονται στο Keychain/Keystore, τα αρχεία μένουν στον ιδιωτικό χώρο της εφαρμογής και τα cloud/device backups εξαιρούνται. Στο iOS, τα secrets είναι `ThisDeviceOnly` και το iCloud Keychain sync είναι απενεργοποιημένο. Προαιρετικά μπορείς να ενεργοποιήσεις Face ID, Touch ID ή Android biometrics· το master password και το recovery key παραμένουν διαθέσιμα. Στον browser, το vault κλειδώνει όταν η εφαρμογή περάσει στο παρασκήνιο.

Η κρυπτογράφηση προστατεύει τα δεδομένα σε ηρεμία. Όταν το vault είναι ξεκλείδωτο, η εφαρμογή χρειάζεται το κλειδί στη μνήμη της συσκευής· η προστασία αυτή δεν καλύπτει μολυσμένο ή παραβιασμένο λειτουργικό, κακόβουλες επεκτάσεις browser, καταγραφή πληκτρολόγησης ή φυσική πρόσβαση σε ξεκλείδωτη συσκευή. Το προαιρετικό CLI είναι ξεχωριστό εργαλείο και αποθηκεύει αρχεία χωρίς το vault.

### Τοπικός bridge του browser

Η PWA χρησιμοποιεί τοπικό bridge για αιτήματα προς LMS και AI. Ο server ακούει μόνο στο loopback (`127.0.0.1`), απαιτεί pairing code που εμφανίζεται στο terminal και δημιουργεί νέο κωδικό σε κάθε επανεκκίνηση. Χρησιμοποίησε τον κωδικό μόνο στον browser και στον υπολογιστή που εμπιστεύεσαι· αν εκτεθεί, κλείσε και ξανάνοιξε τον server. Τα αιτήματα προς LMS απαιτούν HTTPS· HTTP επιτρέπεται μόνο για Ollama στο localhost. Το bridge δεν είναι server για πρόσβαση κινητού μέσω Wi-Fi.

### Αναφορά ευπαθειών

Μην δημοσιεύεις passwords, API keys, recovery keys, pairing codes, πραγματικά δεδομένα μαθημάτων ή αρχεία backup σε issues, screenshots ή logs. Για αναφορά ευπάθειας χρησιμοποίησε ιδιωτικό κανάλι του repository host, όχι δημόσιο issue. Έλεγχε τις παραγωγικές εξαρτήσεις με `pnpm audit --prod` πριν από διανομή.

## Εκτέλεση σε Windows/macOS

Απαιτούνται **Node.js 22.15+** και **pnpm 10+**. Από τη ρίζα του repository:

```bash
pnpm install
pnpm mobile:start
```

Η `pnpm mobile:start` χτίζει και σερβίρει την production PWA στο `http://localhost:5173`. Κράτησε ανοιχτό το terminal όσο χρησιμοποιείς εφαρμογή, συγχρονισμό LMS ή AI. Το localhost παρέχει το secure browser context που απαιτούν το WebCrypto και το service worker. Σε Windows/macOS, το bridge χρησιμοποιεί το trust store του λειτουργικού για τις upstream HTTPS συνδέσεις.

Για ανάπτυξη με hot reload:

```bash
pnpm mobile:dev
```

Η development έκδοση δεν ενεργοποιεί το offline PWA service worker.

## Native builds

### Android APK

Χρειάζονται JDK 21, Android SDK Platform 36 και Build Tools 36, καθώς και αποδοχή των Android SDK licenses. Εκτέλεσε:

```bash
pnpm mobile:android
```

Το debug-signed APK παράγεται στο `apps/mobile/native-artifacts/DPS.guide-android-debug.apk`. Είναι για εγκατάσταση/sideload, όχι υπογεγραμμένη έκδοση Play Store.

### iOS IPA

Η κατασκευή απαιτεί macOS και Xcode 16+. Εκτέλεσε σε Mac:

```bash
pnpm mobile:ios
```

Παράγεται unsigned IPA στο `apps/mobile/native-artifacts/DPS.guide-unsigned.ipa`, για τοπική υπογραφή και sideload με εργαλείο όπως το Sideloadly. Τα signing keys και τα Apple credentials πρέπει να μένουν εκτός repository.

## Ανάπτυξη και έλεγχοι

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm check:ownership
pnpm mobile:build
pnpm audit --prod
```

Τα mocks και τα fixtures χρησιμοποιούνται μόνο από tests. Τα fixtures LMS είναι συνθετικά· η επιτυχία τους δεν υποκαθιστά ζωντανό έλεγχο σύνδεσης σε κάθε ίδρυμα. Το `mobile:build` παράγει την browser/PWA έκδοση στο `apps/mobile/dist`.

## Δομή repository

- `apps/mobile`: Ionic React, PWA και Capacitor εφαρμογές iOS/Android.
- `apps/cli`: προαιρετικό CLI χωρίς κρυπτογραφημένο vault.
- `packages/core`: domain μοντέλα, συμβόλαια και ντετερμινιστικοί υπολογισμοί.
- `packages/eclass`: connectors Open eClass και Moodle.
- `packages/extract`: εξαγωγή περιεχομένου PDF/Office.
- `packages/pipeline`: συγχρονισμός και ανάλυση μαθημάτων.
- `packages/ai`: Gemini και Ollama adapters.
- `packages/adapters-capacitor`, `packages/adapters-node`: adapters πλατφόρμας.

Οι παλιές προδιαγραφές, τα orchestration prompts και τα handoff snapshots κάτω από το `docs/` είναι ιστορικό υλικό· δες το [ευρετήριο τεκμηρίωσης](docs/README.md).

## Άδεια

Το DPS.guide διατίθεται υπό την άδεια [MIT](LICENSE). Οι τρίτες βιβλιοθήκες διατηρούν τις δικές τους άδειες και notices.
