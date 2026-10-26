import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent as GeventoPedomati } from 'react';
import { Link } from 'react-router-dom';
import type { Enotita, Mathima, XartisMathimatos } from '@dps/core';
import { xrisiApothekisis } from '../../apothiki/index.js';
import { katagrapse_checkin, ypologismos_seri_meletis } from '../../apothiki/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import {
  Karta,
  MetrikosRing,
  OloniKatastasis,
  Pilegma,
  ProskelesioOmonimas,
} from '../../koinima/index.js';
import { fortosi, xoris_katastasi, type Katastasi } from '../../kathstasi/index.js';
import {
  fortose_mathimata_apo_apothiki,
  fortose_xartis_apo_apothiki,
  lepita_aristeias,
  pososto_aristeias,
} from '../../ypiresies/index.js';
import { EikonidioPanepistimiou, PANEPISTIMIA_LISTA } from '../../design/eikonidia-panepistimion.js';
import type { PanepistimioId } from '../../design/eikonidia-panepistimion.js';
import { stilise_imerominia } from '../../programma/programma-vohthia.js';
import { diadromi_odigou } from '../../navigasi/dromoi.js';

/** Πόσες ενότητες του χάρτη προτείνονται ως στόχοι της ημέρας. */
const PLITOS_STOCHOIS = 3;

/** Κείμενο πότε η ενότητα δεν έχει εκτιμώμενη διάρκεια. */
const LEPTA_CHORIS_EKTIMISI = 'χωρίς εκτίμηση';

/** Κείμενο του κουμπιού σήμανσης όσο η ενότητα δεν έχει ολοκληρωθεί. */
export const KEIMENO_STOXOU = 'Σημείωση ως ολοκληρωμένη';

/** Κείμενο του κουμπιού σήμανσης όταν η ενότητα έχει ολοκληρωθεί. */
export const KEIMENO_TELIOU = 'Ολοκληρώθηκε';

/** Ιδιότητες των μπλοκ της οθόνης Σήμερα, που παίρνουν έτοιμες ενότητες. */
export interface SimeraEnotitesProps {
  readonly enotites: readonly Enotita[];
}

/** Δακτύλιος προόδου μαθήματος: συνολικά λεπτά μελέτης και ποσοστό από τις αποθηκευμένες ολοκληρώσεις. */
export function MetrikesSimeras({ enotites }: SimeraEnotitesProps) {
  const apothiki = xrisiApothekisis();
  const telies = apothiki.proodhos.aristeiesEnotiton;
  const synolika_leqta = lepita_aristeias(enotites);
  const pososto = pososto_aristeias(enotites, telies);

  return (
    <div data-testid="simera-daiktylos">
      <Karta
        titlos="Πρόοδος μαθήματος"
        ypokeimeno={`${synolika_leqta} λεπτά αναμένουν στο σύνολο του μαθήματος`}
        stoixeia={
          <div className="karta-metrika">
            <MetrikosRing
              pososto={pososto}
              ypokeimeno={`${telies.length} από ${enotites.length} ολοκληρωμένες ενότητες`}
              ariaEtiketa="Πρόοδος μαθήματος"
            />
          </div>
        }
      />
    </div>
  );
}

/** Ιδιότητες μιας ενότητας-στόχου στην οθόνη Σήμερα. */
export interface StoxoiEnotitasProps {
  readonly enotita: Enotita;
  readonly tetagmeni: boolean;
  readonly allaxe_telia: (id: string) => Promise<void>;
}

