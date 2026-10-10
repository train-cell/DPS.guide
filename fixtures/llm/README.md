# fixtures/llm

Μηνύματα LLM σε αρχεία, για tests χωρίς network (§3 κανόνας 5, §11 «LLM pipeline → MockLlm»).
Το όνομα κάθε αρχείου είναι το SHA-256 της κανονικής σειράς του αιτήματος που το παρήγαγε.

## Μορφή αρχείου

Το ίδιο πλαίσιο (envelope) χρησιμοποιείται **και** από την αποθήκευση `cache/llm/<hash>.json`
και από τα fixtures, ώστε ένα αρχείο να σερβίρει και τα δύο:

```json
{
  "odos_kleidiou": "dps.llm.cache.v1",
  "hash": "<64 πεζά hex>",
  "montelo": "<μοντέλο>",
  "ekdosi_prompt": "<έκδοση prompt>",
  "typos_aitimatos": "json" | "keimeno",
  "imeras_athinas": "YYYY-MM-DD",
  "timi": <η απάντηση>
}
```

## Κανονική σειρά που υπολογίζεται (αυτούριο ορισμός, μην αλλάζει χωρίς νέο `ODOS_KLEIDIOU`)

Ο κλειδί είναι `sha256_heks(kanonikos_ilogos(montelo, aitima))` από το
`packages/ai/src/cache/kleidi.ts`. Η `kanonikos_ilogos` είναι **JSON.stringify** ενός πίνακα 4 στοιχείων:

| Θέση | Τιμή |
|---|---|
| `0` | `ODOS_KLEIDIOU` = `"dps.llm.cache.v1"` (σταθερή συμβολική έκδοση του κανόνα) |
| `1` | `montelo` |
| `2` | `ekdosi_prompt` |
| `3` | το σώμα του αιτήματος (παρακάτω) |

Σώμα για `parage_json` (3 στοιχεία):

```
["json", systima, xristis]
```

Σώμα για `parage_keimeno` (3 στοιχεία):

```
["keimeno", systima, [[rolos1, keimeno1], [rolos2, keimeno2], ...]]
```

Κανονικοποίηση πριν το hash (και **μόνο** για το κλειδί· το εσωτερικό LLM παίρνει το αρχικό αίτημα):

1. Unicode **NFC**.
2. CRLF (`\r\n`) → LF (`\n`).

Δεν περιλαμβάνονται στο κλειδί: `thermoskrasia`, `simatodotis`, το zod `sxima`, και ο τρόπος κλήσης
(`parage_json` έναντι `parage_keimeno` είναι ήδη διαχωρισμένα μέσα από το `json`/`keimeno`).

Αλλαγή σε οποιοδήποτε από τα παραπάνω πεδία **υποχρεωτικά** αλλάζει το `ekdosi_prompt`
(κανόνας §7.1), οπότε το cache ακυρώνεται σκόπιμα.

## Ανεξάρτητη επαλήθευση

Τα hash παρακάτω επαληθεύτηκαν με το `node:crypto` (Node built-in), όχι με τη δική μας
υλοποίηση SHA-256:

```
node -e "const c=require('node:crypto');
const s=JSON.stringify(['dps.llm.cache.v1','mock-flash-1','p1@1',['json','sistima-perigrammatos','perigramma|arx-1|1-3']]);
console.log(c.createHash('sha256').update(s,'utf8').digest('hex'))"
```

## Τα fixtures

### 1. `8d1e8a4a44685c5eadb36aaa006f5e538935920aa47c0124a7f4466affd04c6c.json` (parage_json)

| Πεδίο | Τιμή |
|---|---|
| `montelo` | `mock-flash-1` |
| `ekdosi_prompt` | `p1@1` |
| `typos_aitimatos` | `json` |
| `systima` | `sistima-perigrammatos` |
| `xristis` | `perigramma\|arx-1\|1-3` |

Κανονική σειρά (μοναδική, χωρίς αλλαγές):

```
["dps.llm.cache.v1","mock-flash-1","p1@1",["json","sistima-perigrammatos","perigramma|arx-1|1-3"]]
```

Αναμενόμενο SHA-256: `8d1e8a4a44685c5eadb36aaa006f5e538935920aa47c0124a7f4466affd04c6c`

### 2. `de105f5080417d4c25fc16c4712e3e5573574a514e17676cd577528c955bbdbf.json` (parage_keimeno)

| Πεδίο | Τιμή |
|---|---|
| `montelo` | `mock-flash-1` |
| `ekdosi_prompt` | `p4@1` |
| `typos_aitimatos` | `keimeno` |
| `systima` | `sistima-tutor` |
| `minimata[0]` | `["xristis", "erotisi-tutor-1"]` |
| `minimata[1]` | `["montelo", "apantisi-tutor-1"]` |

Κανονική σειρά (μοναδική, χωρίς αλλαγές):

```
["dps.llm.cache.v1","mock-flash-1","p4@1",["keimeno","sistima-tutor",[["xristis","erotisi-tutor-1"],["montelo","apantisi-tutor-1"]]]]
```

Αναμενόμενο SHA-256: `de105f5080417d4c25fc16c4712e3e5573574a514e17676cd577528c955bbdbf`

## Εγγραφή νέου fixture (record)

1. Κάλεσε το πραγματικό `LlmPyli` **μία φορά** (μόνο ο owner με δικό του Gemini key, ποτέ σε test).
2. Υπολόγισε το κλειδί με `kleidi_json(montelo, aitima)` / `kleidi_keimenou(montelo, aitima)`.
3. Φτιάξε το περιεχόμενο με το βοηθητικό εργαλείο:

```ts
import { grapse_arxeio_prosopa } from '@dps/ai'; // packages/ai/src/mock/mock-llm.ts
const keimeno = grapse_arxeio_prosopa({
  montelo,
  kleidi,
  aitima,
  timi: apantisi,
  imera_athinas: imeras_athinas(new Date()),
});
```

4. Γράψε το `keimeno` στο `fixtures/llm/<kleidi>.json`.
5. **Έλεγχος ακεραιότητας**: ξαναφόρτωσε το αρχείο και τρέξε το στο test. Ο `MockLlmArchiou`
   ελέγχει `hash`, `montelo` και `typos_aitimatos` σε κάθε ανάγνωση και επιστρέφει
   `MI_EGKYRO_SXIMA` αν δεν ταιριάζουν.

## Κανόνας μη ψεύτικων δεδομένων

Αν το fixture λείπει, ο `MockLlmArchiou` επιστρέφει `DEN_VRETHIKE` με το όνομα του αρχείου
που λείπει. **Ποτέ** δεν επιστρέφει κενή συμβολική σειρά, `ok(...)` με επινοημένο περιεχόμενο
ή οποιαδήποτε προκαθορισμένη απάντηση (§3 κανόνας 9).

`DEN_VRETHIKE` και όχι `MI_YPOSTIRIZOMENO`: το mock *υποστηρίζεται* — λείπει ένα συγκεκριμένο
αρχείο. Το `MI_YPOSTIRIZOMENO` σημαίνει «δεν υποστηρίζεται αυτή η λειτουργία» (π.χ. «δεν
μετατρέπεται το σχήμα σε JSON Schema» στο gemini), που δεν είναι το ζητούμενο εδώ.
`MI_EGKYRO_SXIMA` χρησιμοποιείται όταν το αρχείο υπάρχει αλλά είναι χαλασμένο ή γραμμένο
για άλλο αίτημα.