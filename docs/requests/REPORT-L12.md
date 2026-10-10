# Report L12 — apps/mobile σκελετός UI (Stream D)

- **Κατάσταση:** DONE
- **Branch:** `stream/D` (τοπικό, χωρίς push) · **Base:** `stream/W0` @ `1eeb967` (tag `contracts-v1` μετακινήθηκε εδώ — βλ. «Αιτήματα»)

## Αρχεία που άλλαξαν

4 commits πάνω στο `stream/W0`:

| Commit | Περιεχόμενο |
|---|---|
| `391ee93` feat(mobile): L12 scaffold | Vite entry (`main.tsx`), `design/tokens.css`, `vite-env.d.ts`, smoke e2e, REQ-D01/D02/D03 |
| `152d99c` feat(mobile): L12 foundation | DS tokens + `xromata.ts`, `kathstasi` (loading/empty/error/etimo), `periballon` (DI πύλες), `pseudomata` (fakes) |
| `8b5b861` feat(mobile): L12 the 7 Ionic screens + routing + per-screen e2e | Οθόνες: proedri (Onboarding), mathimata, xartis, odigos, tutor, simera, rythisies · capsule nav · `koinima` (Karta, MetrikosRing, OloniKatastasis, Pilegma) · e2e ανά οθόνη + screenshots iPhone |
| `555bafb` feat(mobile): storage-backed settings/progress via ports, drop dead fakes | `apothiki/` (rythmiseis.json + proodhos.json μέσω `ApothikiPyli`, in-memory fake default) · simera/xartis/rythisies διαβάζουν κατάσταση από context αντί prop-drilled fakes · αφαίρεση provoli-pdf route (I4) · REQ-D04 |

Σε αυτή τη σύνοδο (ολοκλήρωση του WIP που έκοβε το build):
- Αφαιρέθηκε από `navigasi/odoi.tsx` το import/route `provoli-pdf` (I4 ownership, Wave 2) — έσπαγε typecheck (TS2307) και όλο το e2e.
- Το `src/sinchrismos/**` (network sync: HTTP scrape portfolio + regex selectors) **κρατήθηκε εκτός παράδοσης**: I3 scope, S1 δεν επαλήθευσε selectors (§3.7 zero-guessing). Το design και τα 16 tests περιγράφονται στο `docs/requests/REQ-D04-sync-wiring-i3.md`.
- Dead code: `pseudos_rythisies`/`RythisiesPseudes` αφαιρέθηκαν (αντικαταστάθηκαν από `Rytheseis` του apothiki).

## DoD output (τελευταίες γραμμές κάθε εντολής)

```
pnpm test:lane L12     → Test Files 11 passed (11) · Tests 170 passed (170)
pnpm typecheck         → exit 0
pnpm lint              → exit 0
pnpm check:ownership --lane L12 → [OWNERSHIP OK] Lane/Stream "L12" passed (58 files checked)
pnpm test:e2e          → 12 passed (28.0s) — iPhone 13 WebKit, screenshots ανά οθόνη
```

Screenshots: `apps/mobile/e2e/screenshots/{proedri,mathimata,xartis,odigos,tutor,simera,rythisies,efarmogi-etoimi}.png`

## Υποθέσεις / ανοιχτά

1. **Δομή W0 (διόρθωση integrator-level).** Το commit `22165f8` είχε κλείσει W0 blockers (root configs, eslint, test-lock, vitest, lockfile, apps/mobile scaffold configs) πάνω στο `stream/D`, με αποτέλεσμα ο φρουρός ownership να πειράζει ΚΑΘΕ lane. Έγινε split: νέος branch `stream/W0` @ `1eeb967` με τα foundation files, το `stream/D` ανακατασκευάστηκε πάνω του (τελικό tree **byte-identical** με το προηγούμενο — επαληθεύτηκε με `git diff`), και το tag `contracts-v1` **μετακινήθηκε** από `f1b3d6d` στο `1eeb967`. Τα contracts (packages/core/src/contracts/**) δεν άλλαξαν καθόλου· μόνο τα shared contract suites ολοκληρώθηκαν (W0 deliverable 12).
2. `kodikosMathimatos = 'ΠΛΗ201'` στο `ParoxeApothekisis` είναι placeholder ενός μαθήματος· η επιλογή μαθήματος έρχεται με το I3.
3. `proedapes_rytheseis` (baseUrl thales, `gemini-2.5-flash`) είναι default αποθήκευσης, όχι hardcode μέσα σε οθόνη· το μοντέλο διαβάζεται από τις ρυθμίσεις.
4. Οι όροι `aristeies*`/`telies`/`tetagmeni` κληρονομούνται από τα ήδη commited αρχεία του lane (συνέπεια > μετονομασία).

## Αιτήματα αλλαγής contracts / dependencies

1. **Tag:** το remote `refs/tags/contracts-v1` είναι ακόμα στο `f1b3d6d`. Πριν οποιοδήποτε merge lane, ο integrator πρέπει να κάνει `git push origin :refs/tags/contracts-v1 && git push origin refs/tags/contracts-v1` (ή `--force`) μετά το merge του `stream/W0` στο main. Τα lane A/C/E δεν επηρεάζονται (merge-base τους παραμένει `f1b3d6d` — επαληθεύτηκε: 28/61/26 files unchanged).
2. **REQ-D04:** sync wiring ζητάει I1 + L14/L15 + S1 πριν υλοποιηθεί (I3).
3. Κανένα νέο dependency δεν ζητήθηκε· όλα από τα εγκατεστημένα W0.
