# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.1.0.html).

> **Note:** This changelog covers the release range `contracts-v1` → `v0.1.0`
> (2026-10-10 → 2026-11-03). It was generated from commit history and the
> public-readiness review of 2026-11-03. Unreleased work belongs in
> `docs/requests/` or in a new issue, not here.

## [0.1.1] — 2026-11-18

Adversarial Red Team Hardening, iOS Safe Area Protection & Cryptographic Durability.

### Added
- Dynamic Island and hardware notch protection: safe area insets applied to `.proskelesio` headers in `apps/mobile/src/koinima/koinima.css`.
- Complete CSS design system and D11 token styles for previously unstyled components (`StreakFreezeModal`, `FwnitikiKarta`, `AntallagiDeck`, `Mnemonika`).
- Apple HIG minimum 44x44pt touch targets on all interactive capsule buttons, links, and study check-ins.
- Auto-scroll and sticky action bar in Tutor chat with `messagesEndRef` and safe area bottom insets.
- Masked password modal dialog with show/hide toggle for local encrypted vault backup export and restore.
- iOS `Info.plist` permission strings for `NSMicrophoneUsageDescription` and `NSSpeechRecognitionUsageDescription`.
- MFA / 2FA challenge detection (`periexei_proklisi_mfa`) in university CAS authentication flow.
- Authenticated Additional Data (`dps.cloud-sync.v1/manifest`) binding in AES-256-GCM zero-knowledge cloud sync.
- Dynamic path resolution for course documents in PDF viewer (`${kodikos_mathimatos}/arxeia/`).

### Fixed
- Replaced premature `.unlink()` in Capacitor atomic filesystem storage with safe transactional staging and rollback.
- Eliminated silent vault catalog wipeouts by enforcing fail-closed guards in `loadIndex()` when `index.enc` is corrupt or absent.
- Guarded LMS crawler against downloading HTML login pages or expired session redirects as binary documents.
- Wrapped raw `JSON.parse` with safe `analysise_json` in study map, size calculation, and exam question pipelines.
- Resolved nested `<button>` inside `<Link>` elements in unit map card headers.

## [0.1.0] — 2026-11-03

First public release of DPS.guide (iOS via Sideloadly, CLI for Windows/macOS).

### Added

**Features**

- Open eClass and Moodle LMS connectors (sync courses and files)
- Encrypted local vault: AES-256-GCM with PBKDF2-HMAC-SHA256 (600k iterations)
- Study map (`XartisMathimatos`) with deterministic DAG and prerequisite validation
- Study guides with required sections (goals, ELI5, theory, example, pitfalls, links, self-check)
- Tutor chat grounded in course material (3 modes: `exigisi`, `exetase_me`, `kathodigisi_askisis`)
- Progress tracking with Leitner 5-box system and FSRS-4 spaced repetition
- Exam simulator with past paper matching (`apodosi_exetasis`)
- Study schedule (EDF) with iCalendar export
- Gap radar and BM25 search over course content
- Voice flashcard review, mnemonic engine, streak freeze, P2P encrypted decks
- Zero-knowledge cloud sync
- In-app live telemetry console and study acceleration suite
- Visual DAG, vault backup/restore, progress bars, themata pipeline
- PWA installable icons, offline startup, production build with local bridge
- PDF viewer with deep links into `[[arxeio_id:selida]]` references
- Android debug APK and iOS unsigned IPA build scripts
- Optional Node CLI (`spoudes login`, `spoudes mathimata`, `spoudes sync`, `spoudes analyse`, ...)
- 26+ university course file tree integration

**Documentation**

- Greek README (installation, operation, supported capabilities)
- `README.en.md` — English README (all sections translated)
- `docs/install.md` — iOS installation guide via Sideloadly
- `docs/PLAN.md` — project plan (historical)
- `docs/eclass-protocol.md` — eClass protocol verification log
- `docs/README.md` — documentation index

### Changed

- Minimum Node version bumped to 22.15+ (`package.json`)
- Minimum pnpm version bumped to 10+ (`package.json`)
- Lazy-loading mobile screens by route (faster startup)
- Provider sampling defaults for Gemini 3 and 4
- Clarified localhost bridge pairing code lifetime and trust store usage
- PWA icons now render with full brand background and are installable offline
- Vault: serialized concurrent encrypted access, locked on background
- Local build toolchain documented (JDK 21, Android SDK Platform 36)

### Fixed

- Android offline OCR asset loading
- Moodle token file downloads and service tokens kept out of URLs
- Native vault persistence and onboarding exit
- Internal PDF routes against backslash redirects
- Android sharing restricted to the app cache
- Vault setup and backup transactions (locking/serialization)
- iOS workflow actions for Node 24
- `packages/ai`/`packages/core` dependency resolution

### Security

- Upgraded Zod in core and AI from 4.6.5 to patched 4.6.6 (advisory
  [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5))
- Recorded three moderate dependency advisories, not hidden:
  - React Router redirect parsing — guide/document navigation constructs internal
    routes ([GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6))
  - React Router SSR hydration — no production SSR/hydration path in the app
    ([GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg))
  - minimatch pattern amplification — through Stencil/ts-morph tooling only,
    no production import or user-supplied glob evaluation
    ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249))
- PII/copyright sweep of all history completed before publication
  (see [Public-readiness review, 3 November 2026](docs/Public-readiness-20261103.md))
- No credentials, session cookies or real student accounts found in tracked
  history or sampled IPA artifacts (1,268 blobs scanned, 15.2 MB)
- No CI builds inject LMS/API secrets or signing material

### Deprecated

- None in this release.

### Removed

- Unused packages and UUID tooling (`packages/extract`)

### Not verified (requires live institution access)

The `docs/eclass-protocol.md` fields marked `⚠️ επαλήθευση` are historical from
2026-10-09 and **must be re-verified** before any eClass-specific change.
Verification requires owner access to `https://thales.cs.unipi.gr`:
form fields/`action`/`method`, CAS hidden fields and POST payload,
`Set-Cookie` names and attributes, 30x redirect map, document URLs and
headers, RSS endpoints, mobile API payloads, and session expiry timing.
These are out of scope for agent automation.

## [contracts-v1] — 2026-10-10

Baseline tag for frozen contracts.

### Added

- `packages/core` contracts (zod schemas): `Apotelesma`, `Sfalma`, `Mathima`,
  `Arxeio`, `Selida`, `Tmima`, `Perigramma`, `Enotita`, `XartisMathimatos`,
  `OdigosMeta`, `Exetasi`, ports (`HttpPyli`, `KatevasmaPyli`, `ApothikiPyli`,
  `MystikaPyli`, `LlmPyli`, `EclassPyli`)
- `packages/eclass`, `packages/extract`, `packages/ai`, `packages/pipeline`,
  `packages/adapters-node`, `packages/adapters-capacitor`, `packages/mock-eclass`
- Workspace tooling: `pnpm test`, `pnpm test:lane`, `pnpm typecheck`, `pnpm lint`,
  `pnpm check:ownership` with per-lane ownership guard
- Test doubles: `FakeRologi`, `MnimiApothiki`, `FakeMystika`, `FakeHttp`,
  `MockLlm`
- Shared contract suites for `apothiki`, `http`, `mystika` ports
