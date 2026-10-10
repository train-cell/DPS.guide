# Request E-CAP-01 — Ολοκλήρωση adapters-capacitor + αποκλίσεις (owner/integrator)

Αιτούσα: Stream E (Πλατφόρμα/Adapters). Ημερομηνία: 2026-10-10. Συνέχεια των `E-L10-01/02`, `E-L16-01`, `E-OWN-01`.

---

## 1. Τι έκλεισε (DONE)

| Αντικείμενο | Απόδειξη |
|---|---|
| `packages/adapters-capacitor/**` (L10 storage, L11 http/mystika, katevasma) | 60/60 tests ✅ |
| `spase_set_cookie_joined`: **πραγματικό bug που έπιασαν τα νέα tests** — το native join αφήνει κενό πριν το επόμενο `name=` (`, b=2`) → το cookie αποθηκευόταν με όνομα « b»· πλέον καθαρίζονται οι άκρες κάθε τμήματος (RFC 6265: ασήμαντο κενό) | `http.test.ts` |
| `npx tsc --build packages/adapters-capacitor packages/adapters-node` | exit 0 ✅ |
| `npx tsc --build` (root, ολόκληρο repo) | exit 0 ✅ |
| Πλήρης κάλυψη adapter συμπεριφοράς: atomic write (temp→delete→rename), DEN_VRETHIKE mapping από κωδικούς plugin, recursive `lista`, base64 Android-wrapped, redirect loop με cookie jar (302/307, POST→GET, cross-origin auth strip, max 10 → DIKTYO), SecureStorage round-trip + μηδενισμός μυστικών σε μηνύματα | 5 test files |

Δεν κάλυπτεται (τεκμηριωμένο όριο, όχι σιωπηλό gap): η ακύρωση ΜΕΣΑ σε ενεργό native
download (το plugin δεν δέχεται AbortSignal) και ο εσωτερικός timeout έναντι κρεμασμένου
native call — και στα δύο η συμπεριφορά είναι best-effort όπως περιγράφουν τα σχόλια
του `katevasma.ts`/`http-pyli.ts`. Τα native plugins δεν τρέχουν σε Node tests.

## 2. Αποκλίσεις από τον κανόνα 5 (ZERO CONFIG TOUCH) — με εντολή owner «κλείσε τα»

| Αρχείο | Αιτιολόγηση |
|---|---|
| root `tsconfig.json` (+1 reference στο `packages/adapters-capacitor`) | Χωρίς αυτό το `tsc --build` στο root αγνοεί το πακέτο (το ίδιο αίτημα ζητούσε το C1 αιτ. 4 για το `packages/ai`) |
| `pnpm-lock.yaml` (+110 γραμμές) | Καταγραφή των νέων dependencies της capacitor (`@capacitor/*`, `@aparajita/capacitor-secure-storage`) |

## 3. Εκκρεμή αιτήματα προς owner

1. **`ownership.json`** (E-OWN-01 + C3 αιτ. 1): εξαιρέσεις `docs/requests/**`, `scripts/ios/**` για το `stream/E`· το gate αποτυγχάνει με 6+2 γνωστά αρχεία.
2. **`.gitignore` `*.tsbuildinfo`** (C1 αιτ. 9) — τα build artifacts ξεπηδούν untracked.
3. **`.gitignore` exceptions για fixtures** (C1 αιτ. 8 / C3 αιτ. 2) — εξακολουθεί να μπλοκάρει τα συνθετικά fixtures.
4. `pnpm lint` παραμένει κόκκινο (λείπει `eslint.config.mjs` — W0). Τα νέα tests γράφτηκαν με τους κανόνες του spec (no-explicit-any, ban-ts-comment) προληπτικά.

## 4. Εντολές (τεκμήριο)

| Εντολή | Exit | Αποτέλεσμα |
|---|---|---|
| `npx vitest run --root packages/adapters-capacitor` | 0 | ✅ 60/60 |
| `npx vitest run --root packages/adapters-node` | 0 | ✅ 89/89 |
| `npx tsc --build` (root) | 0 | ✅ |
| `node scripts/check-ownership.mjs --lane stream/E` | 1 | ❌ 6 γνωστά (E-OWN-01) + tsconfig/lockfile/E-CAP-01 |
