import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  gemini_sxima,
  pare_keimeno_apantisis,
  prosarmoge_odos,
} from '../src/gemini/index.js';

describe('gemini_sxima — πλήρης μετατροπή', () => {
  it('κάνει upper-case τους τύπους JSON Schema όπως τα ορίζει το Gemini', () => {
    const sisma = gemini_sxima(z.object({ arxeio_id: z.string() }));
    expect(sisma['type']).toBe('OBJECT');
    const properties = sisma['properties'];
    if (typeof properties !== 'object' || properties === null) {
      throw new Error('λείπουν τα properties');
    }
    expect((properties as Record<string, unknown>)['arxeio_id']).toMatchObject({ type: 'STRING' });
  });

  it('μετατρέπει τα union types σε arrays', () => {
    const sisma = gemini_sxima(z.object({ lepta: z.number().nullable() }));
    const properties = sisma['properties'];
    if (typeof properties !== 'object' || properties === null) {
      throw new Error('λείπουν τα properties');
    }
    expect((properties as Record<string, unknown>)['lepta']).toMatchObject({ type: ['NUMBER', 'NULL'] });
  });

  it('αφαιρεί το $schema που δεν υποστηρίζει το Gemini', () => {
    const sisma = gemini_sxima(z.object({ titlos: z.string() }));
    expect(Object.keys(sisma)).not.toContain('$schema');
  });

  it('ακολουθεί τα εσωτερικά αντικείμενα', () => {
    const sisma = gemini_sxima(
      z.object({ tmimata: z.array(z.object({ titlos: z.string() })) })
    );
    const tmimata = sisma['properties']['tmimata'];
    if (typeof tmimata !== 'object' || tmimata === null) {
      throw new Error('λείπει το tmimata');
    }
    expect(tmimata).toMatchObject({ type: 'ARRAY' });
    const items = tmimata['items'];
    if (typeof items !== 'object' || items === null) {
      throw new Error('λείπουν τα items');
    }
    expect(items).toMatchObject({ type: 'OBJECT' });
  });
});

describe('prosarmoge_odos — είσοδοι εκτός αντικείμενου', () => {
  it('επιστρέφει {} όταν η είσοδος δεν είναι αντικείμενο', () => {
    expect(prosarmoge_odos('κείμενο')).toEqual({});
    expect(prosarmoge_odos(null)).toEqual({});
    expect(prosarmoge_odos([])).toEqual({});
    expect(prosarmoge_odos(42)).toEqual({});
    expect(prosarmoge_odos(undefined)).toEqual({});
  });

  it('μετατρέπει το άγνωστο string τύπου', () => {
    expect(prosarmoge_odos({ type: 'unknown' })).toEqual({ type: 'unknown' });
  });

  it('μετατρέπει array τύπων με αντικείμενα', () => {
    expect(prosarmoge_odos({ type: ['STRING', { nested: 'κείμενο' }] })).toEqual({
      type: ['STRING', { nested: 'κείμενο' }],
    });
  });

  it('περιθαλπεί τιμές εκτός αντικειμένου μέσα στο type', () => {
    expect(prosarmoge_odos({ type: 42 })).toEqual({ type: 42 });
  });

  it('περιφρονεί τα βαθιά αντικείμενα', () => {
    expect(prosarmoge_odos({ type: 'object', properties: { a: { type: 'string' } } })).toEqual({
      type: 'OBJECT',
      properties: { a: { type: 'STRING' } },
    });
  });
});

describe('pare_keimeno_apantisis', () => {
  it('εξάγει το κείμενο από τα μέρη της απάντησης', () => {
    const periexomeno = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Α' }, { text: 'Β' }] } }],
    });
    expect(pare_keimeno_apantisis(periexomeno)).toBe('ΑΒ');
  });

  it('επιστρέφει null όταν η είσοδος είναι undefined', () => {
    expect(pare_keimeno_apantisis(undefined)).toBe(null);
  });

  it('επιστρέφει null όταν το κείμενο δεν είναι JSON', () => {
    expect(pare_keimeno_apantisis('δεν είμαι JSON')).toBe(null);
  });

  it('επιστρέφει null όταν το JSON δεν περνάει το σχήμα', () => {
    expect(pare_keimeno_apantisis(JSON.stringify({ a: 1 }))).toBe(null);
  });

  it('επιστρέφει null όταν δεν υπάρχουν υποψήφιοι', () => {
    expect(pare_keimeno_apantisis(JSON.stringify({ candidates: [] }))).toBe(null);
  });

  it('επιστρέφει null όταν υπάρχουν μέρη χωρίς κείμενο', () => {
    expect(pare_keimeno_apantisis(JSON.stringify({ candidates: [{}] }))).toBe(null);
  });
});
