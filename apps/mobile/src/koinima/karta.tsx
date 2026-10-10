import type { ReactNode } from 'react';
import './koinima.css';

/** Ιδιότητες αναγλυφής κάρτας. */
export interface KartaProps {
  readonly titlos?: string;
  readonly ypokeimeno?: string;
  readonly akseis?: ReactNode;
  readonly stoixeia?: ReactNode;
}

/** Tactile card: raised surface πάνω από το σκούρο background. */
export function Karta({ titlos, ypokeimeno, akseis, stoixeia }: KartaProps) {
  return (
    <section className="karta">
      {(titlos !== undefined || akseis !== undefined) && (
        <div className="odoni-xeiris">
          {titlos !== undefined && <h2 className="karta-titlos">{titlos}</h2>}
          {akseis}
        </div>
      )}
      {ypokeimeno !== undefined && <p className="karta-ypokeimeno">{ypokeimeno}</p>}
      {stoixeia}
    </section>
  );
}

/** Ιδιότητες μικρής ετικέτας. */
export interface PilegmaProps {
  readonly keimeno: string;
  readonly entono?: boolean;
}

/** Μικρή capsule ετικέτα για μετρικά ή καταστάσεις. */
export function Pilegma({ keimeno, entono = false }: PilegmaProps) {
  return <span className={`pilegma${entono ? ' pilegma-entono' : ''}`}>{keimeno}</span>;
}

/** Ιδιότητες δακτυλίου μετρικού. */
export interface MetrikosRingProps {
  /** Ποσοστό 0..1. */
  readonly pososto: number;
  readonly megethos?: number;
  readonly ypokeimeno?: string;
  readonly ariaEtiketa: string;
}

/** Δακτύλιος προόδου σε SVG, χρωματισμένος από το accent token. */
export function MetrikosRing({
  pososto,
  megethos = 56,
  ypokeimeno,
  ariaEtiketa,
}: MetrikosRingProps) {
  const aktina = 4;
  const diametros = megethos - aktina * 2;
  const perimetros = Math.PI * diametros;
  const merismos = Math.max(0, Math.min(1, pososto));
  const maktos = Math.round(merismos * 100);

  return (
    <div className="ring">
      <svg
        className="ring-svg"
        width={megethos}
        height={megethos}
        viewBox={`0 0 ${megethos} ${megethos}`}
        role="img"
        aria-label={`${ariaEtiketa}: ${maktos}%`}
      >
        <circle
          className="ring-trail"
          cx={megethos / 2}
          cy={megethos / 2}
          r={diametros / 2}
          fill="none"
          strokeWidth={aktina}
        />
        <circle
          className="ring-dromos"
          cx={megethos / 2}
          cy={megethos / 2}
          r={diametros / 2}
          fill="none"
          strokeWidth={aktina}
          strokeDasharray={perimetros}
          strokeDashoffset={perimetros * (1 - merismos)}
          transform={`rotate(-90 ${megethos / 2} ${megethos / 2})`}
        />
      </svg>
      <div>
        <p className="ring-pososto">{maktos}%</p>
        {ypokeimeno !== undefined && <p className="ring-ypokeimeno">{ypokeimeno}</p>}
      </div>
    </div>
  );
}