# fixtures/eclass

Υλικό για το mock του Open eClass (L13) και για τα probe scripts του S1.

## raw/ (gitignored)

Πλήρεις αποθηκευμένες απαντήσεις από το thales, με cookies/session. **Ποτέ στο git.**
Παράγεται τοπικά, μόνο από τον owner, με τα `spikes/s1-thales/probe-*.mjs`.

## scrubbed/

Μετά το `node scripts/scrub-fixtures.mjs`. Πρέπει να περνά τον έλεγχο PII του script
(`episkeps_to_scrub`) και τον χειροκίνητο έλεγχο του owner πριν μπει σε commit.

Τα αρχεία σε `scrubbed/` σήμερα είναι **100% ΣΥΝΘΕΤΙΚΑ**: κανένα πραγματικό υλικό μαθήματος,
κανένα πραγματικό ΑΜ, όνομα ή email. Το mock του L13 τρέφεται από αυτά.

| Αρχείο | Περιεχόμενο |
|---|---|
| `mathimata.json` | `Mathima[]` (3 συνθετικά μαθήματα: PLI101, PLI200, ANA100) |
| `dentro/<KODIKOS>.json` | `KomvosArxeiou[]`, δέντρο εγγράφων ανά μάθημα (BFS, ρίζα πρώτα) |

Το `scrubbed/` είναι source of truth για τα tests του `packages/mock-eclass` και των
L14/L15. Οποιαδήποτε αλλαγή εδώ είναι breaking change για αυτά τα tests.