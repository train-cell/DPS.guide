import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  EikonidioPanepistimiou,
  EikonidioAsfaleias,
  kanonikopoiise_panepistimio_id,
  pare_panepistimio_dedomena,
  PANEPISTIMIA_LISTA,
  PROEPILEGMENTO_MEGETHOS_EIKONIDIOU,
} from './eikonidia-panepistimion.js';

const PIGI_KODIKA = readFileSync(
  fileURLToPath(new URL('./eikonidia-panepistimion.tsx', import.meta.url)),
  'utf8'
);

describe('EikonidioPanepistimiou - Vasiki leitourgia & SVG paragogi', () => {
  it('apodidei egkyro SVG stoixeio me proepilegmeno megethos', () => {
    const html = renderToStaticMarkup(<EikonidioPanepistimiou id="unipi" />);
    expect(html).toContain('<svg');
    expect(html).toContain(`width="${PROEPILEGMENTO_MEGETHOS_EIKONIDIOU}"`);
    expect(html).toContain(`height="${PROEPILEGMENTO_MEGETHOS_EIKONIDIOU}"`);
    expect(html).toContain('viewBox="0 0 32 32"');
    expect(html).toContain('role="img"');
    expect(html).toContain('data-testid="eikonidio-panepistimiou-unipi"');
    expect(html).toContain('data-testid="emvlima-unipi"');
  });

  it('ypostirizei prosarmasmeno megethos kai className', () => {
    const html = renderToStaticMarkup(
      <EikonidioPanepistimiou id="uoa" megethos={48} className="eidiko-badge" titlos="Badge EKPA" />
    );
    expect(html).toContain('width="48"');
    expect(html).toContain('height="48"');
    expect(html).toContain('class="eidiko-badge"');
    expect(html).toContain('aria-label="Badge EKPA"');
  });

  it('paragei swsto emvlima gia ola ta ypostirizomena panepistimia', () => {
    const panepistimia = [
      { id: 'unipi', testid: 'emvlima-unipi' },
      { id: 'papei', testid: 'emvlima-unipi' },
      { id: 'uoa', testid: 'emvlima-uoa' },
      { id: 'ekpa', testid: 'emvlima-uoa' },
      { id: 'ntua', testid: 'emvlima-ntua' },
      { id: 'emp', testid: 'emvlima-ntua' },
      { id: 'aueb', testid: 'emvlima-aueb' },
      { id: 'opa', testid: 'emvlima-aueb' },
      { id: 'asoee', testid: 'emvlima-aueb' },
      { id: 'auth', testid: 'emvlima-auth' },
      { id: 'apth', testid: 'emvlima-auth' },
      { id: 'upatras', testid: 'emvlima-upatras' },
      { id: 'patra', testid: 'emvlima-upatras' },
      { id: 'patras', testid: 'emvlima-upatras' },
      { id: 'uop', testid: 'emvlima-upatras' },
      { id: 'uoc', testid: 'emvlima-uoc' },
      { id: 'kriti', testid: 'emvlima-uoc' },
      { id: 'uok', testid: 'emvlima-uoc' },
      { id: 'duth', testid: 'emvlima-duth' },
      { id: 'thraki', testid: 'emvlima-duth' },
      { id: 'stem', testid: 'emvlima-stem' },
      { id: 'pliroforiki', testid: 'emvlima-stem' },
      { id: 'cs', testid: 'emvlima-stem' },
      { id: 'custom', testid: 'emvlima-custom' },
      { id: 'url', testid: 'emvlima-custom' },
      { id: 'allo', testid: 'emvlima-custom' },
    ];

    for (const { id, testid } of panepistimia) {
      const html = renderToStaticMarkup(<EikonidioPanepistimiou id={id} />);
      expect(html, `Apotyxia sto id: ${id}`).toContain(`data-testid="${testid}"`);
    }
  });

  it('epistrefei geniko fallback emvlima gia agnosto id', () => {
    const html = renderToStaticMarkup(<EikonidioPanepistimiou id="agnosto_id_sxolis" />);
    expect(html).toContain('data-testid="eikonidio-panepistimiou-geniko"');
    expect(html).toContain('data-testid="emvlima-geniko"');
  });

  it('xeirizetai megala/mikra grammata kai kena sto id', () => {
    const html = renderToStaticMarkup(<EikonidioPanepistimiou id="   UNIPI   " />);
    expect(html).toContain('data-testid="eikonidio-panepistimiou-unipi"');
  });
});

