import { Route, Routes } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import { PlisiOmonimas } from './plisi.js';
import type { ReactNode } from 'react';
import Simera from '../othoni/simera/simera.js';
import Mathimata from '../othoni/mathimata/mathimata.js';
import XartisEnotiton from '../othoni/xartis/xartis.js';
import OdigosMeletis from '../othoni/odigos/odigos.js';
import TutorChat from '../othoni/tutor/tutor.js';
import Rythisies from '../othoni/rythisies/rythisies.js';
import Proedri from '../othoni/proedri/proedri.js';
import ProvoliPdf from '../provoli-pdf/provoli-pdf.js';

/** Οι διαδρομές της εφαρμογής, μία ανά οθόνη. */
export const ODOI: readonly { readonly diadromi: string; readonly onoma: string }[] = [
  { diadromi: '/simera', onoma: 'Σήμερα' },
  { diadromi: '/mathimata', onoma: 'Μαθήματα' },
  { diadromi: '/xartis', onoma: 'Χάρτης Ενοτήτων' },
  { diadromi: '/odigos/:enotitaId', onoma: 'Οδηγός Μελέτης' },
  { diadromi: '/tutor', onoma: 'Tutor Chat' },
  { diadromi: '/rythisies', onoma: 'Ρυθμίσεις' },
  { diadromi: '/proedri', onoma: 'Onboarding' },
  { diadromi: '/provoli/:arxeioId/:selida', onoma: 'Προβολή PDF' },
] as const;

/** Περιτύλιγμα σελίδας με capsule navigation. */
function meNav(children: ReactNode, xronos = true) {
  return <PlisiOmonimas meNav={xronos}>{children}</PlisiOmonimas>;
}

/**
 * Ο χάρτης διαδρομών. Το <Routes> πρέπει να είναι ΑΜΕΣΟ child του <IonRouterOutlet>:
 * το Ionic διαβάζει τα children του outlet για να δημιουργήσει το page stack, και ένα
 * wrapper component αφήνει το outlet κενό.
 */
export function OdoiNavigisis() {
  return (
    <IonRouterOutlet>
      <Routes>
        <Route path="/" element={meNav(<Simera />, false)} />
        <Route path="/simera" element={meNav(<Simera />)} />
        <Route path="/mathimata" element={meNav(<Mathimata />)} />
        <Route path="/xartis" element={meNav(<XartisEnotiton />)} />
        <Route path="/odigos/:enotitaId" element={meNav(<OdigosMeletis />)} />
        <Route path="/provoli/:arxeioId/:selida" element={meNav(<ProvoliPdf />)} />
        <Route path="/tutor" element={meNav(<TutorChat />)} />
        <Route path="/rythisies" element={meNav(<Rythisies />)} />
        <Route path="/proedri" element={meNav(<Proedri />, false)} />
        <Route path="*" element={meNav(<Proedri />, false)} />
      </Routes>
    </IonRouterOutlet>
  );
}