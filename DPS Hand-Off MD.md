# Handoff — 100% Statement + Branch Coverage (DPS.guide mobile/src)

**Session**: 100% coverage push (statements + branches on every `.ts`/`.tsx` under `apps/mobile/src/` and `packages/*/src/`)
**Last commit**: `bd725d8` (vault lock/backup tests) — nothing pushed.
**Full coverage command** (run from repo root):
```
npx vitest run --coverage --pool=forks --maxWorkers=1 --exclude 'apps/mobile/src/programma/programma-ui.test.tsx'
```

---

## Current numbers (last full run)

- Statements: **95.8%** (9588/10008)
- Branches: **93.38%** (5574/5969)
- Functions: 91.99%, Lines: 96.1%

### Files NOT at 100% (statements + branches)

| File | Statements | Branches | Status |
|---|---|---|---|
| `apps/mobile/src/othoni/odigos/odigos.tsx` | 93.9% | 87.5% | 11 branches open (see "Remaining work" below) |
| `apps/mobile/src/vault/vault.ts` | 96.4% | 78.0% | ~22% branches open |
| `apps/mobile/src/othoni/simera/simera.tsx` | 65.6% | 19.4% | **no test file** |
| `apps/mobile/src/othoni/tutor/tutor.tsx` | 57.7% | 32.4% | **no test file** |
| `apps/mobile/src/programma/programma.tsx` | 52.3% | 25.6% | **no test file** |
| `apps/mobile/src/othoni/rythisies/rythisies.tsx` | 22.6% | 10.3% | **no test file** |
| `apps/mobile/src/othoni/rythisies/rythisies-ai.tsx` | 21.6% | 11.7% | **no test file** |

All other files (packages + the rest of mobile/src) are at 100% both statements and branches.

---

## What is done

- **Packages** (`core, ai, extract, eclass, adapters-node, adapters-capacitor, pipeline, cli`): 100% / 100%.
- **`xartis.tsx`**: 100% (removed dead code: `epanalipsi` prop, `??` dead chains, dead ternary model, dead `dimiourgeitai` text).
- **`proedri.tsx`** + `proedri.test.tsx` + `eikonidia-panepistimion.tsx`: 100% (removed unreachable guards, keyboard + back tests).
- **`provoli-pdf.tsx`**: 100% (dead null checks removed, render prop pattern).
- **`vault.ts`**: 96.4% statements / 78% branches via `vault-lock.test.ts` (committed).
- **`odigos.tsx`**: 93.9% / 87.5% — dead code removed, new `odigos-branch-coverage.test.tsx` (21 tests).
- `proedri.test.tsx` mocks `../../design/eikonidia-panepistimion.js` PANEPISTIMIA_LISTA (removes `custom`, adds `custom-2` with empty `baseEclass` and `lms: 'auto'`).

---

## Remaining work (in priority order)

### 1. `odigos.tsx` — 11 uncovered branches (closest to done)

Current file states: 169/180 statements, 63/72 branches. Uncommitted changes to `odigos.tsx`, `odigos.test.tsx`, and the new `odigos-branch-coverage.test.tsx` are in the working tree (not committed).

Uncovered branches (V8 paths, [short-circuit, fully-evaluated]):

| Line | Expression | Paths | Notes |
|---|---|---|---|
| 183 | `if (ypovoli) return;` true | [0,9] | Need two clicks in same `onApantisi` window; 100ms delay not enough |
| 365 | `apothiki.rytheseis.onomaMontelou \|\| PROEPILOGI_GEMINI_MONTELO` false | [116,0] | Empty `onomaMontelou` test exists but not covering |
| 377 | `if (mounted)` false | [25,0] | Needs `fortose_odigo_apo_apothiki` resolving slowly + immediate unmount |
| 391 | `if (!kodikosMathimatos \|\| !enotitaId \|\| dimiourgeitai)` true | [0,8] | Empty `enotitaId` test exists — verify coverage |
| 434 | `if (!result.ok)` false | [3,0] | `generateCourseGuide` ok=true mock needs `loaded` re-read to hit `etimo` |
| 574 | cond-expr `sfalma instanceof Error` false | [1,0] | |
| 612 | cond-expr both | [0,0] | Karta catch path |
| 620 | binary-expr `privacy.error !== null && <p>` false | [9,0] | |
| 627 | binary-expr false | [11,0] | |

