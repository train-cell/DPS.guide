# REQ-D03 — Οι εξαρτήσεις του Stream D (§6.3) δεν είναι εγκατεστημένες: λείπει το scaffold του `apps/mobile`

| Πεδίο | Τιμή |
| --- | --- |
| Requesting lane | L12 (Stream D — UI & Mobile, apps/mobile) |
| Ημερομηνία | 2026-10-09 |
| Κατάσταση | **ΕΠΙΛΥΜΕΝΟ** — ο owner εξουσιοδότησε τη Stream D να κλείσει τα W0 blockers (2026-10-09) |
| Λύση | deps §6.3 εγκαταστημένα (ελεγμένη συμβατότητα) + πλήρες scaffold `apps/mobile` |
| Έλεγχος | `pnpm typecheck` exit 0 · `vite build` exit 0 · `pnpm test:e2e` 3/3 passed |

## Τι ζητείται

Να εγκατασταθούν οι εξαρτήσεις που προβλέπει το πλάνο §6.3 για το Stream D και να ολοκληρωθεί το W0 deliverable 13 (Vite + React + Ionic + `capacitor.config.ts`). Προς το παρόν το `apps/mobile/` δεν έχει ούτε `vite.config.ts`, ούτε `index.html`, ούτε `capacitor.config.ts`, και το `apps/mobile/src/` περιέχει μόνο ένα stub `index.ts`.

## Απόδειξη (Evidence)

Μη εγκατεστημένα πακέτα (επαληθευμένο από τα `node_modules` της ρίζας και του `apps/mobile`):

```
react
react-dom
@ionic/react
@ionic/react-router
react-router
vite
@vitejs/plugin-react
@playwright/test
pdfjs-dist
react-pdf
react-markdown
@capacitor/core
@capacitor/cli
@capacitor/ios
@capacitor/filesystem
@capacitor/file-transfer
@capacitor/local-notifications
@aparajita/capacitor-secure-storage
zod            (σήμερα γίνεται μόνο type-import· υπάρχει μόνο κάτω από packages/core/node_modules)
undici
tough-cookie
@napi-rs/keyring
commander
fastify
```

Εντολές ελέγχου (ρίζα του repo):

```powershell
Test-Path apps/mobile/vite.config.ts        # False
Test-Path apps/mobile/index.html            # False
Test-Path apps/mobile/capacitor.config.ts   # False
Get-ChildItem apps/mobile/src               # μόνο index.ts (stub)
```

## Αιτία (Root cause)

Το πλάνο §6.3 ορίζει το dependency set του κάθε μέρους του συστήματος. Τα παραπάνω πακέτα ανήκουν στα εξής groups και δεν έχουν εγκατασταθεί στο Wave 0:

| Ομάδα εξαρτήσεων | Πακέτα | Plan §6.3 γραμμή |
| --- | --- | --- |
| UI | `react`, `react-dom`, `@ionic/react`, `@ionic/react-router`, `react-router`, `react-pdf`, `react-markdown`, `pdfjs-dist` | UI (React + Ionic + router + PDF/markdown rendering) |
| Capacitor | `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/filesystem`, `@capacitor/file-transfer`, `@capacitor/local-notifications`, `@aparajita/capacitor-secure-storage` | Capacitor / mobile runtime + plugins |
| Tests και ποιότητα | `vite`, `@vitejs/plugin-react`, `@playwright/test` | Build tooling + E2E screenshots |
| Node adapters | `undici`, `tough-cookie`, `@napi-rs/keyring`, `fastify` | HTTP / cookie / keyring / server adapters |
| Βασικά | `zod`, `commander` | Κοινό schema validation + CLI parsing |

Επιπλέον, το W0 deliverable 13 απαιτεί: «Vite + React + Ionic + `capacitor.config.ts`, appId σταθερό π.χ. `io.github.<user>.spoudes`, `plugins.CapacitorHttp.enabled true`, `plugins.CapacitorCookies.enabled true`». Κανένα από αυτά δεν υπάρχει.

## Προτεινόμενη διόρθωση (suggestion only — integrator decides)

1. Εγκατάσταση των παραπάνω πακέτων με τα ακριβή versions που καθορίζει το §6.3 (ή τα αντίστοιχα pinned από τον integrator).
2. Δημιουργία `apps/mobile/vite.config.ts` (React plugin), `apps/mobile/index.html`, και `apps/mobile/capacitor.config.ts` με σταθερό `appId` και με `CapacitorHttp.enabled = true`, `CapacitorCookies.enabled = true`.
3. Προσθήκη των απαραίτητων scripts (`dev`, `build`, `test`, `e2e`) στο `apps/mobile/package.json`.

