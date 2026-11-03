# Public-readiness review — 3 November 2026

Reviewed remote main 2372d8e and the other advertised branch/tag, including reachable history. The working checkout was initially nine commits behind GitHub; review used the fetched remote state.

## Publication exposure

- Scanned 1,268 unique historical Git blobs (15.2 MB), including both advertised branches and the contracts-v1 tag, for credential and sensitive-file patterns.
- Reviewed 262 broad literal-secret matches and one synthetic JWT match. They are error/course codes, test data and scrubber fixtures. No actual production credential was identified.
- Reviewed email-like strings and fixture provenance; no real student account, raw LMS dump, session cookie file, signing key or personal course export was found in tracked history.
- Reviewed repository metadata, four closed pull requests and their available discussion metadata. There are no releases, wiki or Pages site.
- Inspected all 20 available CI log archives and five complete unsigned IPA artifact archives (507 nested entries). Two attempted downloads were incomplete and were not counted as inspected. Fourteen of the 19 advertised IPA artifacts were not inspected byte-for-byte; their build provenance/workflow was reviewed.
- All 15 strong credential-pattern matches in those IPA samples came from the same embedded OCR WebAssembly/base64 payload. Its SHA-256 equals the installed tesseract.js-core 7.0.0 vendor file: eef5f8b2f8e20e150680b20adaec4a60babafee3adbe8a94583c81fee46e8680. They are encoded binary coincidences, not configured cloud credentials.
- CI builds do not inject LMS/API secrets or signing material; artifacts are unsigned app builds. Historical CI outputs are not refreshed releases and predate this dependency patch.

No credential revocation or history rewrite was indicated by this review. Pattern scans and sampled artifact inspection do not prove the absence of every possible vulnerability.

## Changes before publication

- Upgrade Zod in core and AI from 4.6.5 to patched 4.6.6, preserving the lockfile and existing APIs. [Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- Include the Noto Sans copyright and full OFL-1.1 notice beside the redistributed font, matching its embedded copyright metadata and [upstream notice](https://github.com/google/fonts/blob/main/ofl/notosans/OFL.txt).
- Freeze only Date in the program-screen tests at the scenario date. The first verification exposed two tests whose “exam tomorrow” fixture was already in the past; this avoids dependence on the current calendar date without changing production scheduling.

## Validation

1594 tests passed, 3 skipped; typecheck and targeted lint passed. The updated production dependency audit reports zero critical/high and three moderate advisories.

Remaining moderate advisories are recorded, not hidden:
- React Router redirect parsing: current guide/document navigation constructs internal routes and encodes resource identifiers; no library-major migration was attempted. [Advisory](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6).
- React Router SSR hydration: the app uses declarative client routing, with no production SSR/hydration path found. [Advisory](https://github.com/advisories/GHSA-337j-9hxr-rhxg).
- minimatch pattern amplification: appears through Stencil/ts-morph tooling; no production application import or user-supplied glob evaluation was found. [Advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).

This is a source-publication review, not a claim that the entire application is bug-free or a fresh native-app release. Raw local audit data stays outside Git; no credentials or downloaded binaries are added to the repository.
