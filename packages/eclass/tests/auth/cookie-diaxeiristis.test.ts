/**
 * Tests του `CookieDiaxeiristis` (διαχείριση session cookies).
 *
 * Ελέγχονται όλες οι κλάδοι: κεφαλίδες `set-cookie`, χειροκίνητη αποθήκευση,
 * παραγωγή κεφαλίδας `Cookie` και οι ακραίες περιπτώσεις (κενά ονόματα,
 * μη έγκυρα τμήματα).
 *
 * ZERO PII: κανένα πραγματικό cookie, μόνο δοκιμαστικά ονόματα.
 */

import { describe, expect, it } from 'vitest';
import { CookieDiaxeiristis } from '../../src/auth/cookie-diaxeiristis.js';

describe('CookieDiaxeiristis', () => {
  it('αποθηκεύει cookies από κεφαλίδα set-cookie', () => {
    const diax = new CookieDiaxeiristis();
    diax.apothikefse_apo_kefalides({
      'set-cookie': 'session=abc123; Path=/; HttpOnly',
    });
    expect(diax.pare_kefalida()).toBe('session=abc123');
    expect(diax.exei_session()).toBe(true);
    expect(diax.pare_ola()).toEqual(new Map<string, string>([['session', 'abc123']]));
  });

  it('αποθηκεύει πολλαπλές κεφαλίδες set-cookie', () => {
    const diax = new CookieDiaxeiristis();
    diax.apothikefse_apo_kefalides({
      'set-cookie': 'a=1; Path=/',
    });
    diax.apothikefse_apo_kefalides({
      'set-cookie': 'b=2; Path=/',
    });
    expect(diax.pare_kefalida()).toBe('a=1; b=2');
  });

  it('δεν αποθηκεύει κεφαλίδες που δεν είναι set-cookie', () => {
    const diax = new CookieDiaxeiristis();
    diax.apothikefse_apo_kefalides({ 'content-type': 'text/html' });
    expect(diax.pare_kefalida()).toBeUndefined();
    expect(diax.exei_session()).toBe(false);
  });

  it('apothikefse: κενό όνομα → δεν αποθηκεύει', () => {
    const diax = new CookieDiaxeiristis();
    diax.apothikefse('  ', 'timi');
    expect(diax.pare_kefalida()).toBeUndefined();
  });

  it('apothikefse: έγκυρο όνομα → αποθηκεύει', () => {
    const diax = new CookieDiaxeiristis();
    diax.apothikefse('session', 'abc');
    expect(diax.pare_kefalida()).toBe('session=abc');
  });

  it('pare_kefalida: χωρίς cookies → undefined', () => {
    const diax = new CookieDiaxeiristis();
    expect(diax.pare_kefalida()).toBeUndefined();
  });

  it('epeksergasia_set_cookie: γραμμή χωρίς ίσον → δεν αποθηκεύει', () => {
    const diax = new CookieDiaxeiristis();
    diax.apothikefse_apo_kefalides({ 'set-cookie': 'noequals' });
    expect(diax.pare_kefalida()).toBeUndefined();
  });

  it('epeksergasia_set_cookie: κενό όνομα → δεν αποθηκεύει', () => {
    const diax = new CookieDiaxeiristis();
    diax.apothikefse_apo_kefalides({ 'set-cookie': ' =value' });
    expect(diax.pare_kefalida()).toBeUndefined();
  });

  it('epeksergasia_set_cookie: κενή γραμμή → συνεχίζει', () => {
    const diax = new CookieDiaxeiristis();
    diax.apothikefse_apo_kefalides({ 'set-cookie': '\npath=value' });
    expect(diax.pare_kefalida()).toBe('path=value');
  });

  it('katharise: αδειάζει όλα τα cookies', () => {
    const diax = new CookieDiaxeiristis();
    diax.apothikefse('session', 'abc');
    diax.katharise();
    expect(diax.pare_kefalida()).toBeUndefined();
    expect(diax.exei_session()).toBe(false);
  });
});
