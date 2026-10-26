import type { Exetasi, Mathima } from '../contracts/montela.js';
import { parse_meri } from '../imeres/index.js';
import type { Programma as ProgrammaMeletis } from './programma.js';

export type { ProgrammaMeletis };

/**
 * Μορφοποιεί ημερομηνία και ώρα σε UTC iCalendar format (YYYYMMDDTHHmmssZ).
 */
function morfi_utc_ical(
  etos: number,
  minas: number,
  imera: number,
  wra: number,
  lepto: number,
  defterolepto = 0
): string {
  const yyyy = String(etos).padStart(4, '0');
  const mm = String(minas).padStart(2, '0');
  const dd = String(imera).padStart(2, '0');
  const hh = String(wra).padStart(2, '0');
  const mi = String(lepto).padStart(2, '0');
  const ss = String(defterolepto).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

/**
 * Διαφυγή ειδικών χαρακτήρων κειμένου σύμφωνα με το RFC 5545 (§3.3.11).
 */
function drapetefse_keimeno(keimeno: string): string {
  return keimeno
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Δίπλωμα γραμμής (folding) ώστε να μην υπερβαίνει τα 75 octets κατά RFC 5545 (§3.1).
 */
function diplose_grammi(grammi: string): string {
  if (grammi.length <= 75) {
    return grammi;
  }
  const tmimata: string[] = [];
  tmimata.push(grammi.slice(0, 75));
  let ypoloipo = grammi.slice(75);
  while (ypoloipo.length > 0) {
    tmimata.push(` ${ypoloipo.slice(0, 74)}`);
    ypoloipo = ypoloipo.slice(74);
  }
  return tmimata.join('\r\n');
}

/**
 * Παράγει ένα πλήρες iCalendar (.ics) αρχείο RFC 5545 από το πρόγραμμα μελέτης και τις εξετάσεις.
 *
 * 100% pure deterministic module (50/50 boundary).
 */
export function parage_arxeio_ics(
  programma: ProgrammaMeletis,
  exetaseis: Exetasi[],
  mathimata: Mathima[]
): string {
  const grammes: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DPS.guide//Study Calendar//EL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  // 1. Εργασίες μελέτης ανά ημέρα
  for (const mera of programma.meres) {
    const meri = parse_meri(mera.imerominia);
    if (meri === null) {
      continue;
    }

    let trexonLepto = 9 * 60; // Εκκίνηση μελέτης στις 09:00 UTC
    for (let thesi = 0; thesi < mera.ergasies.length; thesi++) {
      const ergasia = mera.ergasies[thesi];
      if (!ergasia) {
        continue;
      }

      const lepta = Math.max(1, ergasia.lepta);
      const wraApo = Math.floor(trexonLepto / 60);
      const leptoApo = trexonLepto % 60;
      const leptoEosSynolo = trexonLepto + lepta;
      const wraEos = Math.floor(leptoEosSynolo / 60);
      const leptoEos = leptoEosSynolo % 60;
      trexonLepto = leptoEosSynolo;

      const dtstart = morfi_utc_ical(meri.etos, meri.minas, meri.imera, wraApo, leptoApo, 0);
      const dtend = morfi_utc_ical(meri.etos, meri.minas, meri.imera, wraEos, leptoEos, 0);
      const dtstamp = morfi_utc_ical(meri.etos, meri.minas, meri.imera, 0, 0, 0);
      const uid = `${mera.imerominia}-${thesi}-${ergasia.kodikos_mathimatos}-${ergasia.enotita_id}@dps.guide`;

      const mathima = mathimata.find((m) => m.kodikos === ergasia.kodikos_mathimatos);
      const titlosMathimatos = mathima?.titlos ?? ergasia.kodikos_mathimatos;
      const typosKeimeno = ergasia.eidos === 'nea_yli' ? 'Νέα ύλη' : 'Επανάληψη';

      const summary = drapetefse_keimeno(
        `[DPS] ${typosKeimeno}: ${ergasia.titlos} (${ergasia.kodikos_mathimatos})`
      );
      const description = drapetefse_keimeno(
        `Μάθημα: ${titlosMathimatos} (${ergasia.kodikos_mathimatos})\nΕνότητα: ${ergasia.titlos}\nΤύπος: ${typosKeimeno}\nΔιάρκεια: ${ergasia.lepta} λεπτά`
      );
      const alarmDescription = drapetefse_keimeno(`Υπενθύμιση μελέτης: ${ergasia.titlos}`);

      grammes.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT30M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${alarmDescription}`,
        'END:VALARM',
        'END:VEVENT'
      );
    }
  }

  // 2. Εξετάσεις
  for (const exetasi of exetaseis) {
    if (!exetasi.imerominia) {
      continue;
    }
    const meri = parse_meri(exetasi.imerominia);
    if (meri === null) {
      continue;
    }

    const dtstart = morfi_utc_ical(meri.etos, meri.minas, meri.imera, 9, 0, 0);
    const dtend = morfi_utc_ical(meri.etos, meri.minas, meri.imera, 12, 0, 0);
    const dtstamp = morfi_utc_ical(meri.etos, meri.minas, meri.imera, 0, 0, 0);
    const uid = `exetasi-${exetasi.kodikos_mathimatos}-${exetasi.imerominia}@dps.guide`;

    const mathima = mathimata.find((m) => m.kodikos === exetasi.kodikos_mathimatos);
    const titlosMathimatos = mathima?.titlos ?? exetasi.kodikos_mathimatos;

    const summary = drapetefse_keimeno(
      `[DPS] Εξέταση: ${titlosMathimatos} (${exetasi.kodikos_mathimatos})`
    );
    const description = drapetefse_keimeno(
      `Εξέταση μαθήματος: ${titlosMathimatos} (${exetasi.kodikos_mathimatos})\nΤρόπος εξέτασης: ${exetasi.tropos}`
    );
    const alarmDescription = drapetefse_keimeno(`Υπενθύμιση εξέτασης: ${titlosMathimatos}`);

    grammes.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${alarmDescription}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  grammes.push('END:VCALENDAR');

  return grammes.map(diplose_grammi).join('\r\n') + '\r\n';
}
