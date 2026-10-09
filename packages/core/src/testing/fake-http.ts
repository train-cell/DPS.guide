import type { HttpPyli, HttpAitima, HttpApantisi } from '../contracts/pyles.js';
import type { Apotelesma } from '../contracts/apotelesma.js';
import { ok, apotyxia } from '../helpers.js';

export type HttpHander = (aitima: HttpAitima) => Promise<HttpApantisi> | HttpApantisi;

export class FakeHttp implements HttpPyli {
  private handlers = new Map<string, HttpHander>();
  public kliseis: HttpAitima[] = [];

  orise_apantisi(urlOrPattern: string, handler: HttpHander): void {
    this.handlers.set(urlOrPattern, handler);
  }

  async aitima(a: HttpAitima): Promise<Apotelesma<HttpApantisi>> {
    this.kliseis.push(a);
    for (const [pattern, handler] of this.handlers.entries()) {
      if (a.url.includes(pattern)) {
        try {
          const res = await handler(a);
          return ok(res);
        } catch (err) {
          return apotyxia('DIKTYO', `FakeHttp σφάλμα χειριστή: ${String(err)}`, err);
        }
      }
    }
    return apotyxia('DEN_VRETHIKE', `FakeHttp δεν βρέθηκε handler για URL: ${a.url}`);
  }
}
