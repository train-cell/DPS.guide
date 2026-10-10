# REPORT-P1 + REQ-D06 — Ολοκλήρωση κάρτας P1 και εκκρεμότητες (owner/integrator)

Αιτούσα: Stream D (UI & Mobile). Ημερομηνία: 2026-10-10. Συνέχεια των `REPORT-L12`, `REPORT-I3`, `REQ-D01..D05`.

---

## 1. REPORT-P1 — κατάσταση DONE

| Κριτήριο | Απόδειξη |
|---|---|
| `npx tsc --build` (root) | exit 0 ✅ |
| `npx vitest run --root apps/mobile` | ✅ 257/257 (20 files) |
| `npx playwright test` (εντός `apps/mobile`) | ✅ 18/18 (iPhone 13 viewport) |
| `npx eslint apps/mobile` | exit 0 ✅ |
| `node scripts/check-ownership.mjs --lane stream/D` | ✅ OK (85 files) |

Παραδοτέα P1 (`apps/mobile/src/programma/**`): τύποι (`programma-typoi.ts`), βοηθητικοί
καθαροί (`programma-vohthia.ts` + 25 tests), οθόνη (`programma.tsx`, CSS tokens
της DS), route `/programma` + κάρτας σύνδεσης από Ρυθμίσεις.

## 2. Τι έσπαγε και γιατί (δεν ήταν ορατό πριν)

Το P1 βρισκόταν στη μέση — working tree σπασμένο, έτοιμο για commit αλλά με κόκκινα όλα:

| Σύμπτωμα | Αιτία | Λύση |
|---|---|---|
| `tsc` TS2724/TS2552 | `DIALOMI_RYTHMSEON` (τυπογραφικό) απέναντι στο `DIALOMI_RYTHMISEON` των χρηστών | rename της δήλωσης |
| `tsc` TS2305 | `PROEDAFO_TEMPLATE` οριζόταν στο `programma-vohthia.ts` αλλά γινόταν import από το `programma-typoi.js` | διόρθωση import στα 2 σημεία |
| tests: `istoriko`-style ονόματα | `synoloka_lepta_template` vs `synolika_lepta_template` | διόρθωση |
| tests: «Cannot destructure 'basename'» | η οθόνη Ρυθμίσεις χρησιμοποιεί `Link /programma`· το static render χωρίς Router έπεφτε | `MemoryRouter` στο test helper (το Provider ελλείπει επίτηδες) |
| vitest μάζευε τα Playwright specs | δεν υπήρχε `apps/mobile/vitest.config.ts` → «Playwright Test did not expect test() to be called here» | νέο `vitest.config.ts` (μόνο `src/**/*.test.{ts,tsx}`) |
| test P1: imports από λάθος module | `IMERES_EVDOMADAS`/`MEGISTA_LEPTA_IMERAS`/`ONOMATA_MINON`/`TROPOI_EXETASIS`/`ETIKETES_TROPON` ορίζονται στο `programma-typoi.ts` | διαχωρισμός imports (typoi vs vohthia) |
| test rythisies: ελλιπές `Rytheseis` | η P1 πρόσθεσε 4 νέα υποχρεωτικά πεδία | συμπλήρωση στο test fixture |

## 3. ΝΕΑ αιτήματα

1. **`@playwright/test` λείπει από ΟΛΑ τα package.json** (§6.3 το απαιτεί στα tests).
   Τα `e2e/*.spec.ts` το import-άρουν· οι browsers είναι εγκατεστημένα τοπικά, άρα τα
   e2e τρέχουν μόνο με την προσωρινή `npx` ανάλυση. Ζητείται εγκατάσταση στο
   `apps/mobile` devDeps (ή root).
2. **`*.tsbuildinfo` στο `.gitignore`** (C1 αιτ. 9) — εξακολουθεί να λείπει.
3. `pnpm test:lane <ID>` για το mobile: δουλεύει στο branch της D (W0 fix 9246e5e),
   αλλά δεν έχει γίνει merge στα υπόλοιπα branches.

## 4. Commits (stream/D)

| Commit | Περιεχόμενο |
|---|---|
| `e479a64` | fix: DIALOMI_RYTHMISEON, PROEDAFO_TEMPLATE, MemoryRouter, test fixes |
| `feat(mobile): P1` | οθόνη προγράμματος + route + βοηθοί + tests |
| `test(mobile)` | vitest.config.ts (e2e εκτός vitest) |
