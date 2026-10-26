import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import { PlisiOmonimas } from './plisi.js';
import type { ReactNode } from 'react';
import type { EidopoiisiYpiresies } from '../eidopoiiseis/eidopoiiseis-typoi.js';
import { xrisiPeriballontos } from '../periballon/provolos.js';

const Simera = lazy(() => import('../othoni/simera/simera.js'));
const Mathimata = lazy(() => import('../othoni/mathimata/mathimata.js'));
const XartisEnotiton = lazy(() => import('../othoni/xartis/xartis.js'));
const OdigosMeletis = lazy(() => import('../othoni/odigos/odigos.js'));
const TutorChat = lazy(() => import('../othoni/tutor/tutor.js'));
const Rythisies = lazy(() => import('../othoni/rythisies/rythisies.js'));
const RythisiesAi = lazy(() => import('../othoni/rythisies/rythisies-ai.js'));
const Proedri = lazy(() => import('../othoni/proedri/proedri.js'));
const ProvoliPdf = lazy(() => import('../provoli-pdf/provoli-pdf.js'));
const RythmiseisProgrammatos = lazy(() => import('../programma/programma.js'));
const EidopoiiseisRoute = lazy(() => import('../eidopoiiseis/route.js'));

/** Οι διαδρομές της εφαρμογής, μία ανά οθόνη. */
export const ODOI: readonly { readonly diadromi: string; readonly onoma: string }[] = [
  { diadromi: '/simera', onoma: 'Σήμερα' },
  { diadromi: '/mathimata', onoma: 'Μαθήματα' },
  { diadromi: '/xartis', onoma: 'Χάρτης Ενοτήτων' },
  { diadromi: '/odigos/:enotitaId', onoma: 'Οδηγός Μελέτης' },
  { diadromi: '/tutor', onoma: 'Tutor Chat' },
  { diadromi: '/rythisies', onoma: 'Ρυθμίσεις' },
  { diadromi: '/rythisies/ai', onoma: 'Ρυθμίσεις AI & Vault' },
  { diadromi: '/proedri', onoma: 'Onboarding' },
  { diadromi: '/provoli/:arxeioId/:selida', onoma: 'Προβολή PDF' },
  { diadromi: '/programma', onoma: 'Πρόγραμμα' },
  { diadromi: '/eidopoiiseis', onoma: 'Ειδοποιήσεις' },
  { diadromi: '/eidopoiseis', onoma: 'Ειδοποιήσεις' },
] as const;

/** Περιτύλιγμα σελίδας με capsule navigation. */
function meNav(children: ReactNode, xronos = true) {
  return (
    <PlisiOmonimas meNav={xronos}>
      <Suspense fallback={<p role="status">Φόρτωση οθόνης…</p>}>
        {children}
      </Suspense>
    </PlisiOmonimas>
  );
}

/** Έξυπνη αρχική δρομολόγηση: Onboarding για νέους χρήστες, Σήμερα για συνδεδεμένους. */
function ArxikiDromologisi() {
  const periballon = xrisiPeriballontos();
  const [exeiSindesi, setExeiSindesi] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      periballon.mystika.pare('eclass_onoma_xristi'),
      periballon.mystika.pare('eclass_base_url'),
    ]).then(([username, baseUrl]) => {
      if (active) setExeiSindesi(Boolean(username && baseUrl));
    }).catch(() => {
      if (active) setExeiSindesi(false);
    });
    return () => { active = false; };
  }, [periballon.mystika]);

  if (exeiSindesi === null) return meNav(<p role="status">Φόρτωση τοπικού προφίλ…</p>, false);

  return exeiSindesi ? meNav(<Simera />) : meNav(<Proedri />, false);
}

export interface OdoiNavigisisProps {
  readonly ypiresiesEidopoiseon?: EidopoiisiYpiresies;
}

/**
 * Ο χάρτης διαδρομών. Το <Routes> πρέπει να είναι ΑΜΕΣΟ child του <IonRouterOutlet>:
 * το Ionic διαβάζει τα children του outlet για να δημιουργήσει το page stack, και ένα
 * wrapper component αφήνει το outlet κενό.
 */
export function OdoiNavigisis({
  ypiresiesEidopoiseon,
}: OdoiNavigisisProps = {}) {
  return (
    <IonRouterOutlet>
      <Routes>
        <Route path="/" element={<ArxikiDromologisi />} />
        <Route path="/simera" element={meNav(<Simera />)} />
        <Route path="/mathimata" element={meNav(<Mathimata />)} />
        <Route path="/xartis" element={meNav(<XartisEnotiton />)} />
        <Route path="/odigos/:enotitaId" element={meNav(<OdigosMeletis />)} />
        <Route path="/provoli/:arxeioId/:selida" element={meNav(<ProvoliPdf />)} />
        <Route path="/programma" element={meNav(<RythmiseisProgrammatos />)} />
        <Route path="/tutor" element={meNav(<TutorChat />)} />
        <Route path="/rythisies" element={meNav(<Rythisies />)} />
        <Route path="/rythisies/ai" element={meNav(<RythisiesAi />)} />
        <Route
          path="/eidopoiiseis"
          element={meNav(<EidopoiiseisRoute ypiresiesEidopoiseon={ypiresiesEidopoiseon} />)}
        />
        <Route
          path="/eidopoiseis"
          element={meNav(<EidopoiiseisRoute ypiresiesEidopoiseon={ypiresiesEidopoiseon} />)}
        />
        <Route path="/proedri" element={meNav(<Proedri />, false)} />
        <Route path="*" element={meNav(<Proedri />, false)} />
      </Routes>
    </IonRouterOutlet>
  );
}
