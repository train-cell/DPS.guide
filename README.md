# DPS.guide

Το DPS.guide είναι τοπικός βοηθός μελέτης για Open eClass και Moodle. Κατεβάζει μαθήματα και αρχεία στην ίδια συσκευή, τα κρατά σε κρυπτογραφημένο vault και δημιουργεί χάρτες ύλης, πρόγραμμα μελέτης και tutor chat. Δεν απαιτεί λογαριασμό DPS.guide ή κεντρικό server.

## Τι υποστηρίζεται

- **Open eClass:** τυπική σύνδεση με όνομα χρήστη και κωδικό, ανακάλυψη μαθημάτων και συγχρονισμός αρχείων.
- **Moodle:** τυπική σύνδεση και ανάγνωση μαθημάτων/πόρων. Προαιρετικά δέχεται Moodle Web Services token. SSO-only login δεν υποστηρίζεται και εμφανίζει σαφές σφάλμα.
- **Άλλα portals:** εμφανίζονται στον κατάλογο ως μη υποστηριζόμενα, εκτός αν το URL αναγνωρίζεται ως Open eClass ή Moodle.
- **Windows/macOS:** browser/PWA μέσω localhost.
- **iPhone/Android:** Capacitor app. Τα δεδομένα κάθε εγκατάστασης είναι χωριστά· η μεταφορά γίνεται χειροκίνητα με encrypted backup.
- **OCR:** τοπική αναγνώριση ελληνικών και αγγλικών σε σαρωμένα PDF, με μοντέλα που σερβίρονται από assets της εφαρμογής.

## Απόρρητο και αποθήκευση

Όλα τα δεδομένα και τα αρχεία του μαθήματος κρυπτογραφούνται με AES-256-GCM πριν γραφτούν στο IndexedDB του browser ή στον ιδιωτικό χώρο της native εφαρμογής. Ο master password δεν αποθηκεύεται. Κράτησε το recovery key που εμφανίζεται μία φορά κατά τη ρύθμιση. Αν χαθούν και τα δύο, μόνο encrypted backup με τον δικό του κωδικό μπορεί να μεταφέρει τα δεδομένα.

Το **encrypted backup** κρυπτογραφείται με ξεχωριστό κωδικό και μπορεί να εξαχθεί/εισαχθεί χειροκίνητα. Η επαναφορά επιτρέπεται μόνο σε καθαρή εγκατάσταση. Τα βιομετρικά κλειδιά δεν συμπεριλαμβάνονται. Στο κινητό, η εξαγωγή ανοίγει το native share sheet· τα αρχεία μαθημάτων παραμένουν στον ιδιωτικό χώρο της εφαρμογής.

Η εφαρμογή κλειδώνει όταν φύγει στο παρασκήνιο. Στις native εφαρμογές μπορείς προαιρετικά να ενεργοποιήσεις Face ID, Touch ID ή Android biometrics· master password και recovery key συνεχίζουν να λειτουργούν.

### AI

- **Ollama:** εκτελείται στον ίδιο υπολογιστή Windows/macOS. Δεν είναι διαθέσιμο στις native εφαρμογές ή από άλλη συσκευή.
- **Gemini:** χρησιμοποιεί δικό σου API key. Ενεργοποιείς τη χρήση ανά μάθημα και επιβεβαιώνεις κάθε νέα, μη αποθηκευμένη δημιουργία πριν σταλεί στην Google. Η επιβεβαίωση εμφανίζει το ακριβές prompt.
- Μπορείς να χρησιμοποιήσεις την εφαρμογή χωρίς AI.

Ο χάρτης δημιουργείται όταν ζητήσεις ανάλυση από την οθόνη του μαθήματος. Ο οδηγός ενότητας δημιουργείται ξεχωριστά όταν τον ζητήσεις. Η εξαγωγή κειμένου και το OCR παραμένουν τοπικά· μόνο οι μη αποθηκευμένες αιτήσεις σε Gemini φεύγουν από τη συσκευή.

### Browser στο ίδιο Wi‑Fi με iPhone