## Επίπτωση αν δεν γίνει

Το L12 μπορεί να γράψει μόνο framework-agnostic TypeScript (design tokens, three-state UI primitive, DI container). Δεν μπορούν να φτιαχτούν Ionic οθόνες, routing, Capacitor wiring ή Playwright screenshots. Τα I3, I4 και P1 είναι πλήρως μπλοκαρισμένα.

## Σημειώσεις

- Το `zod` χρησιμοποιείται σήμερα μόνο ως type import· η εγκατάστασή του σε root / `apps/mobile` απαιτείται για τυχόν runtime parsing.
- Η ίδια κάρτα W0 που καθυστερεί (deliverables 3, 4, 6, 13) καλύπτει και τα REQ-D01 / REQ-D02 — τα τρία αιτήματα θα πρέπει να εξεταστούν μαζί από τον integrator.
- Το πλάνο §3 κανόνας 3 (καμία εγκατάσταση εξαρτήσεων από τα lanes — όλα στην W0) είναι ο λόγος που το αίτημα καταγράφεται εδώ αντί να εκτελεστεί `pnpm add`.

## Εφαρμοσμένη λύση

Εκδόσεις επιλέχθηκαν μετά από έλεγχο `peerDependencies` στο npm (όχι από τη μνήμη):

| Πακέτο | Έκδοση | Σημείωση ελέγχου συμβατότητας |
|---|---|---|
| react / react-dom | 19.3.0 | peer του `@ionic/react` 9: `^18 \|\| ^19` ✓ |
| @ionic/react | 9.0.7 | |
| @ionic/react-router | 9.0.7 | peer: `react-router >=6.4.0 <7` |
| **react-router-dom** | **6.30.6** | ⚠️ **όχι** 7.18.4· η 7.x σπάει το peer του Ionic router |
| vite / @vitejs/plugin-react | 8.3.4 / 6.1.2 | peer του plugin: `vite ^8.0.0` ✓ |
| react-pdf / pdfjs-dist | 11.0.0 / 6.4.299 | peer του react-pdf: `react ^19` ✓ |
| @capacitor/core, cli, ios | 8.5.3 | |
| @capacitor/filesystem | 8.1.4 | |
| @capacitor/file-transfer | 2.0.6 | ⚠️ εκτός 8.x — η Capacitor 8 δεν απαιτεί την ίδια major |
| @capacitor/local-notifications | 8.3.1 | |
| @aparajita/capacitor-secure-storage | 8.0.1 | ⚠️ επαλήπευση κατά το runtime, όχι μόνο στο peer |
| @types/react, @types/react-dom | 19.3.0 | χωρίς αυτά το `tsc` έδινε TS7016 στο `main.tsx` |
| @playwright/test | 1.64.0 | |
| typescript-eslint / @eslint/js | 8.71.1 / 9.39.5 | `@eslint/js` κλειδώνεται σε 9.x για να ταιριάζει με eslint 9 |

Scaffold (W0 deliverable 13):
- `apps/mobile/index.html` με `class="ion-palette-dark"` και `color-scheme: dark` — **σκούρα μόνο, μηδέν light mode**
- `apps/mobile/vite.config.ts` (React plugin, port 5173)
- `apps/mobile/capacitor.config.ts` με σταθερό `appId: io.github.dpsguide.app` (δεν αλλάζει ποτέ — αλλιώς χάνονται τα δεδομένα),
  `webDir: dist`, `CapacitorHttp.enabled: true`, `CapacitorCookies.enabled: true`
- `apps/mobile/src/main.tsx` (IonApp shell), `src/vite-env.d.ts`, `tsconfig.json` με `lib: [ES2022, DOM, DOM.Iterable]`,
  scripts `dev` / `preview`
- `apps/mobile/playwright.config.ts` + `apps/mobile/e2e/smoke.spec.ts` (iPhone 13 / WebKit, screenshots)

⚠️ Το `@capacitor/cli` 8 δεν εξάγει `defineConfig`· χρησιμοποιήθηκε `const config: CapacitorConfig = {...}`.

### Δεύτερο εύρημα, διορθωμένο εδώ (D11)
Το πρώτο screenshot έδειξε **λευκό background** — τα tokens δεν καταναλώνονταν από κανένα element και το Ionic
έβρισκε τα defaults του. Διορθώθηκε με base layer στο `tokens.css` (`html, body, ion-app` + μεταβλητές
`--ion-*` μέσα στο **ίδιο** `:root` block, ώστε να μην παραβιάζεται ο φρουρός «ένας :root») και προστέθηκε
e2e regression test που ελέγχει ότι το υπολογισμένο `background-color` είναι `rgb(11, 11, 12)`.
