import type { RologiPyli } from '../contracts/pyles.js';

export class FakeRologi implements RologiPyli {
  private trexon: Date;

  constructor(arxiko: Date = new Date('2026-10-09T10:00:00.000Z')) {
    this.trexon = new Date(arxiko);
  }

  tora(): Date {
    return new Date(this.trexon);
  }

  theste_xrono(nea: Date): void {
    this.trexon = new Date(nea);
  }

  proxora_ms(ms: number): void {
    this.trexon = new Date(this.trexon.getTime() + ms);
  }
}
