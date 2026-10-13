import { useEffect, useMemo, useState } from 'react';
import RythisiesEidopoiseon from './rythisies-eidopoiseon.js';
import { dimiourgise_ypiresies_eidopoiseon } from './sindesi.js';
import type { EidopoiisiYpiresies } from './eidopoiiseis-typoi.js';
import { xrisiApothekisis } from '../apothiki/index.js';
import { xrisiPeriballontos } from '../periballon/provolos.js';
import { fortose_mathimata_apo_apothiki, fortose_xartis_apo_apothiki } from '../ypiresies/index.js';

export interface EidopoiiseisRouteProps {
  readonly ypiresiesEidopoiseon?: EidopoiisiYpiresies | undefined;
}

export default function EidopoiiseisRoute({ ypiresiesEidopoiseon }: EidopoiiseisRouteProps) {
  const ypiresies = useMemo(
    () => ypiresiesEidopoiseon ?? dimiourgise_ypiresies_eidopoiseon(),
    [ypiresiesEidopoiseon]
  );
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
