import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Periballon } from '../periballon/periballon.js';
import { xrisiPeriballontos } from '../periballon/provolos.js';
import type { Rytheseis, Proodhos } from './apothiki-typoi.js';
import {
  fortose_proodho,
  fortose_rytheseis,
  grapse_rytheseis,
  allaxe_aristeia,
  proedapes_proodhou,
  proedapes_rytheseis,
} from './apothiki-ypiresies.js';
import { sporse_deigma } from '../pseudomata/sporse.js';
import { fortose_mathimata_apo_apothiki } from '../ypiresies/mathimata.js';

/** Τι εκθέτει ο πάροχος της κατάστασης αποθήκευσης στην εφαρμογή. */
export interface ApothikiSyntheseon {
  /** Οι ρυθμίσεις, φορτωμένες από τη θύρα αποθήκευσης. */
  readonly rytheseis: Rytheseis;
  /** Η πρόοδος του επιλεγμένου μαθήματος. */
  readonly proodhos: Proodhos;
  /** Ο κωδικός μαθήματος για τον οποίο φορτώθηκε η πρόοδος. */
  readonly kodikosMathimatos: string;
  /** Αλλάζει μια ενότητα ως ολοκληρωμένη/μη και αποθηκεύει. */
  readonly allaxe_telia: (enotitaId: string) => Promise<void>;
  /** Αποθηκεύει νέες ρυθμίσεις. */
  readonly allaxe_rytheseis: (rytheseis: Rytheseis) => Promise<void>;
  /** Αλλάζει το ενεργό μάθημα και επαναφορτώνει την πρόοδο. */
  readonly allaxe_kodiko_mathimatos: (kodikos: string) => void;
}

const ApothikiSunexo = createContext<ApothikiSyntheseon | null>(null);

/** Ιδιότητες του παρόχου. */
export interface ParoxeProps {
  readonly children: ReactNode;
  /** Προαιρετικό Periballon για tests· προεπιλογή το περιβάλλον από τον πάροχο εφαρμογής. */
  readonly periballon?: Periballon;
  /** Ποιο μάθημα φορτώνει η αρχική πρόοδος. */
  readonly kodikosMathimatos?: string;
}

/** Παρέχει τις ρυθμίσεις και την πρόοδο σε ολόκληρη την εφαρμογή, φορτωμένα από τη θύρα αποθήκευσης. */
export function ParoxeApothekisis({ children, periballon, kodikosMathimatos: arxikosKodikos = 'ΠΛΗ201' }: ParoxeProps) {
  const periballonEfarmogis = xrisiPeriballontos();
  const pyles = useMemo(
    () => periballon ?? periballonEfarmogis,
    [periballon, periballonEfarmogis]
  );
  const [rytheseis, setRytheseis] = useState<Rytheseis>(proedapes_rytheseis);
  const [proodhos, setProodhos] = useState<Proodhos>(proedapes_proodhou);
  const [kodikosMathimatos, setKodikosMathimatos] = useState<string>(arxikosKodikos);
  const [fortizomeni, setFortizomeni] = useState(true);

  useEffect(() => {
    setKodikosMathimatos(arxikosKodikos);
  }, [arxikosKodikos]);

  useEffect(() => {
    let zalive = true;
    void (async () => {
      if (pyles.deigma) {
        await sporse_deigma(pyles.apothiki);
      }
      const [fortesRytheseis, mathimataKatastasi] = await Promise.all([
        fortose_rytheseis(pyles.apothiki),
        fortose_mathimata_apo_apothiki(pyles.apothiki),
      ]);

      let trexonKodikos = kodikosMathimatos;
      if (mathimataKatastasi.katastasi === 'etimo' && mathimataKatastasi.dedomena.length > 0) {
        const yparxei = mathimataKatastasi.dedomena.some((m) => m.kodikos === trexonKodikos);
        if (!yparxei && trexonKodikos === 'ΠΛΗ201') {
          trexonKodikos = mathimataKatastasi.dedomena[0]?.kodikos ?? trexonKodikos;
          setKodikosMathimatos(trexonKodikos);
        }
      }

      const fortesProodhos = await fortose_proodho(pyles.apothiki, trexonKodikos);
      if (zalive) {
        setRytheseis(fortesRytheseis);
        setProodhos(fortesProodhos);
        setFortizomeni(false);
      }
    })();
    return () => {
      zalive = false;
    };
  }, [pyles, kodikosMathimatos]);

  const allaxe_telia = useCallback(
    async (enotitaId: string) => {
      const nea = await allaxe_aristeia(
        pyles.apothiki,
        kodikosMathimatos,
        enotitaId,
        !proodhos.aristeiesEnotiton.includes(enotitaId)
      );
      setProodhos(nea);
    },
    [pyles, kodikosMathimatos, proodhos]
  );

  const allaxe_rytheseis_cb = useCallback(
    async (nees: Rytheseis) => {
      await grapse_rytheseis(pyles.apothiki, nees);
      setRytheseis(nees);
    },
    [pyles]
  );

  const allaxe_kodiko_mathimatos = useCallback(
    (kodikos: string) => {
      setKodikosMathimatos(kodikos);
      void fortose_proodho(pyles.apothiki, kodikos).then((neaProodhos) => {
        setProodhos(neaProodhos);
      });
    },
    [pyles]
  );

  const timi = useMemo<ApothikiSyntheseon>(
    () => ({
      rytheseis,
      proodhos,
      kodikosMathimatos,
      allaxe_telia,
      allaxe_rytheseis: allaxe_rytheseis_cb,
      allaxe_kodiko_mathimatos,
    }),
    [rytheseis, proodhos, kodikosMathimatos, allaxe_telia, allaxe_rytheseis_cb, allaxe_kodiko_mathimatos]
  );

  if (fortizomeni) {
    return null;
  }
  return <ApothikiSunexo.Provider value={timi}>{children}</ApothikiSunexo.Provider>;
}

/** Πρόσβαση στην κατάσταση αποθήκευσης· επιστρέφει αρχικές τιμές αν δεν υπάρχει Provider. */
export function xrisiApothekisis(): ApothikiSyntheseon {
  const timi = useContext(ApothikiSunexo);
  return timi ?? {
    rytheseis: proedapes_rytheseis(),
    proodhos: proedapes_proodhou(),
    kodikosMathimatos: '',
    allaxe_telia: async () => undefined,
    allaxe_rytheseis: async () => undefined,
    allaxe_kodiko_mathimatos: () => undefined,
  };
}
