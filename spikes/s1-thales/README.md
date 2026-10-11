# S1 — Spike πρωτοκόλλου thales

Probe scripts για το Open eClass του `thales.cs.unipi.gr`. **Τα τρέχει ΜΟΝΟ ο owner**,
τοπικά, με τα δικά του credentials. Κανένας agent δεν κάνει αίτημα στο thales (§3, κανόνας 6).

## Κανόνες ασφαλείας

- Μηδέν credentials στον κώδικα. Όλα διαβάζονται από env.
- Κανένα script δεν τυπώνει τιμή cookie, session id, token ή κωδικού. Τυπώνει **όνομα cookie + μήκος τιμής + attributes**.
- Τα ακαθάριστα αποθηκεύονται στο `fixtures/eclass/raw/` (gitignored). Πριν μπουν στο git περνούν `scripts/scrub-fixtures.mjs`.
- `probe-syndesi.mjs` κάνει **ΜΙΑ** προσπάθεια σύνδεσης. Λάθος κωδικός = καμία επανάληψη (§8), για να μην κλειδώσει ο λογαριασμός.
- Κάθε probe τυπώνει τι πρέπει να γραφεί στο `docs/eclass-protocol.md`. Ό,τι δεν επιβεβαιώθηκε μένει `⚠️ επαλήθευση`.

## Env

| Μεταβλητή | Χρήση |
|---|---|
| `ECLASS_USERNAME` | όνομα χρήστη (fallback: `SPOUDES_USER`) — μόνο `probe-syndesi` |
| `ECLASS_PASSWORD` | κωδικός (fallback: `SPOUDES_PASS`) — μόνο `probe-syndesi` |
| `ECLASS_COOKIE` | τιμή του `Cookie` header από τον browser — portfolio/document/rss |
| `ECLASS_BASE_URL` | default `https://thales.cs.unipi.gr` |
| `SPOUDES_EDOSI` | έκδοση στο User-Agent, default `0.1.0` |

## Εκτέλεση (owner)

PowerShell:

```powershell
# 1. Φόρμα σύνδεσης (χωρίς credentials)
node spikes/s1-thales/probe-login.mjs

# 2. Δοκιμή σύνδεσης — ΜΙΑ προσπάθεια
$env:ECLASS_USERNAME = '<ονομα>'; $env:ECLASS_PASSWORD = '<kodikos>'
node spikes/s1-thales/probe-syndesi.mjs
Remove-Item Env:ECLASS_PASSWORD, Env:ECLASS_USERNAME

# 3. Portfolio (βάλε το Cookie header από τον logged-in browser)
$env:ECLASS_COOKIE = 'PHPSESSID=...; ...'
node spikes/s1-thales/probe-portfolio.mjs

# 4. Έγγραφα ενός μαθήματος (ρίζα + 1 υποφάκελος + 1 download)
node spikes/s1-thales/probe-document.mjs --mathima PLI101

# 5. RSS ανακοινώσεων (κλειστό μάθημα; token;)
node spikes/s1-thales/probe-rss.mjs --mathima PLI101

# 6. Mobile API (μορφή XML/JSON, token — τιμές token ΔΕΝ τυπώνονται)
node spikes/s1-thales/probe-mobile.mjs --onoma '<ονομα>'
```

Σε κάθε script μπορεί να προστεθεί `--url <πλήρης URL>` για να δοθεί ρητή διαδρομή αντί για την ανακάλυψη.

## Καθαρισμός raw → scrubbed

```bash
node scripts/scrub-fixtures.mjs --in fixtures/eclass/raw/portfolio.html \
                              --out fixtures/eclass/scrubbed/portfolio.html
# έλεγχος χωρίς γράψιμο:
node scripts/scrub-fixtures.mjs --verify-only fixtures/eclass/raw/portfolio.html
```

Τιμές που δεν πιάνονται από τα patterns (π.χ. το όνομα χρήστη) περνιούνται ρητά:
`--onoma`, `--email`, `--am`, `--kodikos`, `--user-id`, ή από το περιβάλλον
(`ECLASS_FULLNAME`, `ECLASS_EMAIL`, `ECLASS_AM`, `ECLASS_PASSWORD`, `ECLASS_USER_ID`).

## Αντιστοίχιση βημάτων S1 (§9)

| Βήμα | Script | Τι γράφεται στο protocol doc |
|---|---|---|
| 1 | `probe-login.mjs` | action/method/πεδία/ονόματα hidden, σύνδεσμος CAS |
| 2 | `probe-syndesi.mjs` | ονόματα cookie, attributes, κατανομή 30x, CAS flow |
| 3 | `probe-portfolio.mjs` | URL portfolio, μορφή λίστας μαθημάτων |
| 4 | `probe-document.mjs` | μορφή URL εγγράφων, headers download, αν χρειάζεται Cookie |
| 5 | `probe-rss.mjs` | λειτουργεί σε κλειστό μάθημα; χρειάζεται token |
| 6 | `probe-mobile.mjs` | `mlogin`/`mtoken`/`mcourses`/`munits`, μορφή απάντησης |
| 7 | — | λήξη session: επανάληψη βήματος 3 μετά από αδράνεια και σημείωση χρόνου |

## Tests

Οι tests του scrubber τρέχουν **εκτός δικτύου**:

```bash
npx vitest run spikes/s1-thales
```

## Σημειώσεις

- Χρησιμοποιείται το `fetch` του Node (>= 18)· το `undici` δεν είναι εγκατεστημένο στο W0.
- Κανένας selector/endpoint δεν θεωρείται επιβεβαιωμένο μέχρι να γραφεί στο `docs/eclass-protocol.md` με αναφορά στο raw fixture.