**Test file**: `apps/mobile/src/othoni/odigos/odigos-branch-coverage.test.tsx` (21 tests). Existing `odigos.test.tsx` has module-scoped helpers `apoidefsi_karos` / `epilexe_optin` — not exported.

**Key helpers/imports**:
- `me_periballon_test(children, periballon)` from `apps/mobile/test-fixtures/periballon-test-provider.ts`
- `ftiaxe_periballon_test` from `apps/mobile/test-fixtures/ftiaxe-test-periballon.ts`
- `MnimiApothiki` in `@dps/core/testing` is a Map-based apothiki; `lista()` lists by prefix.

**Gotchas**:
- `vi.mock` is hoisted — nested `vi.mock` inside a test body pollutes the whole file. Prefer per-test apothiki overrides or module-level mocks.
- RTL `queryByText` does exact match — use regex for substrings.
- `waitFor` callbacks must use `expect()` (throws on failure) to actually retry.
- `analise_erwtisi_autoelegchou` returns `ennoia` derived from keimeno, not the `enotitaId` prop.
- `generateCourseGuide` in `ypiresies/pipeline-analisis.ts` does NOT write the odigos md — `odigos_mathimatos` (in `packages/pipeline/src/bhmata/odigos.ts`) does.
- V8 `binary-expr` paths are [short-circuited, fully-evaluated]; `if` paths are [true, false]. Coverage statement IDs are NOT line numbers — map via `statementMap[sid]['start']['line']`.

### 2. `vault.ts` — ~22% branches

Already covered by `vault-lock.test.ts` (committed `bd725d8`). ~22% of branches remain. `normalizePath('.dps-vault/...')` returns null — vault logical paths must not start with `.dps-vault`. `delete globalThis.navigator` in a node-env test covers lines 29-30 `navigator` branches. This one needs targeted investigation.

### 3. Five files with NO test files (new test files from scratch)

These need brand new test files. None started. Order of difficulty: `rythisies-ai.tsx` (21.6%) < `rythisies.tsx` (22.6%) < `simera.tsx` (65.6%) < `tutor.tsx` (57.7%) < `programma.tsx` (52.3%).

- `simera.tsx`: screen component, uses `xrisiApothekisis()` context.
- `tutor.tsx`: exports `pagesForSection` / `loadCourseContext` (exported for coverage).
- `programma.tsx`: screen with state, needs rendering + interactions.
- `rythisies.tsx` / `rythisies-ai.tsx`: settings screens, use `xrisiPeriballontos()` which throws if no `PeriballonSunexo` — wrap with `me_periballon_test`.

### 4. Cleanup

- Delete `apps/mobile/src/othoni/odigos/tmp-debug5.test.tsx` and `tmp-debug6.test.tsx` (untracked junk).
- Commit `odigos.tsx`, `odigos.test.tsx`, `odigos-branch-coverage.test.tsx` (uncommitted now).

---

## Conventions

- Greek language + English technical terms in tests.
- Conventional commits (`fix(mobile):`, `test(mobile):`, etc.).
- Commit after each working unit; **do NOT push** without permission.
- Failure → diagnose → authorized fix → recheck (max 3 iterations).
- Dead code provably unreachable is removed rather than covered.
- Full coverage run: `npx vitest run --coverage --pool=forks --maxWorkers=1 --exclude 'apps/mobile/src/programma/programma-ui.test.tsx'` (from repo root).

---

## Uncommitted working tree (as of handoff)

```
M apps/mobile/src/othoni/odigos/odigos.test.tsx
M apps/mobile/src/othoni/odigos/odigos.tsx
M apps/mobile/src/othoni/proedri/proedri.tsx
?? apps/mobile/src/othoni/odigos/odigos-branch-coverage.test.tsx
?? apps/mobile/src/othoni/odigos/tmp-debug5.test.tsx
?? apps/mobile/src/othoni/odigos/tmp-debug6.test.tsx
```

Last commit: `bd725d8`.
