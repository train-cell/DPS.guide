import { describe, expect, it } from 'vitest';

describe('probe blob stream', () => {
  it('chunks per part', async () => {
    const a = new Uint8Array(24);
    const b = new Uint8Array(1144);
    const c = new Uint8Array(33);
    const d = new Uint8Array(32);
    const blob = new Blob([a.buffer as ArrayBuffer, b.buffer as ArrayBuffer, c.buffer as ArrayBuffer, d.buffer as ArrayBuffer], {
      type: 'application/vnd.dps-guide.backup',
    });
    const reader = blob.stream().getReader();
    const chunks: number[] = [];
    let done = false;
    while (!done) {
      const { done: isDone, value } = await reader.read();
      done = isDone;
      if (value) chunks.push(value.byteLength);
    }
    const fs = await import('node:fs');
    fs.writeFileSync('/tmp/blob-chunks.txt', `blob size ${blob.size} chunks ${chunks.join(',')}`);
    expect(true).toBe(true);
  });
});
