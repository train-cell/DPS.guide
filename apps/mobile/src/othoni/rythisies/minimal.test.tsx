// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';

vi.mock('@capacitor/core', () => ({
  Capacitor: { ...Capacitor, isNativePlatform: vi.fn() },
}));

const isNative = vi.mocked(Capacitor.isNativePlatform);

describe('minimal', () => {
  it('mocks', () => {
    console.log('typeof isNative:', typeof isNative, 'is vi.fn:', typeof isNative === 'function' && 'mock' in isNative);
    expect(typeof isNative).toBe('function');
  });
});
