import inspector from 'node:inspector/promises';
import { describe, expect, it } from 'vitest';

describe('inspector probe', () => {
  it('profiler inside worker', async () => {
    const session = new inspector.Session();
    await session.connect();
    await session.post('Profiler.enable');
    await session.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
    let x = 0;
    for (let i = 0; i < 10; i++) {
      if (i > 5) {
        x++;
      }
      else {
        x--;
      }
    }
    const r = await session.post('Profiler.takePreciseCoverage');
    console.log('RESULT COUNT:', r.result.length, 'x:', x);
    await session.post('Profiler.stopPreciseCoverage');
    await session.post('Profiler.disable');
    session.disconnect();
    expect(r.result.length).toBeGreaterThan(0);
  });
});
