import { useEffect, useState } from 'react';
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
import RythisiesAi from '../othoni/rythisies/rythisies-ai.js';
import Proedri from '../othoni/proedri/proedri.js';
import ProvoliPdf from '../provoli-pdf/provoli-pdf.js';
import RythmiseisProgrammatos from '../programma/programma.js';
import RythisiesEidopoiseon from '../eidopoiiseis/rythisies-eidopoiseon.js';
import { dimiourgise_ypiresies_eidopoiseon } from '../eidopoiiseis/sindesi.js';
import type { EidopoiisiYpiresies } from '../eidopoiiseis/eidopoiiseis-typoi.js';
import { xrisiApothekisis } from '../apothiki/index.js';
import { fortose_mathimata_apo_apothiki, fortose_xartis_apo_apothiki } from '../ypiresies/index.js';

function EidopoiiseisRoute({ ypiresies }: { readonly ypiresies: EidopoiisiYpiresies }) {
  const periballon = xrisiPeriballontos();
  const { kodikosMathimatos, proodhos } = xrisiApothekisis();
  const [context, setContext] = useState<{ readonly courseTitle: string; readonly sectionTitle: string } | undefined>();

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!kodikosMathimatos) { setContext(undefined); return; }
      const [courses, chartState] = await Promise.all([
        fortose_mathimata_apo_apothiki(periballon.apothiki),
        fortose_xartis_apo_apothiki(periballon.apothiki, kodikosMathimatos),
      ]);
      if (!active) return;
      const courseTitle = courses.katastasi === 'etimo'
        ? courses.dedomena.find((course) => course.kodikos === kodikosMathimatos)?.titlos
        : undefined;
      const chart = chartState.katastasi === 'etimo' ? chartState.dedomena : undefined;
      const nextSection = chart?.enotites.find((section) => !proodhos.aristeiesEnotiton.includes(section.id));
      setContext(courseTitle && nextSection
        ? { courseTitle, sectionTitle: nextSection.titlos }
        : undefined);
    })();
    return () => { active = false; };
  }, [periballon.apothiki, kodikosMathimatos, proodhos]);

  const label = context ? `${context.courseTitle} · ${context.sectionTitle}` : '';
  return <RythisiesEidopoiseon ypiresies={ypiresies} onoma={label} context={context} />;
}
import { xrisiPeriballontos } from '../periballon/provolos.js';

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
  { diadromi: '/eidopoiseis', onoma: 'Ειδοποιήσεις' },
] as const;

/** Περιτύλιγμα σελίδας με capsule navigation. */
function meNav(children: ReactNode, xronos = true) {
  return <PlisiOmonimas meNav={xronos}>{children}</PlisiOmonimas>;
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
  ypiresiesEidopoiseon = dimiourgise_ypiresies_eidopoiseon(),
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
          path="/eidopoiseis"
          element={meNav(<EidopoiiseisRoute ypiresies={ypiresiesEidopoiseon} />)}
        />
        <Route path="/proedri" element={meNav(<Proedri />, false)} />
        <Route path="*" element={meNav(<Proedri />, false)} />
      </Routes>
    </IonRouterOutlet>
  );
}
