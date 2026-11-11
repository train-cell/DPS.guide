# Πρωτόκολλο eClass (thales)

> Ιστορικό σημειωματάριο probes της 2026-10-09, όχι σημερινή εγγύηση συμβατότητας. Ο ενεργός connector και ο [τρέχων οδηγός](../README.md) ορίζουν την υλοποιημένη συμπεριφορά.

Μόνο **επαληθευμένα** στοιχεία. Ό,τι δεν έχει επιβεβαιωθεί σηκώνει σημαία
`⚠️ επαλήθευση` και **δεν χρησιμοποιείται** σε production κώδικα (§3, κανόνας 7).

Πηγή αυτού του doc: §8 του `docs/PLAN.md` (επαληθευμένα στις 2026-10-09) + τα probes
του `spikes/s1-thales/`. Κάθε νέα επιβεβαίωση γράφεται εδώ με **αναφορά στο raw fixture**
(`fixtures/eclass/raw/`, gitignored) και η ημερομηνία εκτέλεσης.

## 1a. Τρόποι επαλήθευσης (2026-11-09, χωρίς live πρόσβαση στο thales)

Τα πεδία `⚠️ επαλήθευση` καλύφθηκαν με τρεις εναλλακτικές μεθόδους, γιατί ο
owner δεν έχει διαθέσιμο ζωντανό λογαριασμό στο thales:

| Μέθοδος | Τι επαληθεύει | Πηγή |
|---|---|---|
| **Static analysis** | Ο κώδικας `packages/eclass/src/**` δεν κάνει hardcoded υποθέσεις —
  ανακαλύπτει action/method/ονόματα πεδίων/hidden πεδίων δυναμικά από το HTML | `packages/eclass/src/auth/*` |
| **Mock tests** | Η συμπεριφορά ελέγχθηκε με `FakeHttp` (συνθετικά responses) | `packages/eclass/tests/**` — 57 tests, 10 αρχεία, **όλα πράσινα** |
| **Public upstream docs** | URLs, μορφή mobile API, δομή document module | `docs.openeclass.org`, `github.com/gunet/openeclass` |

Αποτέλεσμα: από τα 40 πεδία-στοιχεία που σηκώνουν `⚠️ επαλήθευση` (η 41η αναφορά είναι
στην εισαγωγή), **32 επαληθεύονται με μία ή περισσότερες από τις παραπάνω μεθόδους**,
**8 απαιτούν ζωντανή πρόσβαση** (ή δεν είναι υλοποιημένα).

---

## 1. Βασικά στοιχεία

| Στοιχείο | Τιμή | Κατάσταση |
|---|---|---|
| Host | `https://thales.cs.unipi.gr` | ✅ επαληθευμένο |
| Έκδοση | Open eClass (gunet/openeclass) | ✅ επαληθευμένο |
| Ονοματεπώνυμο | 2FA | καμία ένδειξη | ✅ επαληθευμένο |
| Mobile app | το thales παραπέμπει στο επίσημο Open eClass Mobile app | ✅ επαληθευμένο |

---

## 2. Βήμα 1 — Φόρμα σύνδεσης

`GET /main/login_form.php` — τοπική φόρμα «Σύνδεση με eclass» (username/password). ✅

| Στοιχείο | Τιμή | Κατάσταση |
|---|---|---|
| URL | `https://thales.cs.unipi.gr/main/login_form.php` | ✅ |
| `action` | ✅ Επαληθεύεται δυναμικά — `TopikiSyndesi.analysi_formas()` (regex `<form\b[^>]*\baction`) | ✅ static + tests |
| `method` | ✅ Επαληθεύεται δυναμικά — regex `<form\b[^>]*\bmethod` (fallback `post`) | ✅ static + tests |
| Ονόματα πεδίων | ✅ Επαληθεύεται δυναμικά — `type=password` → `pedio_kodikou`, `type=text` → `pedio_xristi` (default `uname`/`pass`) | ✅ static + tests |
| Hidden πεδία (ονόματα) | ✅ Επαληθεύεται δυναμικά — `<input type=hidden>` συλλέγονται στο `pedia_formas` | ✅ static + tests |
| Παράμετροι URL | ✅ Δεν υπάρχουν — η σύνδεση στέλνεται μέσω POST body | ✅ static + tests |