Ο browser του iPhone χρειάζεται τοπικό HTTPS certificate και τον υπολογιστή διαθέσιμο ως bridge για συγχρονισμό LMS ή AI. Στο terminal εμφανίζεται ένας προσωρινός pairing code· καταχώρισέ τον στο onboarding ή στις ρυθμίσεις. Ο κωδικός αλλάζει σε κάθε επανεκκίνηση του server. Με κλειστό υπολογιστή, ο browser δείχνει μόνο ήδη αποθηκευμένα δεδομένα.

## Εκτέλεση σε Windows/macOS

Απαιτούνται Node.js και pnpm. Από τη ρίζα του repository:

```bash
pnpm install
pnpm mobile:dev
```

Άνοιξε `http://127.0.0.1:5173` στον υπολογιστή. Το `localhost`/loopback επιτρέπει τα APIs κρυπτογράφησης του browser.

Για πρόσβαση από iPhone ή άλλο υπολογιστή στο ίδιο Wi‑Fi, εγκατέστησε το [mkcert](https://github.com/FiloSottile/mkcert) και εκτέλεσε:

```bash
pnpm mobile:dev:lan
```

Το script εγκαθιστά την τοπική CA στο trust store του υπολογιστή, δημιουργεί certificate για τα LAN IPs και εμφανίζει HTTPS URLs μαζί με τη διαδρομή του `rootCA.pem`. Μετέφερε το root certificate στο iPhone, εγκατέστησε και έμπιστευσέ το από τις ρυθμίσεις της συσκευής και άνοιξε το URL που εμφάνισε το script. Τα certificates και private keys μένουν στο `.local/` και δεν πρέπει να κοινοποιούνται.

Στην εφαρμογή, κάνε pairing με τον code που εμφανίζει το terminal. Για λειτουργίες που χρειάζονται δίκτυο, ο υπολογιστής και ο Vite server πρέπει να παραμένουν ενεργοί.

## Native Android και iOS

### Android APK

Χρειάζονται JDK και Android SDK/Build Tools. Εκτέλεσε:

```bash
pnpm mobile:android
```

Το debug-signed APK παράγεται στο `apps/mobile/native-artifacts/DPS.guide-android-debug.apk`. Το APK προορίζεται για εγκατάσταση/sideload· δεν είναι Play Store release.

### iPhone IPA

Η κατασκευή απαιτεί macOS και Xcode. Εκτέλεσε σε Mac:

```bash
pnpm mobile:ios
```

Παράγεται unsigned IPA στο `apps/mobile/native-artifacts/DPS.guide-unsigned.ipa`, για τοπική υπογραφή/εγκατάσταση με εργαλείο όπως το Sideloadly. Δεν χρειάζεται να αποθηκεύσεις signing key στο repository.

## Χρήσιμες εντολές

```bash
pnpm typecheck
pnpm mobile:build
pnpm test
```

Το `mobile:build` παράγει την browser/PWA έκδοση στο `apps/mobile/dist`. Για iPhone browser, το site πρέπει να σερβίρεται από localhost ή έμπιστο HTTPS origin. Τα browser notifications λειτουργούν όσο η εφαρμογή είναι ενεργή· αξιόπιστες ειδοποιήσεις όταν η εφαρμογή είναι κλειστή υποστηρίζονται στις native εφαρμογές.

## Δομή

- `apps/mobile`: Ionic React, browser/PWA και Capacitor iOS/Android.
- `apps/cli`: CLI εργαλείο.
- `packages/core`: domain μοντέλα, συμβόλαια και ντετερμινιστικοί υπολογισμοί.
- `packages/eclass`: connectors Open eClass και Moodle.
- `packages/extract`: εξαγωγή περιεχομένου PDF/Office.
- `packages/pipeline`: συγχρονισμός και ανάλυση μαθημάτων.
- `packages/ai`: Gemini και Ollama adapters.
- `packages/adapters-capacitor`, `packages/adapters-node`: adapters πλατφόρμας.

Τα mocks και fixtures βρίσκονται μόνο σε test paths και χρησιμοποιούνται από τα offline tests.

Οι παλιές προδιαγραφές, τα orchestration prompts και οι αναφορές στα `docs/` είναι ιστορικό αρχείο· δες το [ευρετήριο τεκμηρίωσης](docs/README.md).

## Άδεια

Το DPS.guide διατίθεται υπό την άδεια [MIT](LICENSE).
