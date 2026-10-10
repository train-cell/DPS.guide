import { IonPage, IonContent } from '@ionic/react';
import type { ReactNode } from 'react';
import { KapsouliNavigisis } from '../koinima/index.js';
import './navigasi.css';

/** Ιδιότητες περιτυλίγματος σελίδας. */
export interface PlisiOmonimasProps {
  readonly children: ReactNode;
  /** Να εμφανίζεται η capsule navigation στο κάτω μέρος. */
  readonly meNav?: boolean;
}

/** Περιτύλιγμα σελίδας: scrollable content + capsule navigation προσαρμοσμένη στο κάτω μέρος. */
export function PlisiOmonimas({ children, meNav = true }: PlisiOmonimasProps) {
  return (
    <IonPage>
      <div className="plisi">
        <div className="plisi-content">
          <IonContent className="episkefsi">{children}</IonContent>
        </div>
        {meNav && <KapsouliNavigisis />}
      </div>
    </IonPage>
  );
}