/** Ενότητα-στόχος με τον δεσμό προς τον οδό μελέτης και το κουμπί σήμανσης ολοκλήρωσης. */
export function StoxosEnotitas({ enotita, tetagmeni, allaxe_telia }: StoxoiEnotitasProps) {
  const dromos = diadromi_odigou(enotita.id);
  const simaProspatheias = useCallback(
    async (gevento: GeventoPedomati<HTMLButtonElement>): Promise<void> => {
      gevento.preventDefault();
      await allaxe_telia(enotita.id);
    },
    [allaxe_telia, enotita.id]
  );

  return (
    <div className="simera-stoxos" data-testid="simera-stochos">
      {dromos === null ? (
        <div>
          <span className="simera-stoxos-titlos">{enotita.titlos}</span>
          <p role="status">Η ενότητα έχει μη έγκυρο αναγνωριστικό και δεν μπορεί να ανοιχτεί.</p>
        </div>
      ) : (
        <Link to={dromos} className="simera-stoxos-titlos">
          {enotita.titlos}
        </Link>
      )}
      <div className="odoni-xeiris">
        <Pilegma
          keimeno={
            enotita.lepta_ektimisi === null
              ? LEPTA_CHORIS_EKTIMISI
              : `${enotita.lepta_ektimisi} λεπτά`
          }
        />
        <button
          type="button"
          className={`pilegma${tetagmeni ? ' pilegma-entono' : ''}`}
          aria-pressed={tetagmeni}
          data-testid="simera-telos"
          onClick={simaProspatheias}
        >
          {tetagmeni ? KEIMENO_TELIOU : KEIMENO_STOXOU}
        </button>
      </div>
    </div>
  );
}

/** Λίστα «Στοχοί σήμερα» με τις πρώτες ενότητες του χάρτη, σημεισμένες από την αποθηκευμένη πρόοδο. */
export function StochoiSimeras({ enotites }: SimeraEnotitesProps) {
  const apothiki = xrisiApothekisis();
  const telies = apothiki.proodhos.aristeiesEnotiton;

  const stoichia = enotites.slice(0, PLITOS_STOCHOIS).map((enotita) => (
    <StoxosEnotitas
      key={enotita.id}
      enotita={enotita}
      tetagmeni={telies.includes(enotita.id)}
      allaxe_telia={apothiki.allaxe_telia}
    />
  ));

  return (
    <div data-testid="simera-stoxoi">
      <Karta titlos="Στοχοί σήμερα" stoixeia={stoichia} />
    </div>
  );
}

