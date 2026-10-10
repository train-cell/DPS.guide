import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Periballon } from '../periballon/periballon.js';
import { ftiaxe_periballon } from '../periballon/periballon.js';
import type { Rytheseis, Proodhos } from './apothiki-typoi.js';
import {
  fortose_proodho,
  fortose_rytheseis,
  grapse_rytheseis,
  allaxe_aristeia,
  proedapes_proodhou,
  proedapes_rytheseis,
} from './apothiki-ypiresies.js';

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
}

const ApothikiSunexo = createContext<ApothikiSyntheseon | null>(null);

/** Ιδιότητες του παρόχου. */
export interface ParoxeProps {
  readonly children: ReactNode;
  /** Προαιρετικό Periballon για tests· προεπιλογή η in-memory στοίβα. */
  readonly periballon?: Periballon;
  /** Ποιο μάθημα φορτώνει η αρχική πρόοδος. */
  readonly kodikosMathimatos?: string;
}

/** Παρέχει τις ρυθμίσεις και την πρόοδο σε ολόκληρη την εφαρμογή, φορτωμένα από τη θύρα αποθήκευσης. */
export function ParoxeApothekisis({ children, periballon, kodikosMathimatos = 'ΠΛΗ201' }: ParoxeProps) {
  const pyles = useMemo(() => periballon ?? ftiaxe_periballon(), [periballon]);
  const [rytheseis, setRytheseis] = useState<Rytheseis>(proedapes_rytheseis);
  const [proodhos, setProodhos] = useState<Proodhos>(proedapes_proodhou);
  const [fortizomeni, setFortizomeni] = useState(true);

  useEffect(() => {
    let zalive = true;
    void (async () => {
      const [fortesRytheseis, fortesProodhos] = await Promise.all([
        fortose_rytheseis(pyles.apothiki),
        fortose_proodho(pyles.apothiki, kodikosMathimatos),
      ]);
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

  const timi = useMemo<ApothikiSyntheseon>(
    () => ({ rytheseis, proodhos, kodikosMathimatos, allaxe_telia, allaxe_rytheseis: allaxe_rytheseis_cb }),
    [rytheseis, proodhos, kodikosMathimatos, allaxe_telia, allaxe_rytheseis_cb]
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
  };
}