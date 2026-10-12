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

/** Διανυσματικό εικονίδιο SVG για κάθε καρτέλα πλοήγησης. */
function EikonidioKapsoulis({
  kleidi,
  fallbackGlyph,
}: {
  readonly kleidi: string;
  readonly fallbackGlyph: string;
}) {
  switch (kleidi) {
    case 'simera':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'mathimata':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'programma':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'xartis':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      );
    case 'tutor':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M9 10h.01" />
          <path d="M12 10h.01" />
          <path d="M15 10h.01" />
        </svg>
      );
    case 'rythisies':
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return <span>{fallbackGlyph}</span>;
  }
}

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
            <EikonidioKapsoulis kleidi={stoixeio.kleidi} fallbackGlyph={stoixeio.glyph} />
          </span>
          {stoixeio.etiketa}
        </NavLink>
      ))}
      {akseis}
    </nav>
  );
}