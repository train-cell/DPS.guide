import { describe, it, expect } from 'vitest';
import { arithmos_apok_stable, kleidiEnotitas_apo_extra } from '../src/eidopoiiseis/typoi.js';

describe('eidopoiiseis typoi', () => {
  it('arithmos_apok_stable: deterministic hash', () => {
    const id = arithmos_apok_stable('PLI101');
    expect(id).toBeGreaterThan(0);
    expect(arithmos_apok_stable('PLI101')).toBe(id);
  });

  it('arithmos_apok_stable: μηδενικό id → 1 (L172 true)', () => {
    // Βρίσκει κλειδί όπου το FNV-1a (31 bit) δίνει 0 → επιστρέφει 1.
    let found = '';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let len = 1; len <= 4 && !found; len += 1) {
      const total = Math.pow(chars.length, len);
      for (let t = 0; t < total && !found; t += 1) {
        let s = '';
        for (let i = 0; i < len; i += 1) {
          s += chars[Math.floor(t / Math.pow(chars.length, i)) % chars.length];
        }
        let k = 0x811c9dc5;
        for (let j = 0; j < s.length; j += 1) {
          k ^= s.charCodeAt(j);
          k = Math.imul(k, 0x01000193);
        }
        const pre = k >>> 0;
        if (pre <= 0xffff) {
          const s2 = s + String.fromCharCode(pre);
          if (arithmos_apok_stable(s2) === 1) {
            found = s2;
          }
        }
      }
    }
    expect(found).toBeTruthy();
    expect(arithmos_apok_stable(found)).toBe(1);
  });

  it('arithmos_apok_stable: κενή χορδή', () => {
    expect(arithmos_apok_stable('')).toBeGreaterThan(0);
  });

  it('kleidiEnotitas_apo_extra: non-object → null (L177/L178)', () => {
    expect(kleidiEnotitas_apo_extra(null)).toBeNull();
    expect(kleidiEnotitas_apo_extra('string')).toBeNull();
    expect(kleidiEnotitas_apo_extra(42)).toBeNull();
  });

  it('kleidiEnotitas_apo_extra: έγκυρη τιμή', () => {
    expect(kleidiEnotitas_apo_extra({ 'kleidiEnotitas': 'PLI101' })).toBe('PLI101');
  });

  it('kleidiEnotitas_apo_extra: κενή τιμή → null (L181 false)', () => {
    expect(kleidiEnotitas_apo_extra({ 'kleidiEnotitas': '' })).toBeNull();
    expect(kleidiEnotitas_apo_extra({ 'kleidiEnotitas': 123 })).toBeNull();
  });
});
