# REQ-D04 — Συγχρονισμός eClass από το apps/mobile (wiring I3): design έτοιμο, κώδικας κρατήθηκε εκτός lane

| Πεδίο | Τιμή |
|---|---|
| Requesting lane | L12 (Stream D — UI & Mobile, apps/mobile) |
| Ημερομηνία | 2026-10-10 |
| Κατάσταση | **BLOCKED** — υλοποιήσιμο μόνο όταν προηγηθεί το I1 (pipeline) και επαληθευτούν τα selectors από το S1 |
| Εξαρτάται από | I1 (packages/pipeline), L14 (eclass/auth), L15 (eclass/crawl), S1 (docs/eclass-protocol.md) |

## Τι ζητάει το L12

Η αρχική έκδοση του module `apps/mobile/src/sinchrismos/**` (συγχρονισμός ενός μαθήματος
μέσα από τις πύλες του περιβάλλοντος: `MystikaPyli` → `HttpPyli` → `ApothikiPyli` →
`RologiPyli` → `KatagrafiPyli`) γράφτηκε και δοκιμάστηκε πλήρως (16 tests, όλα πράσινα,
0 network — πύλες FakeHttp/MnimiApothiki), αλλά **κρατήθηκε εκτός της παράδοσης του L12**
για τους παρακάτω λόγους:

1. **Scope**: Το wiring δικτύου στην εφαρμογή ανήκει στο I3 (`apps/mobile/src/**`,
   Wave 2, εξαρτάται από L12 + I1). Το L12 (κάρτα §9) ορίζει ρητά «Όλες οι οθόνες
   συνδέονται με fake adapters».
2. **Zero guessing (§3.7)**: Η ανάλυση του HTML του `/main/portfolio.php`
   (anchors `courses/<ΚΩΔΙΚΟΣ>`, `units/index.php?...&id=`) είναι επαλήθευμένη μόνο
   γενικά στο §8. Κανένας agent δεν επιτρέπεται να υποθέτει selectors χωρίς fixture στο
   `fixtures/eclass/scrubbed/` και αναφορά στο `docs/eclass-protocol.md`. Το S1
   (spikes/s1-thales) δεν έχει παραδώσει πρωτόκολλο σε κανένα worktree.
3. **Αρχιτεκτονική (§4)**: Στην αρχιτεκτονική ports & adapters, το scraping ανήκει στο
   `packages/eclass` (L14/L15) μέσω του `EclassPyli`, και η ορχήστρωση στο
   `packages/pipeline` (I1). Το apps/mobile καλεί την pipeline· δεν ξαναγράφει τη
   συλλογή.

## Design που δοκιμάστηκε (προς διατήρηση ως spec)

- `trexe_aristeia(periballon, { baseUrl }, kodikos_mathimatos)` →
  `Katastasi<SynediriaPylisis>` με `{ kodikos_mathimatos, titlos, pososto }`.
- Βήματα: (1) `mystika.pare('eclass_kodikos')` → έλλειψη = `SESSION_LIXI` χωρίς network·
  (2) `http.aitima(GET {baseUrl}/main/portfolio.php)` (endpoint επαληθευμένο §8)·
  (3) status εκτός 2xx = `DIKTYO`· (4) parse anchors, εξαγωγή `id=` από
  `units/index.php`, union με αποθηκευμένες ενότητες, ταξινόμηση με `<`/`>` (locale-free)·
  (5) `apothiki.grapse_keimeno('<ΚΩΔΙΚΟΣ>/proodhos.json')`· αποτυχία εγγραφής διαδίδεται
  ως `PROYPOLOGISMOS` — ποτέ ψευδή επιτυχία.
- `pososto_apo_bimata(bimata)` = `clamp(bimata, 0, 5) / 5` — deterministic, ποτέ LLM.
- `dimiourgise_aristeies_nondas(kodikos)` — dry-run χωρίς I/O, τίτλος `[dry-run]`.
- Logs μέσω `KatagrafiPyli` (προειδοποίηση/σφάλμα), χρόνος μόνο από `RologiPyli.tora()`.

## Ζητούμενο από τον integrator

Όταν κλείσουν S1 + L14/L15 + I1, το I3 εφαρμογει το παραπάνω επάνω στο `EclassPyli`
(όχι σε απευθείας HTTP + regex) και με fixtures scrubbed. Ο κώδικας του L12 διαγράφηκε
από το worktree — το παρόν document είναι το handoff.
