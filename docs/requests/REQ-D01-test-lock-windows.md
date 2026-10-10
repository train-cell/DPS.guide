# REQ-D01 — Το wrapper `scripts/test-lock.mjs` αποτυγχάνει σε Windows (spawn vitest ENOENT)

| Πεδίο | Τιμή |
| --- | --- |
| Requesting lane | L12 (Stream D — UI & Mobile, apps/mobile) |
| Ημερομηνία | 2026-10-09 |
| Κατάσταση | **ΕΠΙΛΥΜΕΝΟ** — ο owner εξουσιοδότησε τη Stream D να κλείσει τα W0 blockers (2026-10-09) |
| Λύση | `scripts/test-lock.mjs` (spawn) + νέο `scripts/test-lane.mjs` (lane→paths από το `ownership.json`) |
| Έλεγχος | `pnpm test:lane L12` → 4 files / 79 tests passed, exit 0 |

## Τι ζητείται

Να διορθωθεί το `scripts/test-lock.mjs` ώστε η εντολή `pnpm test:lane <LANE_ID>` να λειτουργεί σε Windows (win32). Προς το παρόν αποτυγχάνει για **όλα** τα lanes, όχι μόνο για το L12.

## Απόδειξη (Evidence)

Εντολή (ρίζα του repo):

```powershell
pnpm test:lane L12
```

Έξοδος (verbatim):

```
$ node scripts/test-lock.mjs vitest run L12
Failed to spawn command: Error: spawn vitest ENOENT
    at ChildProcess._handle.onexit (node:internal/child_process/onexit.js:...)  { errno: -4058, code: 'ENOENT', syscall: 'spawn vitest', path: 'vitest', spawnargs: [ 'run', 'L12' ] }
```

Προς το παρόν χρησιμοποιείται το εξής workaround για επαλήθευση:

```powershell
pnpm exec vitest run <path>
```

## Αιτία (Root cause)

Η γραμμή 99 του `scripts/test-lock.mjs` χρησιμοποιεί:

```js
spawn(command, commandArgs, { stdio: 'inherit', shell: false })
```

Σε Windows το binary του vitest είναι `node_modules\.bin\vitest.cmd`. Ένα απλό `spawn('vitest', ...)` **χωρίς shell** δεν μπορεί να το επιλύσει (τα αρχεία `.cmd` απαιτούν `shell: true` ή πλήρη διαδρομή), επομένως κάθε κλήση `pnpm test` / `pnpm test:lane` αποτυγχάνει σε Windows για όλα τα lanes.

## Προτεινόμενη διόρθωση (suggestion only — integrator decides)

Να γίνεται resolve της εντολής μέσω του `node_modules/.bin`, διατηρώντας άθικτη τη σημασιολογία του σεμαφορίου 4 θέσεων (4-slot semaphore):

- `spawn` με πλήρη διαδρομή προς `vitest.cmd` σε win32, **ή**
- `shell: true` (προσοχή στο escaping των ορισμάτων), **ή**
- `process.execPath` + `node_modules/vitest/vitest.mjs` (πιο portable, αποφεύγει shell εντελώς).

## Επίπτωση αν δεν γίνει

Κανένα lane δεν μπορεί να εκτελέσει τα tests του μέσω του τυπικού `pnpm test` / `pnpm test:lane` σε Windows. Η επαλήθευση γίνεται μόνο με το ασταθές workaround `pnpm exec vitest run <path>`, με αποτέλεσμα να μην ελέγχεται το test-lock mechanism (παράλληλη εκτέλεση, semaphore) που προορίζεται ακριβώς για την αποφυγή διενέξεων μεταξύ lanes.

## Σημειώσεις

- Σχετικό με το πλάνο §3 κανόνα 3: καμία τροποποίηση config/test script επιτρέπεται από τα lanes — όλα γίνονται στην W0. Γι' αυτό το αίτημα καταγράφεται εδώ αντί να διορθωθεί αυθαίρετα.
- `pnpm typecheck` και `pnpm check:ownership` λειτουργούν κανονικά, άρα το πρόβλημα είναι αποκλειστικά στο spawn του test runner.

## Εφαρμοσμένη λύση

Επιλέχθηκε η τρίτη πρόταση (`process.execPath` + JS entry), πιο portable χωρίς shell:

- `scripts/test-lock.mjs`: προστέθηκε `EISODOI_ERGALEION` (vitest / eslint / tsc → JS entry) και η συνάρτηση
  `dialekse_diergasia()`, που τρέχει το JS entry με τον ίδιο τον Node. Οι 4 θέσεις του semaphore έμειναν ανέπαφες.
- `scripts/test-lane.mjs` (νέο): μεταφράζει το `--lane <ID>` σε **φίλτρα διαδρομών** που διαβάζει από το
  `ownership.json`. Χωρίς αυτό το `L12` περνούσε στο vitest ως filename filter και δεν βρισκε αρχεία.

```powershell
pnpm test:lane L12   # -> 4 files / 79 tests passed
```
