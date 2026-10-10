# Report I3 — mobile wiring (Stream D)

- **Κατάσταση:** DONE (με BLOCKED το κομμάιο Capacitor adapters — REQ-D05)
- **Branch:** `stream/D` @ `apps/mobile/src/**` (εκτός `provoli-pdf/`, `tutor/`, `programma/`, `eidopoiiseis/`)

## Αρχεία που άλλαξαν

| Commit | Περιεχόμενο |
|---|---|
| `feat(mobile): I3 screens read the §5.3 storage layout through the ports` | `ypiresies/` (ανάγνωστες xartis.json, mathimata.json, odigoi/*.md+meta, synomilies/*.jsonl μέσω `ApothikiPyli`), parser Markdown για τους 7 υποχρεωτικούς τμήτες, seed με οδηγούς/συνομιλίες, οθόνες xartis/simera/mathimata/odigos/tutor/proedri πάνω στη θύρα, αφαίρεση των in-memory fake loaders, copy των bytesof πριν το pdf.js getDocument |

## DoD output (τελευταίες γραμμές κάθε εντολής)

```
pnpm test:lane I3   → Test Files 19 passed (19) · Tests 236 passed (236)
pnpm typecheck      → exit 0
pnpm lint           → exit 0
pnpm check:ownership --lane I3 → [OWNERSHIP OK] (73 files checked)
pnpm test:e2e       → 18 passed (2 συνεχόμενες εκτελέσεις, σταθερό — άρθηκε το race του pdf.js worker detach)
```

## Υποθέσεις / ανοιχτά

1. **Απουσία αρχείου = κενή κατάσταση, χαλασμένο αρχείο = σφάλμα.** Οι οδηγοί παράγονται
   lazily (§4 βήμα 8), άρα ενότητα χωρίς οδηγό είναι φυσιολογικό κενό. Δεν επιστρέφεται
   ποτέ ψεύτικο περιεχόμενον (κανόνας §3.9).
2. **Τα chars `aristeies*`/`telies`/`tetagmeni`** κληρονομούνται από τα ήδη commited
   αρχεία του lane (συνέπεια > μετονομασία).
3. **Τutor:** το «μυαλό» του tutor παραμένει ο ψεύτικος αντιστοιχιστής λέξεων-κλειδιών·
   η αντικατάσταση με LLM είναι η κάρτα T1 (Wave 3). Το context (ενότητα + ιστορικό)
   έρχεται πλέον από τα αρχεία.
4. **Onboarding:** μετά την αποθήκευση διαπιστευτηρίων διαβάζει μαθήματα από το
   `mathimata.json`· σε πραγματικό περιβάλλον πριν τον πρώτο συγχρονισμό εμφανίζει κενό.

## Αιτήματα αλλαγής contracts / dependencies

- **REQ-D05**: Capacitor adapters (storage/http/mystika) — εξαρτώνται από το lane E,
  μπλοκαρισμένο σε dependencies. Το σήμα στο περιβάλλον είναι έτοιμο (`deigma: false`).
- **REQ-D04** (προηγούμενο): συγχρονισμός eClass από την εφαρμογή (I1 + L14/L15 + S1).
- Κανένα νέο dependency δεν ζητήθηκε.
