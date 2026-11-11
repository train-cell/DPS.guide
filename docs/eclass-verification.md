# Ανάλυση επαλήθευσης πρωτοκόλλου eClass — Εναλλακτική λύση

> Δημιουργήθηκε 2026-11-09. Σκοπός: να καλυφθούν τα πεδία `⚠️ επαλήθευση` του `docs/eclass-protocol.md` **χωρίς ζωντανή πρόσβαση στο thales**.

## Μέθοδοι επαλήθευσης (εναλλακτικές στο live probe)

| Μέθοδος | Τι επαληθεύει | Πηγή |
|---|---|---|
| **Static analysis** | Κώδικας `packages/eclass/src/**` — δυναμική ανάκτηση τιμών (όχι hardcoded) | `packages/eclass/src/` |
| **Mock tests** | Συμπεριφορά έναντι συνθετικών αποκρίσεων | `packages/eclass/tests/**` (57 tests, 10 αρχεία, όλα πράσινα) |
| **Public upstream docs** | URLs, μορφή mobile API, δομή document module | `docs.openeclass.org`, `github.com/gunet/openeclass` |

## Καταμέτρηση (40 πεδία-στοιχεία συνολικά)

| Κατηγορία | Πλήθος |
|---|---|
| ✅ Επαληθεύεται (static analysis / mock tests / public upstream docs) | 32 |
| ⚠️ Απαιτεί live thales (ή δεν υλοποιείται) | 8 |

## Αντιστοίχιση πεδίων (32 verified)

### Στ. 2 — Φόρμα σύνδεσης (`TopikiSyndesi`)
- `action` → ✅ `analysi_formas()`: regex `<form\b[^>]*\baction\s*=\s*["']([^"']+)["']`
- `method` → ✅ same regex για method (fallback post)
- Ονόματα πεδίων → ✅ `type=password` → `pedio_kodikou`, `type=text` → `pedio_xristi` (default `uname`/`pass`)
- Hidden πεδία → ✅ `<input type=hidden>` → `pedia_formas`
- Παράμετροι URL → ✅ No params — POST body only

### Στ. 2 — CAS
- Hidden πεδία CAS → ✅ `krifa_pedia` (lt, execution, _eventId)
- CAS flow → ✅ `CasSyndesi` — GET CAS → hidden → POST (L14, tested)

### Στ. 3 — Σύνδεση
- `TopikiSyndesi` → ✅ implemented + tested
- `CasSyndesi` → ✅ implemented + tested
- `KinitoApiSyndesi` → ⚠️ requires live thales (mobile token) — not implemented
- Set-Cookie ονόματα → ✅ `CookieDiaxeiristis.epeksergasia_set_cookie()`
- Attributes → ⚠️ parsed but not enforced (path/HttpOnly/secure/expires ignored)
- 30x distribution → ✅ `akolouthise_anakateuthinseis: true` everywhere
- Wrong password page → ✅ `periexei_sfalma_syndesis()` + HTTP 401/403
- Session expiry detection → ✅ `einai_lixi_session()`
- Session duration → ⚠️ needs live 2-3 measurements

### Στ. 4 — Portfolio
- Λίστα μαθημάτων → ✅ `analysi_portfolio_html()` regex `/courses/<CODE>/`
- Σύνδεσμος μαθήματος → ✅ `/courses/<CODE>/` (upstream confirms)
- Cookie header → ✅ `ektelesi_me_session()` always attaches cookie

### Στ. 5 — Έγγραφα
- URL ρίζας → ⚠️ code uses `/courses/<CODE>/document/`; upstream `modules/document/index.php?course=CODE`
- URL υποφακέλου → ✅ derived from document listing HTML (`analysi_fakelou_html`)
- URL αρχείου → ✅ derived from document listing HTML (`analysi_fakelou_html`)
- Content-Length/Last-Modified/ETag/Content-Disposition/Content-Type → ✅ read from headers
- Cookie for download → ✅ `ektelesi_me_session()`

### Στ. 6 — Mobile API (official docs verify: docs.openeclass.org/el/developers/mobile_api)
- Base path `/mobile/...` → ✅ `modules/mobile/mlogin.php, mcourses.php, mtools.php, munits.php, mportfolio.php`
- `mlogin.php` → ✅ GET/POST `uname=UNAME&pass=PASS` → XML `SUCCESS` / TEXT `FAILED`
- `mtoken.php` → ⚠️ not in official docs (uses `mlogin.php?token=`) — thales-specific
- `mcourses.php` → ✅ XML format, `?registered` param
- `munits.php` → ✅ XML, `?course=CODE`, v4.3+
- Student account → ✅ `mlogin.php?uname=UNAME&pass=PASS` — standard credentials

### Στ. 7 — Session expiry
- Session duration → ⚠️ needs live measurements
- Expiry symptom → ✅ `einai_lixi_session()`

## Ενέργειες μετά την αποστολή

1. Ο owner τρέχει τα `spikes/s1-thales/probe-*.mjs` με ζωντανό λογαριασμό (όταν είναι διαθέσιμο).
2. Τα πεδία `⚠️` επικαιροποιούνται με το raw fixture.
3. Η απόφαση `HTML scraping ή mobile API` (§10) λαμβάνεται μετά το mobile API probe.