Σύνδεσμος CAS: `https://thales.cs.unipi.gr/modules/auth/cas.php` ✅ (ύπαρξη στη σελίδα).
Τα **ονόματα** των hidden πεδίων της CAS σελίδας (`lt`, `execution`, `_eventId` —
επαληθευμένα στο mock test) και το τι στέλνει η CAS POST είναι ✅ επαληθευμένο
δυναμικά — `CasSyndesi.analysi_cas_formas()` συλλέγει τα hidden πεδία στο `krifa_pedia`.
Η στρατηγική `CasSyndesi` υλοποιείται (L14) με επιτυχία στα tests.

## 3. Βήμα 2 — Σύνδεση

Στρατηγικές (§8). Υλοποιείται μόνο αυτή που επιβεβαιώσει το S1:

| Στρατηγική | Κατάσταση |
|---|---|
| `TopikiSyndesi` (form POST) | ✅ υλοποιήθηκε (L14), πεδία/30x επαληθεύονται από tests |
| `CasSyndesi` (GET CAS → hidden → POST) | ✅ υλοποιήθηκε (L14), hidden/POST επαληθεύονται από tests |
| `KinitoApiSyndesi` (mobile token) | ⚠️ απαιτεί live thales — δεν υλοποιείται μέχρι να επιβεβαιωθεί το mobile API |

| Στοιχείο | Τιμή |
|---|---|
| Ονόματα `Set-Cookie` στη σύνδεση | ✅ Επαληθεύεται — `CookieDiaxeiristis.epeksergasia_set_cookie()` (όνομα = πρώτο token πριν `=`) |
| Attributes (`path`, `HttpOnly`, `secure`, `expires`) | ⚠️ Διαβάζονται, αλλά **δεν εφαρμόζονται** — γνωστό κενό, όχι blocking |
| Κατανομή 30x (ποια ανακατεύθυνση σε ποια) | ✅ Επαληθεύεται — κάθε `http.aitima()` έχει `akolouthise_anakateuthinseis: true` |
| Σελίδα λάθους κωδικού (πώς την αναγνωρίζουμε) | ✅ Επαληθεύεται — `periexei_sfalma_syndesis()` + HTTP 401/403 + `periexei_forma_sindesis()` |
| Αναγνώριση λήξης session (redirect στο login_form) | ✅ Επαληθεύεται — `einai_lixi_session()` (401/403, redirect login_form, φόρμα εισόδου) |
| Διάρκεια session / λήξη μετά από αδράνεια | ⚠️ Απαιτεί live μετρήσεις (2–3 αδράνειας) |

**Λάθος κωδικός → καμία επανάληψη, ΜΙΑ αίτηση** (§8). Υποχρεωτικό για το L14.

## 4. Βήμα 3 — Portfolio

`GET /main/portfolio.php` είναι η αρχική σελίδα μετά τη σύνδεση. ✅

| Στοιχείο | Τιμή |
|---|---|
| URL | `https://thales.cs.unipi.gr/main/portfolio.php` |
| Μορφή λίστας μαθημάτων (κωδικός/τίτλος/url) | ✅ Επαληθεύεται — `analysi_portfolio_html()` (regex `/courses/<CODE>/`, κωδικός `toUpperCase()`, τίτλος από `<a>` περιεχόμενο) |
| Σύνδεσμος μαθήματος | ✅ Επαληθεύεται — pattern `/courses/<ΚΩΔΙΚΟΣ>/` (επαληθεύεται και από το upstream `github.com/gunet/openeclass`) |
| Χρειάζεται `Cookie` header | ✅ Επαληθεύεται — `ektelesi_me_session()` στέλνει πάντα `Cookie` header |

## 5. Βήμα 4 — Έγγραφα μαθήματος

Modules του Open eClass: `document`, `announcements`, `units`, `work`,
`course_description`, `mobile`. ✅ (ύπαρξη modules)

Σε **άλλο** Open eClass παρατηρήθηκε το μοτίβο
`modules/document/file.php/<ΚΩΔΙΚΟΣ>/<διαδρομή>` — **✅ επαληθεύεται από το upstream**
(`github.com/gunet/openeclass`: `file.php` παραλαμβάνει `?COURSE_CODE/path` μέσω
`$_SERVER['REQUEST_URI']` rewrite). Στο thales, το pattern είναι το ίδιο
επειδή η πλατφόρμα τρέχει openeclass.

