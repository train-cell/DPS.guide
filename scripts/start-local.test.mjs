import { describe, expect, it } from 'vitest';
import { withSystemCaOption } from './start-local.mjs';

describe('local development TLS trust configuration', () => {
  it('uses the system certificate store on Windows and macOS', () => {
    expect(withSystemCaOption('', 'win32')).toBe('--use-system-ca');
    expect(withSystemCaOption('--trace-warnings', 'darwin')).toBe('--trace-warnings --use-system-ca');
  });

  it('does not duplicate an existing system CA option', () => {
    expect(withSystemCaOption(' --use-system-ca ', 'win32')).toBe('--use-system-ca');
  });

  it('leaves other operating systems to their normal Node trust configuration', () => {
    expect(withSystemCaOption('--trace-warnings', 'linux')).toBe('--trace-warnings');
  });
});
