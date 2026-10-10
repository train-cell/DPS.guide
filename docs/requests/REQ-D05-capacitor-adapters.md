# REQ-D05 — Capacitor adapters για το apps/mobile (I3): έτοιμο το σήμα, μπλοκαρισμένες οι εξαρτήσεις

| Πεδίο | Τιμή |
|---|---|
| Requesting lane | I3 (Stream D — mobile wiring, apps/mobile) |
| Ημερομηνία | 2026-10-10 |
| Κατάσταση | **BLOCKED** — το `packages/adapters-capacitor/**` δεν υπάρχει· το lane E το έχει ως spec (E-L10-02) και είναι μπλοκαρισμένο σε dependencies |
| Εξαρτάται από | L10/L11 lane E (`packages/adapters-capacitor/src/storage/**`, `http/**`, `mystika/**`) |

## Τι ζητάει το I3

Η κάρτα I3 (§9) ζητά «πραγματικούς Capacitor adapters στις οθόνες». Το αποδεκτό
εφαρμόσιμο κομμάτι — οι οθόνες να διαβάζουν δεδομένα ΜΟΝΟ από τις πύλες του
περιβάλλοντος (`ApothikiPyli` κλπ) και ποτέ απευθείας από ψεύτικα — ολοκληρώθηκε.
Το κομμάτι που μένει είναι η σύνδεση των πυλών με τους Capacitor adapters.

## Τι είναι έτοιμο από το Stream D

- Οι οθόνες δεν ξέρουν από adapters: παίρνουν το `Periballon` από React context
  (`periballon/provolos.tsx`) ή από prop.
- Το περιβάλλον φέρει σήμανση `deigma`: όταν είναι true (ψεύτικο περιβάλλον) σπέρνεται
  το σετ δείγματος· με πραγματικούς adapters (`deigma: false`) δεν σπέρνεται τίποτα.
- Η σύνδεση παραμένει μία γραμμή στο bootstrap: `ftiaxe_periballon(antikatastaseis, { deigma: false })`
  με τους Capacitor adapters στο `antikatastaseis`.

## Ζητούμενο από τον integrator

Όταν το lane E παραδώσει τους Capacitor adapters (με τα dependencies του §6.3), το I3
τους περνά στο bootstrap της εφαρμογής:

```ts
const periballon = ftiaxe_periballon(
  {
    apothiki: capacitorApothiki,      // @capacitor/filesystem, Directory.Documents
    http: capacitorHttp,               // CapacitorHttp + CapacitorCookies
    mystika: capacitorMystika,         // @aparajita/capacitor-secure-storage
  },
  { deigma: false }
);
```

Η επαλήθευση στη συσκευή (S2 checklist) είναι του owner· καμία αλλαγή contracts δεν ζητείται.
