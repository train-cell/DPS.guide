# 🎓 DPS.guide — Open-Source eClass Study Companion & Tutor

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-1216%20passed-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.8-blue.svg)](#)
[![Zero-Cloud](https://img.shields.io/badge/Architecture-100%25%20Zero--Cloud-purple.svg)](#)
[![Privacy](https://img.shields.io/badge/Security-Hardware%20Vault-success.svg)](#)

> **DPS.guide**: Ο ανοικτού κώδικα, self-hosted ψηφιακός βοηθός για φοιτητές των Ελληνικών Πανεπιστημίων. Συγχρονίζει τα μαθήματα και τα αρχεία του Open eClass τοπικά, δημιουργεί χάρτες γνώσης και περιγράμματα με AI, και προσφέρει εξατομικευμένη μελέτη — **αποκλειστικά στη συσκευή σου (iOS, Android, PC)** χωρίς κανέναν εξωτερικό διακομιστή ή telemetry.

---

## 🔒 100% Zero-Knowledge & Zero-Cloud Αρχιτεκτονική

Το DPS.guide είναι **αυστηρά client-only / self-hosted**:
- 🛡️ **Κανένας ενδιάμεσος server:** Τα διαπιστευτήρια eClass και τα αρχεία των μαθημάτων μένουν αποκλειστικά στη συσκευή σου.
- 🔐 **Hardware-Backed Vault:** Τα συνθηματικά προστατεύονται μέσω iOS Keychain, Android Keystore, ή Windows Credential Manager.
- 🤖 **BYOK (Bring Your Own Key):** Ο χρήστης εισάγει το δικό του Gemini API key το οποίο δεν διαμοιράζεται ποτέ.
- ⚡ **The 50/50 Boundary:** Η AI αναλαμβάνει μόνο NLP (περίληψη, εξήγηση, tutor), ενώ η μηχανή υπολογισμών εκτελείται 100% ντετερμινιστικά (Leitner spcaed repetition, τοπολογική ταξινόμηση προαπαιτουμένων, βαθμονόμηση χρόνου EWMA).

---

## 🏛️ Υποστηριζόμενα Ελληνικά Πανεπιστήμια & Portals

Το σύστημα ενσωματώνει πλήρη κατάλογο με **26+ ακαδημαϊκά portals** με ειδική έμφαση στα τμήματα **Πληροφορικής, ΗΜΜΥ και Θετικών Επιστημών**, καθώς και υποστήριξη για **Custom eClass URL**:

| Ίδρυμα | Συντομογραφία | Τμήμα / Πύλη | Προεπιλεγμένο URL | LMS |
|---|---|---|---|---|
| **Πανεπιστήμιο Πειραιώς** | ΠΑΠΕΙ (unipi_cs) | Τμήμα Πληροφορικής (Θαλής) | `https://thales.cs.unipi.gr` | Open eClass |
| **Πανεπιστήμιο Πειραιώς** | ΠΑΠΕΙ (unipi) | Κεντρικό eClass | `https://eclass.unipi.gr` | Open eClass |
| **ΕΚΠΑ** | ΕΚΠΑ (uoa_dit) | Πληροφορικής & Τηλεπικοινωνιών | `https://eclass.uoa.gr` | Open eClass |
| **ΟΠΑ (ΑΣΟΕΕ)** | ΟΠΑ (aueb_cs) | Τμήμα Πληροφορικής | `https://eclass.aueb.gr` | Open eClass |
| **ΕΜΠ** | ΕΜΠ (ntua_mycourses) | Σχολή ΗΜΜΥ & Πολυτεχνείο | `https://mycourses.ntua.gr` | Custom LMS |
| **ΑΠΘ** | ΑΠΘ (auth_cs) | Τμήμα Πληροφορικής & Σχολές | `https://eclass.auth.gr` | Open eClass |
| **Πανεπιστήμιο Πατρών** | ΠΑΤΡΑ (upatras_ceid) | Μηχανικών Η/Υ & Πληροφορικής | `https://eclass.upatras.gr` | Open eClass |
| **Πανεπιστήμιο Κρήτης** | ΚΡΗΤΗ (uoc_csd) | Τμήμα Επιστήμης Υπολογιστών | `https://eclass.uoc.gr` | Open eClass |
| **Πολυτεχνείο Κρήτης** | ΠΟΛΥΤΕΧΝΕΙΟ (tuc_ece) | ΗΜΜΥ Χανίων | `https://eclass.tuc.gr` | Open eClass |
| **ΔΠΘ** | ΔΠΘ (duth_ee) | Ηλεκτρολόγων Μηχανικών & Η/Υ | `https://eclass.duth.gr` | Open eClass |
| **Πανεπιστήμιο Ιωαννίνων** | UOI (uoi_cs) | Μηχανικών Η/Υ & Πληροφορικής | `https://ecourse.uoi.gr` | Moodle |
| **Πανεπιστήμιο Θεσσαλίας** | UTH (uth_inf) | Πληροφορικής & Τηλεπικοινωνιών | `https://eclass.uth.gr` | Open eClass |
| **Χαροκόπειο Πανεπιστήμιο** | ΧΑΡΟΚΟΠΕΙΟ (hua_dit) | Πληροφορικής & Τηλεματικής | `https://eclass.hua.gr` | Open eClass |
| **Πάντειο Πανεπιστήμιο** | ΠΑΝΤΕΙΟ (panteion) | eClass Παντείου | `https://eclass.panteion.gr` | Open eClass |
| **Πανεπιστήμιο Αιγαίου** | ΑΙΓΑΙΟ (aegean_icsd) | Μηχανικών Πληροφοριακών Συστημάτων | `https://eclass.aegean.gr` | Open eClass |
| **Ιόνιο Πανεπιστήμιο** | ΙΟΝΙΟ (ionio_di) | Τμήμα Πληροφορικής | `https://eclass.ionio.gr` | Open eClass |
| **Πανεπιστήμιο Δυτικής Μακεδονίας** | ΠΔΜ (uowm_ece) | Ηλεκτρολόγων Μηχανικών & Μηχανικών Η/Υ | `https://eclass.uowm.gr` | Open eClass |
| **Πανεπιστήμιο Πελοποννήσου** | ΠΑΠΕΛ (uop_dit) | Πληροφορικής & Τηλεπικοινωνιών | `https://eclass.uop.gr` | Open eClass |
| **ΠΑΔΑ** | ΠΑΔΑ (uniwa_ice) | Μηχανικών Πληροφορικής & Υπολογιστών | `https://eclass.uniwa.gr` | Open eClass |
| **ΕΛΜΕΠΑ** | ΕΛΜΕΠΑ (hmu_cs) | ΗΜΜΥ & Ηλεκτρονικών Μηχανικών | `https://eclass.hmu.gr` | Open eClass |
| **ΔΙΠΑΕ** | ΔΙΠΑΕ (ihu_iee) | Μηχανικών Πληροφορικής | `https://eclass.ihu.gr` | Open eClass |
| **ΓΠΑ** | ΓΠΑ (aua) | Γεωπονικό Πανεπιστήμιο Αθηνών | `https://eclass.aua.gr` | Open eClass |
| **ΑΣΚΤ** | ΑΣΚΤ (asfa) | Ανωτάτη Σχολή Καλών Τεχνών | `https://eclass.asfa.gr` | Open eClass |
| **ΑΣΠΑΙΤΕ** | ΑΣΠΑΙΤΕ (aspete) | eClass ΑΣΠΑΙΤΕ | `https://eclass.aspete.gr` | Open eClass |
| **ΕΑΠ** | ΕΑΠ (eap) | Ελληνικό Ανοικτό Πανεπιστήμιο | `https://courses.eap.gr` | Moodle |
| **Custom eClass** | CUSTOM | Οποιοδήποτε άλλο eClass / Moodle portal | Εισαγωγή από τον χρήστη | Custom |

---

## 🎨 Σχεδιασμός UI: Bevel x UniStudents

Η εμπειρία χρήσης συνδυάζει την αισθητική και λειτουργικότητα των κορυφαίων φοιτητικών εφαρμογών:
- **UniStudents-inspired Onboarding:** Αναγνώριση ελληνικών σχολών, καθαρά εμβλήματα SVG ανά πανεπιστήμιο, φίλτρα περιοχής ("Όλα", "Πληροφορική/STEM", "Αθήνα", "Θεσσαλονίκη", "Περιφέρεια", "Custom"), και δυναμική αναζήτηση σχολής.
- **Bevel Tactile Interface:** Σκούρα επιφάνεια (`dark-only`), tactile κάρτες με `border-radius: 18px`, micro-badges, pill filters, smooth tap animations (`scale(0.98)`).
- **Αυστηρό Design System (Κανόνας D11):** 100% συνεπές με τα tokens του συστήματος (`tokens.css`), χωρίς αυθαίρετα hex χρώματα.
- **Student Easter Eggs & Tips:** Έξυπνα φοιτητικά tips (καφές, deadlines 23:59, EWMA calibration, Wi-Fi σχολής).

---

## 📦 Δομή Monorepo

```
DPS.guide/
├── apps/
│   ├── mobile/             # Ionic React / Capacitor εφαρμογή (iOS, Android, Web)
│   └── cli/                # Node.js CLI εργαλείο (Windows, macOS, Linux)
├── packages/
│   ├── core/               # Pure domain logic (panepistimia, grafos, leitner, ewma, epikyrosi)
│   ├── eclass/             # eClass crawler (L14 Auth, L15 BFS Tree & Delta Sync)
│   ├── extract/            # PDF και Office extraction (pdfjs, mammoth)
│   ├── ai/                 # LLM provider (Gemini, SHA-256 prompt caching, grounding)
│   ├── pipeline/           # Ενορχήστρωση deterministic pipeline
│   ├── adapters-capacitor/ # Capacitor native bridge (Filesystem, SecureStorage, Notifications)
│   ├── adapters-node/      # Node.js platform bridge (fs, keytar, undici)
│   └── mock-eclass/        # Offline fixture-based test server (zero network testing)
```

---

## 🚀 Οδηγός Χρήσης

### 1. Εγκατάσταση Εξαρτήσεων & Έλεγχος

```bash
# Εγκατάσταση dependencies
npm install

# Έλεγχος TypeScript τύπων σε όλο το monorepo
npm run typecheck

# Εκτέλεση όλων των δοκιμών (1216 tests)
npm test

# Έλεγχος ποιότητας κώδικα (ESLint)
npx eslint .
```

### 2. Χρήση του CLI (`dps-guide`)

```bash
# Προβολή υποστηριζόμενων πανεπιστημίων και eClass portals
npx dps-guide panepistimia

# Αναζήτηση συγκεκριμένου πανεπιστημίου / σχολής
npx dps-guide panepistimia unipi
npx dps-guide panepistimia ekpa

# Σύνδεση με το eClass (διαβάζει διαπιστευτήρια από το τοπικό keyring)
npx dps-guide syndesi

# Προβολή μαθημάτων του λογαριασμού σου
npx dps-guide mathimata

# Συγχρονισμός αρχείων ενός μαθήματος (π.χ. ΠΛΗ101)
npx dps-guide sygxronismos PLI101

# Ανάλυση ύλης μαθήματος (διάγραμμα ενοτήτων και προαπαιτούμενα)
npx dps-guide analysi PLI101

# Παραγωγή οδηγού μελέτης ενότητας
npx dps-guide odigos en-1

# Υπολογισμός ημερήσιου προγράμματος μελέτης
npx dps-guide programma

# Πλήρης ροή: σύνδεση → μαθήματα → συγχρονισμός → ανάλυση
npx dps-guide run
```

### 3. Εκτέλεση Mobile App

```bash
# Εκκίνηση τοπικού dev server (Vite)
npm run dev --workspace=@dps/mobile

# Build της εφαρμογής
npm run build --workspace=@dps/mobile

# Συγχρονισμός με Capacitor για iOS / Android
npx cap sync
```

---

## 🧪 Δοκιμές & Επαλήθευση (TDD)

Το έργο ακολουθεί αυστηρή μεθοδολογία **Test-Driven Development (TDD)** με **0 network calls** στα tests:
- **85 Test Files**
- **1216 Unit & Integration Tests (100% επιτυχία)**
- **0 ESLint Warnings**
- **0 TypeScript Errors (`tsc --build`)**

---

## 📄 Άδεια Χρήσης

Το DPS.guide διατίθεται υπό την άδεια [MIT](LICENSE). Ελεύθερο για χρήση, τροποποίηση και διανομή από οποιονδήποτε φοιτητή ή ερευνητή.