/** Οθόνη «Σήμερα»: η αρχική καρτέλα με πρόοδο μαθήματος και τους στόχους της ημέρας. */
export function Simera() {
  const apothiki = xrisiApothekisis();
  const periballon = xrisiPeriballontos();
  const [katastasi, set_katastasi] = useState<Katastasi<XartisMathimatos>>(
    fortosi<XartisMathimatos>()
  );
  const [proseis, set_proseis] = useState(0);
  const [mathimata, setMathimata] = useState<readonly Mathima[]>([]);

  useEffect(() => {
    let zontas = true;
    void fortose_mathimata_apo_apothiki(periballon.apothiki).then((fortotiki) => {
      if (zontas) {
        setMathimata(fortotiki.katastasi === 'etimo' ? fortotiki.dedomena : []);
      }
    });
    return () => {
      zontas = false;
    };
  }, [periballon.apothiki]);

  const epanalipsi = useCallback(() => {
    set_katastasi(fortosi<XartisMathimatos>());
    set_proseis((palies) => palies + 1);
  }, []);

  useEffect(() => {
    let zontas = true;
    void fortose_xartis_apo_apothiki(periballon.apothiki, apothiki.kodikosMathimatos).then(
      (fortotiki) => {
        if (zontas) {
          set_katastasi(fortotiki);
        }
      }
    );
    return () => {
      zontas = false;
    };
  }, [periballon.apothiki, apothiki.kodikosMathimatos, proseis]);

  const sygxronismena = mathimata.filter(
    (m) =>
      apothiki.rytheseis.mathimataSynch.includes(m.kodikos) ||
      m.katastasi_sygxronismou === 'Συγχρονισμένο' ||
      m.epilegmeno
  );

  const energo = mathimata.find((m) => m.kodikos === apothiki.kodikosMathimatos);

  const titlosEnergou = energo
    ? `${energo.kodikos} - ${energo.titlos}`
    : apothiki.kodikosMathimatos
      ? `${apothiki.kodikosMathimatos} - Μάθημα`
      : 'Δεν έχει επιλεγεί μάθημα';

  const panepistimioId = apothiki.rytheseis.panepistimioId as PanepistimioId;
  const panepistimio = PANEPISTIMIA_LISTA.find((p) => p.id === panepistimioId);

  const xartisDedomena = xoris_katastasi(katastasi);
  const telies = apothiki.proodhos.aristeiesEnotiton;
  const protiMiOlokliromeni =
    xartisDedomena?.enotites.find((e) => !telies.includes(e.id))?.id ??
    xartisDedomena?.enotites[0]?.id ??
    '';
  const dromosProtisEnotitas = diadromi_odigou(protiMiOlokliromeni) ?? '/mathimata';

  const exetaseis = apothiki.rytheseis.exetaseis ?? [];
  const simeraImerominia = new Date().toISOString().slice(0, 10);
  const mellontikesExetaseis = [...exetaseis]
    .filter((e) => (e.imerominia ?? '') >= simeraImerominia)
    .sort((a, b) => (a.imerominia ?? '').localeCompare(b.imerominia ?? ''));
  const epomeniEksetasi = mellontikesExetaseis[0];
  const imeresGiaEksetasi = epomeniEksetasi
    ? Math.max(
        0,
        Math.ceil(
          (new Date(epomeniEksetasi.imerominia ?? '').getTime() -
            new Date(simeraImerominia).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const [checkinLepta, setCheckinLepta] = useState(30);
  const [checkinMinima, setCheckinMinima] = useState<string | null>(null);
  const [checkinEktelountai, setCheckinEktelountai] = useState(false);

  const checkins = apothiki.proodhos.checkins ?? [];
  const seri = ypologismos_seri_meletis(checkins, simeraImerominia);

  const xeirismosCheckin = useCallback(async () => {
    if (checkinEktelountai) return;
    setCheckinEktelountai(true);
    setCheckinMinima(null);
    try {
      const kodikos = apothiki.kodikosMathimatos || (sygxronismena[0]?.kodikos ?? '');
      const enotitaId = protiMiOlokliromeni || (xartisDedomena?.enotites[0]?.id ?? 'en-1');
      await katagrapse_checkin(
        periballon.apothiki,
        kodikos,
        enotitaId,
        checkinLepta,
        false,
        simeraImerominia
      );
      setCheckinMinima('Καταγράφηκε επιτυχώς!');
      if (kodikos) {
        apothiki.allaxe_kodiko_mathimatos(kodikos);
      }
    } finally {
      setCheckinEktelountai(false);
    }
  }, [
    checkinEktelountai,
    apothiki,
    sygxronismena,
    protiMiOlokliromeni,
    xartisDedomena,
    periballon.apothiki,
    checkinLepta,
    simeraImerominia,
  ]);

  return (
    <div className="odoni-lista" data-testid="simera-ekran">
      <ProskelesioOmonimas
        titlos="Σήμερα"
        ypokeimeno="Η πρόοδός σου στο μάθημα, με μία ματιά"
        akseis={panepistimio !== undefined ? (
          <div className="simera-panepistimio-badge">
            <EikonidioPanepistimiou id={panepistimioId} megethos={18} />
            <span>{panepistimio.syntomiOnomasia}</span>
          </div>
        ) : undefined}
      />

      <div className="simera-seri-karta">
        <div className="simera-seri-kefali">
          <span className="simera-seri-titlos" data-testid="simera-seri">
            {seri === 1 ? '🔥 1 μέρα σερί' : `🔥 Σερί μελέτης: ${seri} ημέρες`}
          </span>
          <span className="simera-seri-ypotitlos">
            {seri > 0
              ? `🔥 ${seri} ${seri === 1 ? 'μέρα' : 'μέρες'} σερί`
              : 'Κατάγραψε τη σημερινή σου μελέτη για να ξεκινήσεις το σερί!'}
          </span>
        </div>
      </div>

      <div className="simera-checkin-karta">
        <div className="simera-checkin-header">
          <span className="simera-checkin-titlos">⚡ Γρήγορο Check-in Μελέτης</span>
          <span className="simera-checkin-perigrafi">
            Κατάγραψε τα λεπτά που μελέτησες σήμερα για να συνεχίσεις το σερί σου.
          </span>
        </div>
        <div className="simera-checkin-draseis">
          <input
            type="number"
            min={5}
            max={480}
            step={5}
            aria-label="Λεπτά μελέτης"
            className="simera-checkin-lepta"
            value={checkinLepta}
            onChange={(gevma) => setCheckinLepta(Number(gevma.target.value) || 0)}
          />
          <span className="odoni-xeiris-zeugos">λεπτά</span>
          <button
            type="button"
            className="pilegma pilegma-entono simera-checkin-koumpi"
            data-testid="simera-checkin"
            disabled={checkinEktelountai}
            onClick={() => {
              void xeirismosCheckin();
            }}
          >
            {checkinEktelountai ? 'Καταγραφή…' : 'Καταγραφή μελέτης'}
          </button>
          {checkinMinima !== null && (
            <span className="simera-checkin-minima">{checkinMinima}</span>
          )}
        </div>
      </div>

      <div className="simera-draseis-plegma">
        <Link to={dromosProtisEnotitas} className="simera-drasis-karta">
          <span className="simera-drasis-titlos">🚀 Μελέτη</span>
          <span className="simera-drasis-ypotitlos">{dromosProtisEnotitas !== '/mathimata' ? 'Συνέχιση επόμενης ενότητας' : 'Σύνδεση και συγχρονισμός μαθήματος'}</span>
        </Link>
        <Link to="/tutor" className="simera-drasis-karta">
          <span className="simera-drasis-titlos">🤖 AI Tutor</span>
          <span className="simera-drasis-ypotitlos">Ερωτήσεις &amp; Quiz</span>
        </Link>
        <Link to="/xartis" className="simera-drasis-karta">
          <span className="simera-drasis-titlos">🗺️ Ύλη</span>
          <span className="simera-drasis-ypotitlos">Χάρτης προόδου</span>
        </Link>
        <Link to="/programma" className="simera-drasis-karta">
          <span className="simera-drasis-titlos">📅 Πρόγραμμα</span>
          <span className="simera-drasis-ypotitlos">Εξεταστική &amp; Στόχοι</span>
        </Link>
      </div>

      {epomeniEksetasi !== undefined && (
        <Link to="/programma" className="simera-eksetasi-tile">
          <div className="simera-eksetasi-plirofories">
            <span className="simera-eksetasi-titlos">
              Επόμενη εξέταση: {epomeniEksetasi.kodikos_mathimatos}
            </span>
            <span className="simera-eksetasi-ypotitlos">
              {stilise_imerominia(epomeniEksetasi.imerominia) ?? epomeniEksetasi.imerominia}
            </span>
          </div>
          <div className="simera-eksetasi-imeres">
            <span>{imeresGiaEksetasi === 0 ? 'Σήμερα' : `${imeresGiaEksetasi}ημ.`}</span>
          </div>
        </Link>
      )}

      <div className="simera-energo-perioxhi">
        <div className="simera-energo-karta">
          <div className="simera-energo-header">
            <span className="simera-energo-etiketa">ΕΝΕΡΓΟ ΜΑΘΗΜΑ</span>
            <span className="simera-energo-titlos">{titlosEnergou}</span>
          </div>
          {sygxronismena.length > 1 && (
            <div className="kapsoules-filtra-mpara">
              {sygxronismena.map((m) => {
                const einaiEnergo = m.kodikos === apothiki.kodikosMathimatos;
                return (
                  <button
                    key={m.kodikos}
                    type="button"
                    className={einaiEnergo ? 'kapsoula-filtrou energi' : 'kapsoula-filtrou'}
                    onClick={() => {
                      apothiki.allaxe_kodiko_mathimatos(m.kodikos);
                    }}
                    aria-pressed={einaiEnergo}
                  >
                    {m.kodikos}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <OloniKatastasis
        katastasi={katastasi}
        adeioMinima="Δεν υπάρχουν ενότητες για να προτείνουμε σήμερα."
        epanalipsi={epanalipsi}
      >
        {(xartis) => (
          <>
            <MetrikesSimeras enotites={xartis.enotites} />
            <StochoiSimeras enotites={xartis.enotites} />
          </>
        )}
      </OloniKatastasis>
    </div>
  );
}

export default Simera;
