import { describe, it, expect } from 'vitest';
import { ypologise_apodosi } from './index.js';

describe('ypologise_apodosi', () => {
  it('sums units per unit from question mappings', () => {
    const res = ypologise_apodosi([
      { enotita_id: 'e1', monades: 10 },
      { enotita_id: 'e2', monades: 5 },
      { enotita_id: 'e1', monades: 15 },
    ]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.timi).toEqual({ e1: 25, e2: 5 });
  });

  it('returns empty for no mappings', () => {
    const res = ypologise_apodosi([]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.timi).toEqual({});
  });

  it('accepts zero units', () => {
    const res = ypologise_apodosi([{ enotita_id: 'e1', monades: 0 }]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.timi).toEqual({ e1: 0 });
  });

  it('rejects an empty unit id', () => {
    const res = ypologise_apodosi([{ enotita_id: '  ', monades: 5 }]);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('rejects negative or non-finite units', () => {
    for (const monades of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const res = ypologise_apodosi([{ enotita_id: 'e1', monades }]);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    }
  });

  it('is deterministic', () => {
    const input = [
      { enotita_id: 'e1', monades: 10 },
      { enotita_id: 'e2', monades: 5 },
      { enotita_id: 'e1', monades: 15 },
    ];
    const prwto = ypologise_apodosi(input);
    const deutero = ypologise_apodosi([...input].reverse());
    expect(prwto.ok && deutero.ok).toBe(true);
    if (!prwto.ok || !deutero.ok) return;
    expect(deutero.timi).toEqual(prwto.timi);
  });

  it('accumulates ids that shadow Object prototype keys', () => {
    const res = ypologise_apodosi([
      { enotita_id: '__proto__', monades: 5 },
      { enotita_id: 'constructor', monades: 7 },
      { enotita_id: '__proto__', monades: 3 },
    ]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.timi['__proto__']).toBe(8);
    expect(res.timi['constructor']).toBe(7);
    expect(Object.prototype.hasOwnProperty.call(res.timi, '__proto__')).toBe(true);
  });
});