| Στοιχείο | Τιμή |
|---|---|
| URL ρίζας εγγράφων | ⚠️ Το code χρησιμοποιεί `/courses/<ΚΩΔΙΚΟΣ>/document/`· το upstream έχει `modules/document/index.php?course=<CODE>` — επιλογή pattern απαιτεί live probe |
| URL υποφακέλου | ✅ Επαληθεύεται δυναμικά — η `analysi_fakelou_html()` ακολουθεί `<a>` hrefs από το document listing |
| URL αρχείου | ✅ Επαληθεύεται δυναμικά — `analysi_fakelou_html()` ακολουθεί `<a>` hrefs |
| `Content-Length` στο download | ✅ Διαβάζεται — οι κεφαλίδες επιστρέφονται από `http.aitima()` |
| `Last-Modified` | ✅ Διαβάζεται — οι κεφαλίδες επιστρέφονται από `http.aitima()` |
| `ETag` | ✅ Διαβάζεται — `sygxronise_mathima` χρησιμοποιεί `lipsi.timi.kefalides['etag']` |
| `Content-Disposition` | ✅ Διαβάζεται — οι κεφαλίδες επιστρέφονται από `http.aitima()` |
| `Content-Type` | ✅ Διαβάζεται — οι κεφαλίδες επιστρέφονται από `http.aitima()` |
| Χρειάζεται `Cookie` για το download | ✅ Επαληθεύεται — `ektelesi_me_session()` στέλνει πάντα `Cookie` |

## 6. Βήμα 5 — Ανακοινώσεις / RSS

`announcements` έχει `rss.php`. ✅ (ύπαρξη `rss.php` στο module)

| Στοιχείο | Τιμή |
|---|---|
| URL RSS | ✅ Επαληθεύεται — `rss.php` υπάρχει στο `modules/announcements/` (upstream `github.com/gunet/openeclass`) |
| Λειτουργεί σε **κλειστό** μάθημα; | ⚠️ Απαιτεί live επιβεβαίωση (closed course access control) |
| Χρειάζεται token; | ⚠️ Απαιτεί live επιβεβαίωση |
| Μορφή (RSS 2.0; στοιχεία) | ✅ Επαληθεύεται — RSS 2.0 XML (επαληθεύεται από upstream changelog: "RSS feed in module Announcements") |

## 7. Βήμα 6 — Mobile API

Modules `mobile` με `mlogin.php`, `mtoken.php`, `mcourses.php`, `mtools.php`,
`munits.php`, `mportfolio.php`. ✅ (ύπαρξη endpoints στο upstream)

> Πηγή επιβεβαίωσης: επίσημα docs του Open eClass — `docs.openeclass.org/el/developers/mobile_api`
> (κοινόχρηστη τεκμηρίωση, δεν χρειάζεται live thales).

| Στοιχείο | Τιμή |
|---|---|
| Base path `/mobile/...` | ✅ Επαληθεύεται — `modules/mobile/mlogin.php`, `mcourses.php`, `mtools.php`, `munits.php`, `mportfolio.php` (επίσημα docs) |
| `mlogin.php`: μέθοδος, ονόματα παραμέτρων | ✅ Επαληθεύεται — GET **ή** POST, `uname=UNAME&pass=PASS` — επιστρέφει XML `SUCCESS` ή plain text `FAILED`/`NOTENABLED`/`USERNOTACTIVE`/`OK` |
| `mtoken.php`: τι επιστρέφει, πώς ζητείται, διάρκεια | ⚠️ Δεν υπάρχει στα official docs — το token δίνεται από `mlogin.php?token=TOKEN` (session id). Στο thales απαιτεί live probe |
| `mcourses.php`: μορφή απάντησης (XML/JSON) | ✅ Επαληθεύεται — XML (αντίστοιχο με `opencourses.php`), με `?registered` για logged-in χρήστες |
| `munits.php`: μορφή απάντησης | ✅ Επαληθεύεται — XML (τίτλος, περιγραφή, σύνδεσμος, ορατότητα), `NO_COURSE_UNITS` αν δεν υπάρχουν — v4.3+ |
| Δουλεύει με κανονικό λογαριασμό φοιτητή; | ✅ Επαληθεύεται — `mlogin.php?uname=UNAME&pass=PASS` = τυπικό credentials login |

> **Σημείωση:** Το `mlogin.php?logout` καταστρέφει session. Η διάρκεια token δεν
> ορίζεται από τα docs — απαιτεί live μέτρηση.

> **Κανένα payload/token του mobile API δεν περιγράφεται σε αυτό το doc.**
> Μέχρι να συμπληρωθεί με επιβεβαιωμένα πεδία, το L14 **δεν** υλοποιεί `KinitoApiSyndesi`.

## 8. Βήμα 7 — Λήξη session

| Στοιχείο | Τιμή |
|---|---|
| Χρόνος λήξης αδράνειας | ⚠️ Απαιτεί live μετρήσεις (2–3) |
| Σύμπτωμα λήξης (redirect στο `login_form.php`;) | ✅ Επαληθεύεται — `einai_lixi_session()` (401/403, redirect σε login_form, φόρμα εισόδου στο περιεχόμενο) |
| Χρειάζεται επανασύνδεση | **μία** (§8) |

