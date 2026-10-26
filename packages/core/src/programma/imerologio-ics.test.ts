import { describe, expect, it } from 'vitest';
import type { Exetasi, Mathima } from '../contracts/montela.js';
import type { ProgrammaMeletis } from './imerologio-ics.js';
import { parage_arxeio_ics } from './imerologio-ics.js';

describe('imerologio-ics — RFC 5545 Calendar Export', () => {
  const mathimaDedomena: Mathima[] = [
    {
      kodikos: 'CS101',
      titlos: 'Εισαγωγή στην Επιστήμη Υπολογιστών',
      url: 'https://eclass.example.org/courses/CS101',
      epilegmeno: true,
    },
    {
      kodikos: 'MATH101',
      titlos: 'Γραμμική Άλγεβρα',
      url: 'https://eclass.example.org/courses/MATH101',
      epilegmeno: true,
    },
  ];

  const paradeigmaProgrammatos: ProgrammaMeletis = {
    meres: [
      {
        imerominia: '2026-11-01',
        ergasies: [
          {
            eidos: 'nea_yli',
            kodikos_mathimatos: 'CS101',
            enotita_id: 'en-1',
            titlos: 'Αλγόριθμοι και Δομές',
            lepta: 60,
          },
          {
            eidos: 'epanalipsi',
            kodikos_mathimatos: 'CS101',
            enotita_id: 'en-0',
            titlos: 'Ιστορική αναδρομή',
            lepta: 30,
          },
        ],
      },
    ],
    slack_ana_mathima: { CS101: 5 },
    protasi_epiviosis: [],
  };

  const paradeigmaExetaseon: Exetasi[] = [
    {
      kodikos_mathimatos: 'CS101',
      imerominia: '2027-01-15',
      tropos: 'kleista_vivlia',
    },
    {
      kodikos_mathimatos: 'MATH101',
      imerominia: null, // πρέπει να παραλειφθεί
      tropos: 'anoixta_vivlia',
    },
  ];

  it('παράγει έγκυρη σύνταξη iCalendar RFC 5545 με σωστή κεφαλίδα και ουρά', () => {
    const ics = parage_arxeio_ics(paradeigmaProgrammatos, paradeigmaExetaseon, mathimaDedomena);

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.includes('PRODID:-//DPS.guide//Study Calendar//EL\r\n')).toBe(true);
    expect(ics.includes('VERSION:2.0\r\n')).toBe(true);
    expect(ics.includes('CALSCALE:GREGORIAN\r\n')).toBe(true);
    expect(ics.includes('METHOD:PUBLISH\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('χρησιμοποιεί αποκλειστικά CRLF (\\r\\n) για όλες τις γραμμές', () => {
    const ics = parage_arxeio_ics(paradeigmaProgrammatos, paradeigmaExetaseon, mathimaDedomena);

    // Δεν πρέπει να υπάρχει σκέτο \n χωρίς προηγούμενο \r
    const xorisCRLF = ics.replace(/\r\n/g, '');
    expect(xorisCRLF.includes('\n')).toBe(false);
    expect(xorisCRLF.includes('\r')).toBe(false);
  });

  it('παράγει VEVENT ανά εργασία μελέτης με DTSTART, DTEND, STATUS, SUMMARY και DESCRIPTION', () => {
    const ics = parage_arxeio_ics(paradeigmaProgrammatos, [], mathimaDedomena);

    expect(ics).toContain('BEGIN:VEVENT\r\n');
    expect(ics).toContain('STATUS:CONFIRMED\r\n');

    // Εργασία 1 (60 λεπτά, 09:00 - 10:00 UTC)
    expect(ics).toContain('DTSTART:20261101T090000Z\r\n');
    expect(ics).toContain('DTEND:20261101T100000Z\r\n');
    expect(ics).toContain('UID:2026-11-01-0-CS101-en-1@dps.guide\r\n');
    expect(ics).toContain('[DPS] Νέα ύλη: Αλγόριθμοι και Δομές (CS101)');

    // Εργασία 2 (30 λεπτά, 10:00 - 10:30 UTC)
    expect(ics).toContain('DTSTART:20261101T100000Z\r\n');
    expect(ics).toContain('DTEND:20261101T103000Z\r\n');
    expect(ics).toContain('UID:2026-11-01-1-CS101-en-0@dps.guide\r\n');
    expect(ics).toContain('[DPS] Επανάληψη: Ιστορική αναδρομή (CS101)');
  });

  it('περιλαμβάνει VALARM με TRIGGER:-PT30M για κάθε συμβάν', () => {
    const ics = parage_arxeio_ics(paradeigmaProgrammatos, paradeigmaExetaseon, mathimaDedomena);

    expect(ics).toContain('BEGIN:VALARM\r\n');
    expect(ics).toContain('TRIGGER:-PT30M\r\n');
    expect(ics).toContain('ACTION:DISPLAY\r\n');
    expect(ics).toContain('END:VALARM\r\n');

    // 2 εργασίες + 1 έγκυρη εξέταση = 3 alarms
    const plithosAlarms = (ics.match(/BEGIN:VALARM/g) ?? []).length;
    expect(plithosAlarms).toBe(3);
  });

  it('παράγει VEVENT για εξετάσεις και παραλείπει εξετάσεις χωρίς ημερομηνία', () => {
    const ics = parage_arxeio_ics({ meres: [], slack_ana_mathima: {}, protasi_epiviosis: [] }, paradeigmaExetaseon, mathimaDedomena);

    // Εξέταση CS101 (2027-01-15 09:00 - 12:00 UTC)
    expect(ics).toContain('UID:exetasi-CS101-2027-01-15@dps.guide\r\n');
    expect(ics).toContain('DTSTART:20270115T090000Z\r\n');
    expect(ics).toContain('DTEND:20270115T120000Z\r\n');
    expect(ics).toContain('SUMMARY:[DPS] Εξέταση: Εισαγωγή στην Επιστήμη Υπολογιστών (CS101)\r\n');
    expect(ics).toContain('kleista_vivlia');

    // Η εξέταση MATH101 έχει imerominia: null, άρα δεν παράγεται συμβάν
    expect(ics).not.toContain('MATH101');
  });

  it('είναι 100% pure και deterministic (ίδια είσοδος -> ίδια έξοδος)', () => {
    const ics1 = parage_arxeio_ics(paradeigmaProgrammatos, paradeigmaExetaseon, mathimaDedomena);
    const ics2 = parage_arxeio_ics(paradeigmaProgrammatos, paradeigmaExetaseon, mathimaDedomena);

    expect(ics1).toBe(ics2);
  });
});
