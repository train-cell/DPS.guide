import type { Enotita } from '@dps/core';
import { ypologise_katastasi_mastery } from '@dps/core';
import { xrisiApothekisis } from '../../apothiki/index.js';

export interface GapRadarProps {
  readonly enotites: readonly Enotita[];
  readonly mastery?: Readonly<Record<string, number>> | undefined;
}

interface SemeioTrigonometrias {
  readonly x: number;
  readonly y: number;
}

/**
 * Υπολογίζει συντεταγμένες σημείου στον κύκλο με βάση τη γωνία και την ακτίνα.
 */
function ypologise_syntetagmenes(
  kentroX: number,
  kentroY: number,
  aktina: number,
  deiktis: number,
  synolo: number
): SemeioTrigonometrias {
  const gonia = (2 * Math.PI * deiktis) / Math.max(1, synolo) - Math.PI / 2;
  return {
    x: Math.round((kentroX + aktina * Math.cos(gonia)) * 100) / 100,
    y: Math.round((kentroY + aktina * Math.sin(gonia)) * 100) / 100,
  };
}

/**
 * Knowledge Gap Radar Component: οπτικοποίηση ετοιμότητας ύλης σε διάγραμμα αράχνης (radar polygon).
 *
 * 100% σχεδιασμένο με SVG και CSS custom properties (κανόνας D11, 0 hex colors, 0 inline styles).
 */
export function GapRadar({ enotites, mastery }: GapRadarProps) {
  const apothiki = xrisiApothekisis();

  const telikoMastery =
    mastery ??
    ypologise_katastasi_mastery(
      [...enotites],
      apothiki.proodhos.checkins ? [...apothiki.proodhos.checkins] : [],
      apothiki.proodhos
    );

  const kentroX = 150;
  const kentroY = 150;
  const megistiAktina = 90;
  const plithos = enotites.length;

  if (plithos === 0) {
    return (
      <svg
        viewBox="0 0 300 300"
        width="100%"
        height="260"
        role="img"
        aria-label="Διάγραμμα Ετοιμότητας Ύλης"
        data-testid="simera-gap-radar"
      >
        <text
          x={kentroX}
          y={kentroY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--xroma-apoxromatismeno)"
          fontSize="13"
        >
          Δεν υπάρχουν διαθέσιμες ενότητες
        </text>
      </svg>
    );
  }

  // Επίπεδα πλέγματος (25%, 50%, 75%, 100%)
  const epipeda = [0.25, 0.5, 0.75, 1.0];

  // Υπολογισμός σημείων πολυγώνου πραγματικής επάρκειας (mastery)
  const simeiaDedomenon = enotites.map((enotita, deiktis) => {
    const vathmos = telikoMastery[enotita.id] ?? 0;
    // Ελάχιστο 5% για να διατηρείται σχήμα πολυγώνου ακόμη και σε μηδενικό σκορ
    const pososto = Math.max(0.05, Math.min(1.0, vathmos / 100));
    return ypologise_syntetagmenes(kentroX, kentroY, megistiAktina * pososto, deiktis, plithos);
  });

  const stringSimeionDedomenon = simeiaDedomenon.map((s) => `${s.x},${s.y}`).join(' ');

  return (
    <svg
      viewBox="0 0 300 300"
      width="100%"
      height="260"
      role="img"
      aria-label="Διάγραμμα Ετοιμότητας Ύλης"
      data-testid="simera-gap-radar"
    >
      {/* 1. Ομόκεντρα επίπεδα πλέγματος (Background Web Grid) */}
      {epipeda.map((epipedo) => {
        const aktinaEpipedou = megistiAktina * epipedo;
        if (plithos >= 3) {
          const simeiaPlegmatos = enotites
            .map((_, d) => ypologise_syntetagmenes(kentroX, kentroY, aktinaEpipedou, d, plithos))
            .map((s) => `${s.x},${s.y}`)
            .join(' ');
          return (
            <polygon
              key={`grid-${epipedo}`}
              points={simeiaPlegmatos}
              fill="none"
              stroke="var(--xroma-synorio)"
              strokeWidth="1"
              strokeDasharray={epipedo < 1.0 ? '2,3' : undefined}
            />
          );
        }
        return (
          <circle
            key={`grid-circle-${epipedo}`}
            cx={kentroX}
            cy={kentroY}
            r={aktinaEpipedou}
            fill="none"
            stroke="var(--xroma-synorio)"
            strokeWidth="1"
            strokeDasharray={epipedo < 1.0 ? '2,3' : undefined}
          />
        );
      })}

      {/* 2. Ακτινικοί άξονες (Spokes) */}
      {enotites.map((_, deiktis) => {
        const akraioSimeio = ypologise_syntetagmenes(
          kentroX,
          kentroY,
          megistiAktina,
          deiktis,
          plithos
        );
        return (
          <line
            key={`spoke-${deiktis}`}
            x1={kentroX}
            y1={kentroY}
            x2={akraioSimeio.x}
            y2={akraioSimeio.y}
            stroke="var(--xroma-synorio)"
            strokeWidth="1"
          />
        );
      })}

      {/* 3. Πολύγωνο επάρκειας (Radar Polygon) */}
      <polygon
        points={stringSimeionDedomenon}
        stroke="var(--xroma-entono)"
        fill="var(--xroma-epifaneia-patimeni)"
        strokeWidth="2"
      />

      {/* 4. Κουκκίδες σημείων */}
      {simeiaDedomenon.map((s, d) => (
        <circle
          key={`point-${d}`}
          cx={s.x}
          cy={s.y}
          r="4"
          fill="var(--xroma-entono)"
        />
      ))}

      {/* 5. Ετικέτες ενοτήτων και ποσοστών */}
      {enotites.map((enotita, deiktis) => {
        const vathmos = telikoMastery[enotita.id] ?? 0;
        const aktinaEtiketas = megistiAktina + 26;
        const simeioEtiketas = ypologise_syntetagmenes(
          kentroX,
          kentroY,
          aktinaEtiketas,
          deiktis,
          plithos
        );

        const syntomosTitlos =
          enotita.titlos.length > 14 ? `${enotita.titlos.slice(0, 12)}…` : enotita.titlos;

        return (
          <g key={`etiketa-${enotita.id}`}>
            <text
              x={simeioEtiketas.x}
              y={simeioEtiketas.y - 5}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--xroma-keimeno-prwtarxiko)"
              fontSize="11"
              fontWeight="600"
            >
              {syntomosTitlos}
            </text>
            <text
              x={simeioEtiketas.x}
              y={simeioEtiketas.y + 8}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--xroma-apoxromatismeno)"
              fontSize="10"
            >
              {vathmos}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
