import { describe, it, expect } from 'vitest';
import {
  fere_ola_ta_panepistimia,
  vres_panepistimio_apo_id,
  vres_panepistimio_apo_url,
  filtrare_panepistimia,
  ftiaxe_prosarmogi_panepistimiou,
  ID_PROEPILEGMENTOU_PANEPISTIMIOU,
  URL_PROEPILEGMENTOU_PANEPISTIMIOU,
  LISTA_PANEPISTIMION,
  PANEPISTIMIA,
} from './index.js';

describe('Domain Module Panepistimia', () => {
  describe('Katalogos kai Statheres Panepistimion', () => {
    it('periexei toulaxiston 25 ellinika akadimaika portals', () => {
      const lista = fere_ola_ta_panepistimia();
      expect(lista.length).toBeGreaterThanOrEqual(25);
      expect(PANEPISTIMIA).toBe(LISTA_PANEPISTIMION);
    });

    it('kathe panepistimio exei egkyra kai pliri pedia', () => {
      const lista = fere_ola_ta_panepistimia();
      const ids = new Set<string>();

      for (const p of lista) {
        expect(p.id).toBeTruthy();
        expect(p.onoma).toBeTruthy();
        expect(p.syntomi_onomasia).toBeTruthy();
        expect(p.tmima).toBeTruthy();
        expect(p.poli).toBeTruthy();
        expect(['athina', 'thessaloniki', 'patra', 'kriti', 'perifereia', 'eidiko']).toContain(
          p.perioxh
        );
        expect(['pliroforiki_stem', 'geniko', 'polytexneio']).toContain(p.kategoria);
        expect(p.base_url.startsWith('https://')).toBe(true);
        expect(['openeclass', 'moodle', 'custom']).toContain(p.typos_lms);
        expect(['topiki', 'cas']).toContain(p.typos_auth);
        expect(p.xromata.vasiko).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(p.xromata.tonismeno).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(p.syntomo_eikonidio).toBeTruthy();

        // Monadikotita ID
        expect(ids.has(p.id)).toBe(false);
        ids.add(p.id);
      }
    });

    it('to proepilegmeno panepistimio yparxei kai exei to anamenomeno url', () => {
      expect(ID_PROEPILEGMENTOU_PANEPISTIMIOU).toBe('unipi_cs');
      expect(URL_PROEPILEGMENTOU_PANEPISTIMIOU).toBe('https://thales.cs.unipi.gr');

      const proepilegmeno = vres_panepistimio_apo_id(ID_PROEPILEGMENTOU_PANEPISTIMIOU);
      expect(proepilegmeno).toBeDefined();
      expect(proepilegmeno?.id).toBe('unipi_cs');
      expect(proepilegmeno?.base_url).toBe(URL_PROEPILEGMENTOU_PANEPISTIMIOU);
      expect(proepilegmeno?.onoma).toBe('Πανεπιστήμιο Πειραιώς');
      expect(proepilegmeno?.tmima).toBe('Τμήμα Πληροφορικής');
    });

    it('perilamvanei ola ta zitoumena panepistimia me swsta urls', () => {
      const anamenomenaIds: Record<string, string> = {
        unipi_cs: 'https://thales.cs.unipi.gr',
        unipi: 'https://eclass.unipi.gr',
        uoa_dit: 'https://eclass.uoa.gr',
        aueb_cs: 'https://eclass.aueb.gr',
        ntua_mycourses: 'https://mycourses.ntua.gr',
        auth_cs: 'https://eclass.auth.gr',
        upatras_ceid: 'https://eclass.upatras.gr',
        uoc_csd: 'https://eclass.uoc.gr',
        tuc_ece: 'https://eclass.tuc.gr',
        duth_ee: 'https://eclass.duth.gr',
        uoi_cs: 'https://ecourse.uoi.gr',
        uth_inf: 'https://eclass.uth.gr',
        hua_dit: 'https://eclass.hua.gr',
        panteion: 'https://eclass.panteion.gr',
        aegean_icsd: 'https://eclass.aegean.gr',
        ionio_di: 'https://eclass.ionio.gr',
        uowm_ece: 'https://eclass.uowm.gr',
        uop_dit: 'https://eclass.uop.gr',
        uniwa_ice: 'https://eclass.uniwa.gr',
        hmu_cs: 'https://eclass.hmu.gr',
        ihu_iee: 'https://eclass.ihu.gr',
        aua: 'https://eclass.aua.gr',
        asfa: 'https://eclass.asfa.gr',
        aspete: 'https://eclass.aspete.gr',
        eap: 'https://courses.eap.gr',
      };

      for (const [id, url] of Object.entries(anamenomenaIds)) {
        const panepistimio = vres_panepistimio_apo_id(id);
        expect(panepistimio, `Panepistimio ${id} den vrethike`).toBeDefined();
        expect(panepistimio?.base_url).toBe(url);
      }
    });
  });

  describe('Anazitisi apo ID (vres_panepistimio_apo_id)', () => {
    it('epistrefei panepistimio me akrives id', () => {
      const p = vres_panepistimio_apo_id('uoa_dit');
      expect(p).toBeDefined();
      expect(p?.id).toBe('uoa_dit');
      expect(p?.syntomi_onomasia).toBe('ΕΚΠΑ');
    });

    it('leitourgei aneksartita apo peza/kefalaia kai kena', () => {
      const p1 = vres_panepistimio_apo_id('  UOA_DIT  ');
      expect(p1).toBeDefined();
      expect(p1?.id).toBe('uoa_dit');

      const p2 = vres_panepistimio_apo_id('AUEB_CS');
      expect(p2).toBeDefined();
      expect(p2?.id).toBe('aueb_cs');
    });

    it('epistrefei undefined gia keno id i mh yparkto id', () => {
      expect(vres_panepistimio_apo_id('')).toBeUndefined();
      expect(vres_panepistimio_apo_id('   ')).toBeUndefined();
      expect(vres_panepistimio_apo_id('mh_yparkto_id')).toBeUndefined();
    });
  });

  describe('Anazitisi apo URL (vres_panepistimio_apo_url)', () => {
    it('epistrefei panepistimio me akrives URL', () => {
      const p = vres_panepistimio_apo_url('https://thales.cs.unipi.gr');
      expect(p).toBeDefined();
      expect(p?.id).toBe('unipi_cs');
    });

    it('epistrefei panepistimio me URL me trailing slash', () => {
      const p = vres_panepistimio_apo_url('https://thales.cs.unipi.gr/');
      expect(p).toBeDefined();
      expect(p?.id).toBe('unipi_cs');
    });

    it('epistrefei panepistimio me esoteriki diadromi mathimatos', () => {
      const p = vres_panepistimio_apo_url('https://thales.cs.unipi.gr/courses/PLI101/');
      expect(p).toBeDefined();
      expect(p?.id).toBe('unipi_cs');
    });

    it('epistrefei panepistimio xwris protokollo http/https', () => {
      const p = vres_panepistimio_apo_url('thales.cs.unipi.gr');
      expect(p).toBeDefined();
      expect(p?.id).toBe('unipi_cs');
    });

    it('epistrefei panepistimio aneksartita apo kefalaia sto url', () => {
      const p = vres_panepistimio_apo_url('HTTPS://ECLASS.UOA.GR/MODULES/AUTH');
      expect(p).toBeDefined();
      expect(p?.id).toBe('uoa_dit');
    });

    it('kanei match me port an yparxei sto url', () => {
      const p = vres_panepistimio_apo_url('https://thales.cs.unipi.gr:8443/test');
      expect(p).toBeDefined();
      expect(p?.id).toBe('unipi_cs');
    });

    it('kanei match me diaforetiko protokollo meso hostname', () => {
      const p = vres_panepistimio_apo_url('http://thales.cs.unipi.gr');
      expect(p).toBeDefined();
      expect(p?.id).toBe('unipi_cs');
    });

    it('epistrefei undefined gia keno, asxeto h mh egkyro url', () => {
      expect(vres_panepistimio_apo_url('')).toBeUndefined();
      expect(vres_panepistimio_apo_url('   ')).toBeUndefined();
      expect(vres_panepistimio_apo_url('https://')).toBeUndefined();
      expect(vres_panepistimio_apo_url('https://google.com')).toBeUndefined();
      expect(vres_panepistimio_apo_url('https://den-yparxei.edu.gr')).toBeUndefined();
      expect(vres_panepistimio_apo_url('https://:::')).toBeUndefined();
      expect(vres_panepistimio_apo_url('https://:::/subpath')).toBeUndefined();
    });
  });

  describe('Filtrarisma Panepistimion (filtrare_panepistimia)', () => {
    it('epistrefei ola ta panepistimia otan den dinontai kritiria', () => {
      const ola = fere_ola_ta_panepistimia();
      const apotelesma = filtrare_panepistimia({});
      expect(apotelesma.length).toBe(ola.length);
    });

    it('filtrarei me vasi tin anazitisi keimenou (onoma, tmima, poli, id, url)', () => {
      // Anazitisi me onoma me tonous kai xwris tonous
      const resTonoi = filtrare_panepistimia({ anazitisi: 'Πειραιάς' });
      const resXwrisTonous = filtrare_panepistimia({ anazitisi: 'πειραιας' });
      expect(resTonoi.length).toBeGreaterThanOrEqual(2);
      expect(resTonoi.map((p) => p.id)).toEqual(resXwrisTonous.map((p) => p.id));
      expect(resTonoi.some((p) => p.id === 'unipi_cs')).toBe(true);
      expect(resTonoi.some((p) => p.id === 'unipi')).toBe(true);

      // Anazitisi me tmima
      const resTmima = filtrare_panepistimia({ anazitisi: 'Τηλεπικοινωνιών' });
      expect(resTmima.length).toBeGreaterThan(0);
      expect(resTmima.some((p) => p.id === 'uoa_dit')).toBe(true);

      // Anazitisi me syntomi onomasia
      const resEmp = filtrare_panepistimia({ anazitisi: 'ΕΜΠ' });
      expect(resEmp.some((p) => p.id === 'ntua_mycourses')).toBe(true);

      // Anazitisi me id
      const resId = filtrare_panepistimia({ anazitisi: 'auth_cs' });
      expect(resId.length).toBe(1);
      expect(resId[0]?.id).toBe('auth_cs');

      // Anazitisi me url host
      const resUrl = filtrare_panepistimia({ anazitisi: 'ecourse.uoi.gr' });
      expect(resUrl.length).toBe(1);
      expect(resUrl[0]?.id).toBe('uoi_cs');

      // Keno anazitisi string
      const resKeno = filtrare_panepistimia({ anazitisi: '   ' });
      expect(resKeno.length).toBe(fere_ola_ta_panepistimia().length);

      // Mh yparkto lektiko
      const resMhYparkto = filtrare_panepistimia({ anazitisi: 'xyznonexistent123' });
      expect(resMhYparkto.length).toBe(0);
    });

    it('filtrarei me vasi tin perioxi', () => {
      const athina = filtrare_panepistimia({ perioxh: 'athina' });
      expect(athina.length).toBeGreaterThan(0);
      expect(athina.every((p) => p.perioxh === 'athina')).toBe(true);

      const thessaloniki = filtrare_panepistimia({ perioxh: 'thessaloniki' });
      expect(thessaloniki.length).toBeGreaterThan(0);
      expect(thessaloniki.every((p) => p.perioxh === 'thessaloniki')).toBe(true);

      const patra = filtrare_panepistimia({ perioxh: 'patra' });
      expect(patra.length).toBeGreaterThan(0);
      expect(patra.every((p) => p.perioxh === 'patra')).toBe(true);

      const kriti = filtrare_panepistimia({ perioxh: 'kriti' });
      expect(kriti.length).toBeGreaterThan(0);
      expect(kriti.every((p) => p.perioxh === 'kriti')).toBe(true);

      const perifereia = filtrare_panepistimia({ perioxh: 'perifereia' });
      expect(perifereia.length).toBeGreaterThan(0);
      expect(perifereia.every((p) => p.perioxh === 'perifereia')).toBe(true);

      const eidiko = filtrare_panepistimia({ perioxh: 'eidiko' });
      expect(eidiko.length).toBe(1);
      expect(eidiko[0]?.id).toBe('eap');
    });

    it('filtrarei me vasi tin katigoria spoudon', () => {
      const stem = filtrare_panepistimia({ kategoria: 'pliroforiki_stem' });
      expect(stem.length).toBeGreaterThan(0);
      expect(stem.every((p) => p.kategoria === 'pliroforiki_stem')).toBe(true);

      const poly = filtrare_panepistimia({ kategoria: 'polytexneio' });
      expect(poly.length).toBeGreaterThan(0);
      expect(poly.every((p) => p.kategoria === 'polytexneio')).toBe(true);

      const geniko = filtrare_panepistimia({ kategoria: 'geniko' });
      expect(geniko.length).toBeGreaterThan(0);
      expect(geniko.every((p) => p.kategoria === 'geniko')).toBe(true);
    });

    it('syndyazei polla filtra taytoxrona', () => {
      const syndyasmos = filtrare_panepistimia({
        perioxh: 'athina',
        kategoria: 'polytexneio',
        anazitisi: 'Μετσόβιο',
      });
      expect(syndyasmos.length).toBe(1);
      expect(syndyasmos[0]?.id).toBe('ntua_mycourses');

      // Asymvato filtro epistrefei keno pinaka
      const asymvato = filtrare_panepistimia({
        perioxh: 'kriti',
        kategoria: 'polytexneio',
        anazitisi: 'ΕΚΠΑ',
      });
      expect(asymvato.length).toBe(0);
    });
  });

  describe('Dimiourgia Prosarmogis (ftiaxe_prosarmogi_panepistimiou)', () => {
    it('dimiourgei prosarmogi me dwsmeno onoma kai kanonikopoiimeno url', () => {
      const custom = ftiaxe_prosarmogi_panepistimiou(
        'https://moodle.myschool.edu.gr/',
        'Πειραματικό Πανεπιστήμιο'
      );

      expect(custom.id).toBe('custom_moodle_myschool_edu_gr');
      expect(custom.onoma).toBe('Πειραματικό Πανεπιστήμιο');
      expect(custom.syntomi_onomasia).toBe('CUSTOM');
      expect(custom.base_url).toBe('https://moodle.myschool.edu.gr');
      expect(custom.typos_lms).toBe('custom');
      expect(custom.typos_auth).toBe('topiki');
      expect(custom.perioxh).toBe('eidiko');
      expect(custom.kategoria).toBe('geniko');
      expect(custom.cas_url).toBeUndefined();
      expect(custom.xromata.vasiko).toBe('#4a5568');
      expect(custom.xromata.tonismeno).toBe('#718096');
      expect(custom.syntomo_eikonidio).toBe('custom');
    });

    it('prosthetei https otan leipei to protokollo sto base_url', () => {
      const custom = ftiaxe_prosarmogi_panepistimiou('mycustom.eclass.gr/portal');
      expect(custom.base_url).toBe('https://mycustom.eclass.gr/portal');
      expect(custom.id).toBe('custom_mycustom_eclass_gr');
      expect(custom.onoma).toBe('Προσαρμοσμένο (mycustom.eclass.gr)');
    });

    it('paragei proepilegmeno onoma otan den parexetai onoma i einai keno', () => {
      const c1 = ftiaxe_prosarmogi_panepistimiou('https://eclass.test.org');
      expect(c1.onoma).toBe('Προσαρμοσμένο (eclass.test.org)');

      const c2 = ftiaxe_prosarmogi_panepistimiou('https://eclass.test.org', '   ');
      expect(c2.onoma).toBe('Προσαρμοσμένο (eclass.test.org)');
    });

    it('xeirizetai keno h akatalilo url me asfaleia', () => {
      const custom = ftiaxe_prosarmogi_panepistimiou('');
      expect(custom.id).toBe('custom_custom');
      expect(custom.onoma).toBe('Προσαρμοσμένο (custom)');
      expect(custom.base_url).toBe('');
    });
  });
});
