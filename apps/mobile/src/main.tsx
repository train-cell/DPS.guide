import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { OdoiNavigisis } from './navigasi/odoi.js';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import './design/tokens.css';
import './navigasi/navigasi.css';
import './koinima/koinima.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <IonApp>
      <IonReactRouter>
        <OdoiNavigisis />
      </IonReactRouter>
    </IonApp>
  </StrictMode>,
);