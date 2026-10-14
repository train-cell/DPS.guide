# DPS.guide

Το DPS.guide είναι τοπικός βοηθός μελέτης για Open eClass και Moodle. Κατεβάζει μαθήματα και αρχεία στην ίδια συσκευή, τα κρατά σε κρυπτογραφημένο vault και δημιουργεί χάρτες ύλης, πρόγραμμα μελέτης και tutor chat. Δεν απαιτεί λογαριασμό DPS.guide ή κεντρικό server.

## Τι υποστηρίζεται

- **Open eClass:** τυπική σύνδεση με όνομα χρήστη και κωδικό, ανακάλυψη μαθημάτων και συγχρονισμός αρχείων.
- **Moodle:** τυπική σύνδεση και ανάγνωση μαθημάτων/πόρων. Προαιρετικά δέχεται Moodle Web Services token. Οι API κλήσεις το στέλνουν στο POST body· το Moodle απαιτεί query token μόνο στο προσωρινό URL λήψης αρχείου. Δεν αποθηκεύεται στο ευρετήριο, αλλά ο Moodle server ή ενδιάμεσο proxy μπορεί να καταγράψει URLs. SSO-only login δεν υποστηρίζεται και εμφανίζει σαφές σφάλμα.
- Από την οθόνη **Μαθήματα** μπορείς να επαναλάβεις τον συγχρονισμό· χρησιμοποιούνται τα credentials που είναι αποθηκευμένα στο κρυπτογραφημένο vault της συγκεκριμένης συσκευής.
- **Άλλα portals:** εμφανίζονται στον κατάλογο ως μη υποστηριζόμενα, εκτός αν το URL αναγνωρίζεται ως Open eClass ή Moodle.
- **Windows/macOS:** browser/PWA μέσω localhost.
- **iPhone/Android:** Capacitor app. Τα δεδομένα κάθε εγκατάστασης είναι χωριστά· η μεταφορά γίνεται χειροκίνητα με encrypted backup.
- **OCR:** τοπική αναγνώριση ελληνικών και αγγλικών σε σαρωμένα PDF, με μοντέλα που σερβίρονται από assets της εφαρμογής.

## Απόρρητο και αποθήκευση

Όλα τα δεδομένα και τα αρχεία του μαθήματος κρυπτογραφούνται με AES-256-GCM πριν γραφτούν στο IndexedDB του browser ή στον ιδιωτικό χώρο της native εφαρμογής. Ο master password δεν αποθηκεύεται. Κράτησε το recovery key που εμφανίζεται μία φορά κατά τη ρύθμιση. Αν χαθούν και τα δύο, μόνο encrypted backup με τον δικό του κωδικό μπορεί να μεταφέρει τα δεδομένα.

Στα iPhone, τα αρχεία της εφαρμογής μένουν στο `LibraryNoCloud`, το iCloud Keychain sync είναι απενεργοποιημένο και τα secrets είναι `ThisDeviceOnly`. Σε Android, τα cloud, device-to-device και cross-platform system backups εξαιρούνται. Σε παλιότερη εγκατάσταση iOS, ο υπάρχων φάκελος μεταφέρεται αυτόματα στον νέο ιδιωτικό χώρο. Η μεταφορά δεδομένων μεταξύ συσκευών γίνεται μόνο με το encrypted backup που δημιουργείς εσύ.

Στα νέα vaults, το κλειδί κρυπτογράφησης προστατεύεται με PBKDF2-HMAC-SHA256 600.000 επαναλήψεων. Υπάρχοντα vaults και παλιότερα backups παραμένουν συμβατά.

Αυτή η προστασία αφορά την browser/Capacitor εφαρμογή. Το προαιρετικό CLI είναι ξεχωριστό εργαλείο και αποθηκεύει αρχεία χωρίς κρυπτογράφηση· δεν παρέχει το vault.

Το **encrypted backup** κρυπτογραφείται με ξεχωριστό κωδικό και μπορεί να εξαχθεί/εισαχθεί χειροκίνητα. Η επαναφορά επιτρέπεται μόνο σε καθαρή εγκατάσταση. Τα βιομετρικά κλειδιά δεν συμπεριλαμβάνονται. Στο κινητό, η εξαγωγή ανοίγει το native share sheet· τα αρχεία μαθημάτων παραμένουν στον ιδιωτικό χώρο της εφαρμογής.

Η εφαρμογή κλειδώνει όταν φύγει στο παρασκήνιο. Στις native εφαρμογές μπορείς προαιρετικά να ενεργοποιήσεις Face ID, Touch ID ή Android biometrics· master password και recovery key συνεχίζουν να λειτουργούν.

### AI

