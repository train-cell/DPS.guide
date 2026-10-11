# Πρωτόκολλο eClass (thales)

Μόνο **επαληθευμένα** στοιχεία. Ό,τι δεν έχει επιβεβαιωθεί σηκώνει σημαία
`⚠️ επαλήθευση` και **δεν χρησιμοποιείται** σε production κώδικα (§3, κανόνας 7).

Πηγή αυτού του doc: §8 του `docs/PLAN.md` (επαληθευμένα στις 2026-10-09) + τα probes
του `spikes/s1-thales/`. Κάθε νέα επιβεβαίωση γράφεται εδώ με **αναφορά στο raw fixture**
(`fixtures/eclass/raw/`, gitignored) και η ημερομηνία εκτέλεσης.

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

| Στοιχείο | Τιμή |
|---|---|
| URL | `https://thales.cs.unipi.gr/main/login_form.php` |
| `action` | ⚠️ επαλήθευση (`probe-login.mjs`) |
| `method` | ⚠️ επαλήθευση |
| Ονόματα πεδίων | ⚠️ επαλήθευση (μη υποθέτει `username`/`password`) |
| Hidden πεδία (ονόματα) | ⚠️ επαλήθευση |
| Παράμετροι URL | ⚠️ επαλήθευση |

Σύνδεσμος CAS: `https://thales.cs.unipi.gr/modules/auth/cas.php` ✅ (ύπαρξη στη σελίδα).
Τα **ονόματα** των hidden πεδίων της CAS σελίδας και το τι ακριβώς στέλνει η CAS
POST είναι ⚠️ επαλήθευση — χωρίς αυτά η στρατηγική `CasSyndesi` δεν υλοποιείται (L14).

## 3. Βήμα 2 — Σύνδεση

Στρατηγικές (§8). Υλοποιείται μόνο αυτή που επιβεβαιώσει το S1:

| Στρατηγική | Κατάσταση |
|---|---|
| `TopikiSyndesi` (form POST) | ⚠️ επαλήθευση πεδίων/30x |
| `CasSyndesi` (GET CAS → hidden → POST) | ⚠️ επαλήθευση |
| `KinitoApiSyndesi` (mobile token) | ⚠️ επαλήθευση |

| Στοιχείο | Τιμή |
|---|---|
| Ονόματα `Set-Cookie` στη σύνδεση | ⚠️ επαλήθευση |
| Attributes (`path`, `HttpOnly`, `secure`, `expires`) | ⚠️ επαλήθευση |
| Κατανομή 30x (ποια ανακατεύθυνση σε ποια) | ⚠️ επαλήθευση |
| Σελίδα λάθους κωδικού (πώς την αναγνωρίζουμε) | ⚠️ επαλήθευση |
| Αναγνώριση λήξης session (redirect στο login_form) | ⚠️ επαλήθευση |
| Διάρκεια session / λήξη μετά από αδράνεια | ⚠️ επαλήθευση (βήμα 7) |

**Λάθος κωδικός → καμία επανάληψη, ΜΙΑ αίτηση** (§8). Υποχρεωτικό για το L14.

## 4. Βήμα 3 — Portfolio

`GET /main/portfolio.php` είναι η αρχική σελίδα μετά τη σύνδεση. ✅

| Στοιχείο | Τιμή |
|---|---|
| URL | `https://thales.cs.unipi.gr/main/portfolio.php` |
| Μορφή λίστας μαθημάτων (κωδικός/τίτλος/url) | ⚠️ επαλήθευση (`probe-portfolio.mjs`) |
| Σύνδεσμος μαθήματος | ⚠️ επαλήθευση — σε άλλο Open eClass κύκλο: `/courses/<ΚΩΔΙΚΟΣ>/`, εδώ **άγνωστο** |
| Χρειάζεται `Cookie` header | ⚠️ επαλήθευση |

## 5. Βήμα 4 — Έγγραφα μαθήματος

Modules του Open eClass: `document`, `announcements`, `units`, `work`,
`course_description`, `mobile`. ✅ (ύπαρξη modules)

Σε **άλλο** Open eClass παρατηρήθηκε το μοτίβο
`modules/document/file.php/<ΚΩΔΙΚΟΣ>/<διαδρομή>` — **⚠️ επαλήθευση στο thales**,
δεν θεωρείται επιβεβαιωμένο.

| Στοιχείο | Τιμή |
|---|---|
| URL ρίζας εγγράφων | ⚠️ επαλήθευση (`probe-document.mjs --mathima <ΚΩΔΙΚΟΣ>`) |
| URL υποφακέλου | ⚠️ επαλήθευση |
| URL αρχείου | ⚠️ επαλήθευση |
| `Content-Length` στο download | ⚠️ επαλήθευση (συνήθως υπάρχει) |
| `Last-Modified` | ⚠️ επαλήθευση |
| `ETag` | ⚠️ επαλήθευση |
| `Content-Disposition` | ⚠️ επαλήθευση |
| `Content-Type` | ⚠️ επαλήθευση |
| Χρειάζεται `Cookie` για το download | ⚠️ επαλήθευση (σημείωση S2) |

## 6. Βήμα 5 — Ανακοινώσεις / RSS

`announcements` έχει `rss.php`. ✅ (ύπαρξη `rss.php` στο module)

| Στοιχείο | Τιμή |
|---|---|
| URL RSS | ⚠️ επαλήθευση (`probe-rss.mjs --mathima <ΚΩΔΙΚΟΣ>`) |
| Λειτουργεί σε **κλειστό** μάθημα; | ⚠️ επαλήθευση |
| Χρειάζεται token; | ⚠️ επαλήθευση |
| Μορφή (RSS 2.0; στοιχεία) | ⚠️ επαλήθευση |

## 7. Βήμα 6 — Mobile API

Modules `mobile` με `mlogin.php`, `mtoken.php`, `mcourses.php`, `mtools.php`,
`munits.php`, `mportfolio.php`. ✅ (ύπαρξη endpoints στο upstream)

| Στοιχείο | Τιμή |
|---|---|
| Base path `/mobile/...` | ⚠️ επαλήθευση στο thales |
| `mlogin.php`: μέθοδος, ονόματα παραμέτρων | ⚠️ επαλήθευση |
| `mtoken.php`: τι επιστρέφει, πώς ζητείται, διάρκεια | ⚠️ επαλήθευση |
| `mcourses.php`: μορφή απάντησης (XML/JSON) | ⚠️ επαλήθευση |
| `munits.php`: μορφή απάντησης | ⚠️ επαλήθευση |
| Δουλεύει με κανονικό λογαριασμό φοιτητή; | ⚠️ επαλήθευση |

> **Κανένα payload/token του mobile API δεν περιγράφεται σε αυτό το doc.**
> Μέχρι να συμπληρωθεί με επιβεβαιωμένα πεδία, το L14 **δεν** υλοποιεί `KinitoApiSyndesi`.

## 8. Βήμα 7 — Λήξη session

| Στοιχείο | Τιμή |
|---|---|
| Χρόνος λήξης αδράνειας | ⚠️ επαλήθευση (2–3 μετρήσεις) |
| Σύμπτωμα λήξης (redirect στο `login_form.php`;) | ⚠️ επαλήθευση |
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

## 11. Πού καταγράφεται κάθε επιβεβαίωση

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