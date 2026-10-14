import { describe, expect, it } from 'vitest';
import { pnpmInvocation, withSystemCaOption } from './start-local.mjs';

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

describe('local startup package-manager invocation', () => {
  it('runs pnpm JavaScript entrypoints through the current Node executable', () => {
    expect(pnpmInvocation(['mobile:start'], 'C:\\tools\\pnpm\\pnpm.cjs', 'node.exe')).toEqual({
      command: 'node.exe',
      args: ['C:\\tools\\pnpm\\pnpm.cjs', 'mobile:start'],
    });
  });

  it('runs a pnpm binary directly without a shell', () => {
    expect(pnpmInvocation(['mobile:start'], 'pnpm.exe', 'node.exe')).toEqual({
      command: 'pnpm.exe',
      args: ['mobile:start'],
    });
  });

  it('requires pnpm to provide a resolvable executable', () => {
    expect(() => pnpmInvocation(['mobile:start'], '', 'node.exe')).toThrow('through pnpm');
  });
});