- **Ollama:** εκτελείται στον ίδιο υπολογιστή Windows/macOS. Δεν είναι διαθέσιμο στις native εφαρμογές ή από άλλη συσκευή.
- **Gemini:** χρησιμοποιεί δικό σου API key. Ενεργοποιείς τη χρήση ανά μάθημα και επιβεβαιώνεις κάθε νέα, μη αποθηκευμένη δημιουργία πριν σταλεί στην Google. Η επιβεβαίωση εμφανίζει το ακριβές prompt.
- Μπορείς να χρησιμοποιήσεις την εφαρμογή χωρίς AI.

Ο χάρτης δημιουργείται όταν ζητήσεις ανάλυση από την οθόνη του μαθήματος. Ο οδηγός ενότητας δημιουργείται ξεχωριστά όταν τον ζητήσεις. Η εξαγωγή κειμένου και το OCR παραμένουν τοπικά· μόνο οι μη αποθηκευμένες αιτήσεις σε Gemini φεύγουν από τη συσκευή.

## Εκτέλεση σε Windows/macOS

Απαιτούνται Node.js 22.15 ή νεότερο και pnpm 10 ή νεότερο. Στα Windows/macOS, η εκκίνηση χρησιμοποιεί το έμπιστο αποθετήριο πιστοποιητικών του λειτουργικού για τις HTTPS συνδέσεις του localhost bridge. Από τη ρίζα του repository:

```bash
pnpm install
pnpm mobile:dev
```

Άνοιξε `http://127.0.0.1:5173` στον υπολογιστή. Το `localhost`/loopback επιτρέπει τα APIs κρυπτογράφησης του browser.

Ο development server ακούει μόνο στο loopback του υπολογιστή και εμφανίζει pairing code για την τρέχουσα εκτέλεση στο terminal. Πληκτρολόγησέ τον στην browser εφαρμογή για να επιτρέψεις τις LMS/AI συνδέσεις· το bridge δεν εκτίθεται στο δίκτυο και αλλάζει κωδικό σε κάθε επανεκκίνηση. Δεν χρειάζεται certificate ή αλλαγή στο trust store.

Η browser εφαρμογή λειτουργεί στον ίδιο υπολογιστή. Σε iPhone και Android χρησιμοποίησε την Capacitor εφαρμογή, η οποία συνδέεται απευθείας με το LMS· δεν χρειάζεται CA ή τοπικό certificate.

## Native Android και iOS

### Android APK

Χρειάζονται JDK 21, Android SDK Platform 36 και Build Tools 36, μαζί με αποδεκτές άδειες SDK. Εκτέλεσε:

```bash
pnpm mobile:android
```

Το debug-signed APK παράγεται στο `apps/mobile/native-artifacts/DPS.guide-android-debug.apk`. Το APK προορίζεται για εγκατάσταση/sideload· δεν είναι Play Store release.

### iPhone IPA

Η κατασκευή απαιτεί macOS και Xcode 16 ή νεότερο. Εκτέλεσε σε Mac:

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

Το `mobile:build` παράγει την browser/PWA έκδοση στο `apps/mobile/dist`. Η PWA προορίζεται για localhost στον υπολογιστή. Η χρήση από iPhone γίνεται μέσω sideload της native εφαρμογής, χωρίς τοπικό CA. Τα browser notifications λειτουργούν όσο η εφαρμογή είναι ενεργή· αξιόπιστες ειδοποιήσεις όταν η εφαρμογή είναι κλειστή υποστηρίζονται στις native εφαρμογές.

## Δομή

- `apps/mobile`: Ionic React, browser/PWA και Capacitor iOS/Android.
- `apps/cli`: CLI εργαλείο.
- `packages/core`: domain μοντέλα, συμβόλαια και ντετερμινιστικοί υπολογισμοί.
- `packages/eclass`: connectors Open eClass και Moodle.
- `packages/extract`: εξαγωγή περιεχομένου PDF/Office.
- `packages/pipeline`: συγχρονισμός και ανάλυση μαθημάτων.
- `packages/ai`: Gemini και Ollama adapters.
- `packages/adapters-capacitor`, `packages/adapters-node`: adapters πλατφόρμας.

Τα test doubles και τα fixtures είναι απομονωμένα σε test-only packages/exports και test paths. Δεν εισάγονται από την παραγωγική εφαρμογή.

Οι παλιές προδιαγραφές, τα orchestration prompts, τα handoff snapshots και οι αναφορές στα `docs/` είναι ιστορικό αρχείο· δες το [ευρετήριο τεκμηρίωσης](docs/README.md).

## Άδεια

Το DPS.guide διατίθεται υπό την άδεια [MIT](LICENSE).
