import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import './koinima.css';

/** Ένα στοιχείο της capsule γραμμής. */
export interface StoicheioKapsoulis {
  readonly kleidi: string;
  readonly etiketa: string;
  readonly glyph: string;
}

/** Οι καρτέλες της εφαρμογής, σε σταθερή σειρά. */
export const STOIXEIA_KAPSOULIS: readonly StoicheioKapsoulis[] = [
  { kleidi: 'simera', etiketa: 'Σήμερα', glyph: '◉' },
  { kleidi: 'mathimata', etiketa: 'Μαθήματα', glyph: '❐' },
  { kleidi: 'programma', etiketa: 'Πρόγραμμα', glyph: '☷' },
  { kleidi: 'xartis', etiketa: 'Χάρτης', glyph: '❖' },
  { kleidi: 'tutor', etiketa: 'Tutor', glyph: '❝' },
  { kleidi: 'rythisies', etiketa: 'Ρυθμίσεις', glyph: '⚙' },
] as const;

/** Capsule navigation: floating pill bar, the signature navigation of the app. */
export function KapsouliNavigisis({ akseis }: { readonly akseis?: ReactNode }) {
  return (
    <nav className="kapsouli" aria-label="Κύρια πλοήγηση" data-testid="kapsouli-navigisis">
      {STOIXEIA_KAPSOULIS.map((stoixeio) => (
        <NavLink
          key={stoixeio.kleidi}
          to={`/${stoixeio.kleidi}`}
          className={({ isActive }) =>
            `kapsouli-stoicheio${isActive ? ' kapsouli-stoicheio-energo' : ''}`
          }
          data-testid={`kapsouli-${stoixeio.kleidi}`}
        >
          <span className="kapsouli-glyfi" aria-hidden="true">
            {stoixeio.glyph}
          </span>
          {stoixeio.etiketa}
        </NavLink>
      ))}
      {akseis}
    </nav>
  );
}