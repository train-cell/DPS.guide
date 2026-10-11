/**
 * Δοχείο της οθόνης ειδοποιήσεων (κάρτα P3).
 *
 * Φορτώνει την κατάσταση μέσω της δομική πύλας `EidopoiisiYpiresies` και την παραδίδει
 * στο παρουσιαστικό `OraEidopoiseon`. Δεν εισάγει το `@capacitor/local-notifications`:
 * η σύνδεση με το πραγματικό plugin γίνεται στο bootstrap της εφαρμογής
 * (δες `docs/requests/G-01.md`).
 *
 * Ποτέ λευκή οθόνη: χωρίς πύλα η οθόνη παραμένει σε φόρτωση με εξήγηση, όχι κενή σελίδα.
 */

import { useCallback, useEffect, useState } from 'react';
import { apo_apotelesma, fortosi } from '../kathstasi/index.js';
import type { Katastasi } from '../kathstasi/index.js';
import { OraEidopoiseon } from './ora-eidopoiseon.js';
import { MINIMA_SFALMA, pare_proedries } from './eidopoiiseis-ypiresies.js';
import { proedapes_eidopoiseis } from './eidopoiiseis-typoi.js';
import type {
  EidopoiisiProgrammatismeni,
  EidopoiisiYpiresies,
  KatastasiAdieas,
} from './eidopoiiseis-typoi.js';

/**
 * Λεπτά αναβολής της δοκιμαστικής ειδοποίησης — δύο λεπτά, ώστε ο χρήστης να έχει
 * χρόνο να κλείσει την εφαρμογή και να δει ότι η ειδοποίηση έφτασε (οδηγός P3).
 */
export const KHRISI_DOKIMIS_MS = 2 * 60 * 1000;

/** Ιδιότητες του δοχείου. */
export interface RythisiesEidopoiseonProps {
  /** Η πύλα ειδοποιήσεων· χωρίς αυτή η οθόνη δείχνει φόρτωση, όχι λευκή οθόνη. */
  readonly ypiresies?: EidopoiisiYpiresies;
  /** Ελεύθερο κείμενο ενότητας για τα μηνύματα — ποτέ κωδικός μαθήματος. */
  readonly onoma?: string;
  /** Επιτρέπει στα τεστ να δώσουν κατάσταση χωρίς πύλα (μόνο για tests). */
  readonly arxikiKatastasi?: Katastasi<EidopoiisiProgrammatismeni[]>;
}

export default function RythisiesEidopoiseon({
  ypiresies,
  onoma = '',
  arxikiKatastasi,
}: RythisiesEidopoiseonProps) {
  const proedapes = proedapes_eidopoiseis();
  const [adia, setAdia] = useState<KatastasiAdieas | null>(null);
  const [rytheseis, setRytheseis] = useState(proedapes);
  const [katastasi, setKatastasi] = useState<Katastasi<EidopoiisiProgrammatismeni[]>>(
    () => arxikiKatastasi ?? fortosi()
  );
  const [apotel, setApotel] = useState<string | null>(null);

  const fortose = useCallback(() => {
    if (ypiresies === undefined) {
      return;
    }
    void (async () => {
      setKatastasi(fortosi());
      const proedres = await ypiresies.lista();
      setKatastasi(apo_apotelesma(proedres, (dedomena) => dedomena.length === 0));
    })();
  }, [ypiresies]);

  useEffect(() => {
    if (ypiresies === undefined) {
      return;
    }
    void (async () => {
      const stathmosAdias = await ypiresies.zitise_adia();
      if (!stathmosAdias.ok) {
        setApotel(MINIMA_SFALMA);
        return;
      }
      setAdia(stathmosAdias.timi);
      setRytheseis((palies) => ({ ...palies, einaiEnergies: stathmosAdias.timi === 'granted' }));
    })();
    fortose();
  }, [ypiresies, fortose]);

  const allaze_lepta = useCallback((lepta: number) => {
    setRytheseis((palies) => ({ ...palies, leptaProeidopoisis: pare_proedries(lepta) }));
  }, []);

  const zitise_adeia = useCallback(() => {
    if (ypiresies === undefined) {
      return;
    }
    void (async () => {
      const a = await ypiresies.zitisi_adias();
      if (!a.ok) {
        setApotel(MINIMA_SFALMA);
        return;
      }
      setAdia(a.timi);
      setRytheseis((palies) => ({ ...palies, einaiEnergies: a.timi === 'granted' }));
    })();
  }, [ypiresies]);

  const dokimi = useCallback(() => {
    if (ypiresies === undefined) {
      return;
    }
    void (async () => {
      const otn = new Date(Date.now() + KHRISI_DOKIMIS_MS);
      const a = await ypiresies.programmatise_dokimi(otn, rytheseis.leptaProeidopoisis);
      setApotel(a.ok ? 'Η δοκιμαστική ειδοποίηση μπήκε σε αναμονή.' : MINIMA_SFALMA);
      fortose();
    })();
  }, [ypiresies, rytheseis.leptaProeidopoisis, fortose]);

  const akiro_oles = useCallback(() => {
    if (ypiresies === undefined) {
      return;
    }
    void (async () => {
      const a = await ypiresies.akiro_ol();
      setApotel(a.ok ? 'Ακυρώθηκαν όλες οι υπενθυμίσεις.' : MINIMA_SFALMA);
      fortose();
    })();
  }, [ypiresies, fortose]);

  if (ypiresies === undefined) {
    return (
      <div className="odoni-lista" data-testid="eidopoiseis-ekran">
        <OraEidopoiseon
          katastasi={fortosi()}
          adia={null}
          rytheseis={proedapes}
          allaze_lepta={allaze_lepta}
          zitise_adeia={zitise_adeia}
          dokimi={dokimi}
          akiro_oles={akiro_oles}
          epanalipsi={fortose}
          apotel={apotel}
          onoma={onoma}
        />
      </div>
    );
  }

  return (
    <OraEidopoiseon
      katastasi={katastasi}
      adia={adia}
      rytheseis={rytheseis}
      allaze_lepta={allaze_lepta}
      zitise_adeia={zitise_adeia}
      dokimi={dokimi}
      akiro_oles={akiro_oles}
      epanalipsi={fortose}
      apotel={apotel}
      onoma={onoma}
    />
  );
}