describe('EikonidioAsfaleias - local encrypted vault icon', () => {
  it('apodidei SVG asfaleias me proepilegmenes kai prosarmasmenes idiotites', () => {
    const html = renderToStaticMarkup(<EikonidioAsfaleias />);
    expect(html).toContain('<svg');
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
    expect(html).toContain('data-testid="eikonidio-asfaleias"');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Ασφάλεια κρυπτογραφημένου vault"');

    const megalo = renderToStaticMarkup(<EikonidioAsfaleias megethos={24} className="asfaleia-klasi" />);
    expect(megalo).toContain('width="24"');
    expect(megalo).toContain('class="asfaleia-klasi"');
  });
});

describe('kanonikopoiise_panepistimio_id & pare_panepistimio_dedomena', () => {
  it('kanonikopoiei swsta ta aliases ton panepistimion', () => {
    expect(kanonikopoiise_panepistimio_id('papei')).toBe('unipi');
    expect(kanonikopoiise_panepistimio_id('ekpa')).toBe('uoa');
    expect(kanonikopoiise_panepistimio_id('emp')).toBe('ntua');
    expect(kanonikopoiise_panepistimio_id('opa')).toBe('aueb');
    expect(kanonikopoiise_panepistimio_id('asoee')).toBe('aueb');
    expect(kanonikopoiise_panepistimio_id('apth')).toBe('auth');
    expect(kanonikopoiise_panepistimio_id('patra')).toBe('upatras');
    expect(kanonikopoiise_panepistimio_id('kriti')).toBe('uoc');
    expect(kanonikopoiise_panepistimio_id('thraki')).toBe('duth');
    expect(kanonikopoiise_panepistimio_id('pliroforiki')).toBe('stem');
    expect(kanonikopoiise_panepistimio_id('url')).toBe('custom');
    expect(kanonikopoiise_panepistimio_id('oti_na_nai')).toBe('geniko');
  });

  it('pare_panepistimio_dedomena anaktisei ta dedomena gia egkyra panepistimia', () => {
    const unipi = pare_panepistimio_dedomena('papei');
    expect(unipi).toBeDefined();
    expect(unipi?.syntomiOnomasia).toBe('ΠΑΠΕΙ');
    expect(unipi?.baseEclass).toBe('https://thales.cs.unipi.gr');
    expect(unipi?.katigoria).toBe('athina');

    const uoa = pare_panepistimio_dedomena('ekpa');
    expect(uoa?.syntomiOnomasia).toBe('ΕΚΠΑ');

    const custom = pare_panepistimio_dedomena('custom');
    expect(custom?.syntomiOnomasia).toBe('Custom');

    const miEgkyro = pare_panepistimio_dedomena('agnosto');
    expect(miEgkyro).toBeUndefined();
  });

  it('PANEPISTIMIA_LISTA perilamvanei ta vasika idrymata tis Elladas', () => {
    expect(PANEPISTIMIA_LISTA.length).toBeGreaterThanOrEqual(8);
    const ids = PANEPISTIMIA_LISTA.map((p) => p.id);
    expect(ids).toContain('unipi');
    expect(ids).toContain('uoa');
    expect(ids).toContain('ntua');
    expect(ids).toContain('aueb');
    expect(ids).toContain('auth');
    expect(ids).toContain('upatras');
    expect(ids).toContain('uoc');
    expect(ids).toContain('stem');
    expect(ids).toContain('custom');
  });
});

describe('Kanonas D11 & Tokens sto eikonidia-panepistimion.tsx', () => {
  it('o kodikos den periexei kanena mi egkekrimeno hex xroma', () => {
    const hexMatch = PIGI_KODIKA.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexMatch, `Vrethikan aytthaireta hex sto arxeio: ${hexMatch.join(', ')}`).toEqual([]);
  });

  it('i statiki apodosi ton emvlimaton xrisimopoiei apokleistika tokens tou systimatos', () => {
    for (const item of PANEPISTIMIA_LISTA) {
      const html = renderToStaticMarkup(<EikonidioPanepistimiou id={item.id} />);
      const hexMatch = html.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hexMatch, `To emvlima ${item.id} periexei hex xroma`).toEqual([]);
      expect(html).toContain('var(--xroma-');
    }
  });
});
