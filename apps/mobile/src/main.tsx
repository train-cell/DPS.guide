import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { OdoiNavigisis } from './navigasi/odoi.js';
import { ParoxeApothekisis } from './apothiki/index.js';
import { VaultGate } from './vault/vault-gate.js';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import './design/tokens.css';
import './design/themata.css';
import './navigasi/navigasi.css';
import './koinima/koinima.css';

if (!Capacitor.isNativePlatform() && import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, { once: true });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <VaultGate>
      <ParoxeApothekisis>
        <IonApp>
          <IonReactRouter>
            <OdoiNavigisis />
          </IonReactRouter>
        </IonApp>
      </ParoxeApothekisis>
    </VaultGate>
  </StrictMode>,
);
