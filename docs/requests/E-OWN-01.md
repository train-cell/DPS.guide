# Request E-OWN-01

- **From:** Stream E (integrator review, DoD gate `check:ownership`)
- **Date:** 2026-10-09
- **Blocking:** το DoD gate `pnpm check:ownership --lane stream/E`

## Πρόβλημα

Το `ownership.json` αναφέρει για `stream/E`:

```json
"stream/E": [".github/workflows/**", "packages/adapters-node/**", "packages/adapters-capacitor/**"]
```

Ο `check-ownership.mjs` συγκρίνει `git diff --name-only contracts-v1...HEAD` με αυτά τα globs.
Τα Stream E commits περιέχουν επίσης:

| Αρχείο | Πηγή δικαιώματος |
|---|---|
| `scripts/ios/patch-plist.mjs`, `scripts/ios/patch-plist.test.ts` | Κάρτα L16 (§6.2): `.github/workflows/**`, `scripts/ios/**` |
| `docs/requests/E-L10-01.md`, `docs/requests/E-L16-01.md` | Κανόνας §3.1: «Αν χρειάζεσαι αλλαγή αλλού, γράφεις docs/requests/<ID>.md» |

## Ζητούμενο

```json
"stream/E": [".github/workflows/**", "scripts/ios/**", "packages/adapters-node/**", "packages/adapters-capacitor/**", "docs/requests/**"]
```

(το `docs/requests/**` προτεινόμενο για ΟΛΑ τα streams — είναι ο καθολικός μηχανισμός αιτημάτων του §3.1.)

Μέχρι την εφαρμογή, το gate αποτυγχάνει με 4 files — γνωστό, όχι παράβαση ownership.

## Σχετικό

- §6.2 (πίνακας lanes): `L16 = [".github/workflows/**", "scripts/ios/**"]` — οι κάρτες δεν μεταφέρθηκαν αυτούσιες στα stream rows.
- Το `check-ownership.mjs` (W0 παραδοτέο 7) χρησιμοποιεί `execSync('git diff --name-only contracts-v1...HEAD')` — αν ένα stream κάνει rebase, ελέγχει το rebase-μέρισμα. OK για σειριακά merges.
