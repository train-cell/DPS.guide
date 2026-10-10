const TILIOI_32 = 4;
const BYTES_ANAMORFOMIS = 64;
const WORDS_ANAMORFOMIS = 16;
const MITIKI_PROSOPA = 64;
const BITAKI_GRAMMA = 8;
const BITI_ANA_BYTE = 8;
const PLIROFORIA_GRAMMATON = 4294967296;
const TYPIS_BIG_ENDIAN = false;

const ARXIKO_KATASTASIS = pinaka_32([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

const STATHIRA_IA = pinaka_32([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function pinaka_32(times: readonly number[]): DataView {
  const ammakos = new Uint8Array(times.length * TILIOI_32);
  const ta_view = new DataView(ammakos.buffer);
  let i = 0;
  for (const timi of times) {
    ta_view.setUint32(i * TILIOI_32, timi, TYPIS_BIG_ENDIAN);
    i += 1;
  }
  return ta_view;
}

function lege(prosopa: DataView, i: number): number {
  return prosopa.getUint32(i * TILIOI_32, TYPIS_BIG_ENDIAN);
}

function these(prosopa: DataView, i: number, timi: number): void {
  prosopa.setUint32(i * TILIOI_32, timi >>> 0, TYPIS_BIG_ENDIAN);
}

function strofi_aristera(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function parastylos_arxi(arxi: Uint8Array, pliropos: number): DataView {
  const ammakos = new Uint8Array(pliropos);
  ammakos.set(arxi);
  ammakos[arxi.length] = 0x80;
  const prosopa = new DataView(ammakos.buffer);
  const bitai = pliropos - BITAKI_GRAMMA;
  const megali_bitai = arxi.length * BITI_ANA_BYTE;
  prosopa.setUint32(bitai, Math.floor(megali_bitai / PLIROFORIA_GRAMMATON), TYPIS_BIG_ENDIAN);
  prosopa.setUint32(bitai + TILIOI_32, megali_bitai >>> 0, TYPIS_BIG_ENDIAN);
  return prosopa;
}

export function sha256_heks(keimeno: string): string {
  const arxi = new TextEncoder().encode(keimeno);
  const pliropos = Math.ceil((arxi.length + BITAKI_GRAMMA + 1) / BYTES_ANAMORFOMIS) * BYTES_ANAMORFOMIS;
  const prosopa = parastylos_arxi(arxi, pliropos);

  const ammakos_prosopa = new Uint8Array(MITIKI_PROSOPA * TILIOI_32);
  const view_prosopon = new DataView(ammakos_prosopa.buffer);

  let a = lege(ARXIKO_KATASTASIS, 0);
  let b = lege(ARXIKO_KATASTASIS, 1);
  let c = lege(ARXIKO_KATASTASIS, 2);
  let d = lege(ARXIKO_KATASTASIS, 3);
  let e = lege(ARXIKO_KATASTASIS, 4);
  let f = lege(ARXIKO_KATASTASIS, 5);
  let g = lege(ARXIKO_KATASTASIS, 6);
  let h = lege(ARXIKO_KATASTASIS, 7);

  for (let amo = 0; amo < pliropos; amo += BYTES_ANAMORFOMIS) {
    for (let i = 0; i < WORDS_ANAMORFOMIS; i += 1) {
      these(view_prosopon, i, prosopa.getUint32(amo + i * TILIOI_32, TYPIS_BIG_ENDIAN));
    }
    for (let i = WORDS_ANAMORFOMIS; i < MITIKI_PROSOPA; i += 1) {
      const pende = lege(view_prosopon, i - 15);
      const dyo = lege(view_prosopon, i - 2);
      const s0 = (strofi_aristera(pende, 7) ^ strofi_aristera(pende, 18) ^ (pende >>> 3)) >>> 0;
      const s1 = (strofi_aristera(dyo, 17) ^ strofi_aristera(dyo, 19) ^ (dyo >>> 10)) >>> 0;
      these(view_prosopon, i, (lege(view_prosopon, i - 16) + s0 + lege(view_prosopon, i - 7) + s1) >>> 0);
    }

    const arkhi_a = a;
    const arkhi_b = b;
    const arkhi_c = c;
    const arkhi_d = d;
    const arkhi_e = e;
    const arkhi_f = f;
    const arkhi_g = g;
    const arkhi_h = h;

    for (let i = 0; i < MITIKI_PROSOPA; i += 1) {
      const s1 = (strofi_aristera(e, 6) ^ strofi_aristera(e, 11) ^ strofi_aristera(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const prosopa1 = (h + s1 + ch + lege(STATHIRA_IA, i) + lege(view_prosopon, i)) >>> 0;
      const s0 = (strofi_aristera(a, 2) ^ strofi_aristera(a, 13) ^ strofi_aristera(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const prosopa2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + prosopa1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (prosopa1 + prosopa2) >>> 0;
    }

    a = (arkhi_a + a) >>> 0;
    b = (arkhi_b + b) >>> 0;
    c = (arkhi_c + c) >>> 0;
    d = (arkhi_d + d) >>> 0;
    e = (arkhi_e + e) >>> 0;
    f = (arkhi_f + f) >>> 0;
    g = (arkhi_g + g) >>> 0;
    h = (arkhi_h + h) >>> 0;
  }

  let eksodos = '';
  for (const timi of [a, b, c, d, e, f, g, h]) {
    eksodos += (timi >>> 0).toString(16).padStart(8, '0');
  }
  return eksodos;
}