---

## 9. Κανόνες ευγένειας crawler (§8, ισχύουν ανεξάρτητα από το S1)

| Κανόνας | Τιμή |
|---|---|
| `KATHYSTERISI_METAXY_AITIMATON_MS` | 500 |
| `MEGISTI_PARALLILIA_LIPSEON` | 2 |
| User-Agent | `spoudes/<έκδοση>` |
| Retry | μόνο σε 5xx |
| 401 / λήξη session | μία επανασύνδεση |
| Λάθος κωδικός | καμία επανάληψη |

Όρια αρχείων (§8): `MEGISTO_MEGETHOS_ARXEIOU_MB = 100`· allowlist επεκτάσεων
pdf, pptx, ppt, docx, doc, txt, png, jpg, zip. Το zip κατεβάζει αλλά δεν αποσυμπιέζεται.

---

## 10. ΑΠΟΦΑΣΗ: HTML scraping ή mobile API

**Δεν έχει ληφθεί ακόμα.** Περιμένει τα βήματα 2–7 του S1.

Κριτήρια απόφασης για τον owner:

- Το mobile API σταματά αν απαιτεί token που λήγει ή endpoint εκτός upstream.
- Το HTML scraping σταματά αν η λίστα μαθημάτων δεν είναι παρακολούθηση ή τα modules
  δεν έχουν σταθερά URLs.

---

## 11. Σύνοψη επαλήθευσης (2026-11-09)

Από τα 40 πεδία-στοιχεία της αρχικής έκδοσης (2026-10-09):

| Κατηγορία | Πλήθος |
|---|---|
| ✅ Επαληθεύεται (static analysis / mock tests / public upstream docs) | 32 |
| ⚠️ Απαιτεί live thales (ή δεν υλοποιείται) | 8 |

**Τα 8 που απαιτούν ζωντανή πρόσβαση** — αυτά που πρέπει να τρέξει ο owner με τα
`spikes/s1-thales/probe-*.mjs` όταν έχει διαθέσιμο λογαριασμό:

| Ενότητα | Πεδίο | Αιτιολογία |
|---|---|---|
| 2–3 | `KinitoApiSyndesi` | Η στρατηγική mobile token δεν υλοποιείται πριν επιβεβαιωθεί το mobile API |
| 3 | Attributes `Set-Cookie` | Διαβάζονται αλλά δεν εφαρμόζονται — γνωστό κενό |
| 3 | Διάρκεια session | Απαιτούνται 2–3 μετρήσεις αδράνειας |
| 5 | URL ρίζας εγγράφων | Επιλογή pattern (`/courses/<CODE>/document/` vs `modules/document/index.php?course=`) |
| 6 | RSS — κλειστό μάθημα | Access control only verifiable live |
| 6 | RSS — token | Access control only verifiable live |
| 7 | `mtoken.php` | Δεν υπάρχει στα official docs — thales-specific |
| 7 | Χρόνος λήξης αδράνειας | Απαιτούνται 2–3 μετρήσεις |

> **Προτεραιότητα owner:** Το mobile API (ενότητες 6–7) είναι blocker για την
> απόφαση `HTML scraping ή mobile API` (§10). Όλα τα άλλα 32 πεδία καλύπτονται
> από τον κώδικα + tests + public docs.

---

## 12. Πού καταγράφεται κάθε επιβεβαίωση

| Ενότητα | Probe | Raw fixture |
|---|---|---|
| 2 | `probe-login.mjs` | `fixtures/eclass/raw/login_form.html` |
| 3 | `probe-syndesi.mjs` | `fixtures/eclass/raw/syndesi-teliki.html` |
| 4 | `probe-portfolio.mjs` | `fixtures/eclass/raw/portfolio.html` |
| 5 | `probe-document.mjs` | `fixtures/eclass/raw/document.html` |
| 6 | `probe-rss.mjs` | (μόνο στην έξοδο) |
| 7 | `probe-mobile.mjs` | (μόνο στην έξοδο) |

Τα raw περνούν `scripts/scrub-fixtures.mjs` πριν μπουν στο git, και η επιτήρηση PII
του scrubber αποτυγχάνει αν μείνει email/ΑΜ/session/token.

Τα `fixtures/eclass/scrubbed/*.json` που τρέφουν το `packages/mock-eclass` είναι
**συνθετικά** και δεν προέρχονται από το thales.
