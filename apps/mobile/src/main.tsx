import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { OdoiNavigisis } from './navigasi/odoi.js';
import { ParoxosPeriballontos } from './periballon/index.js';
import { ParoxeApothekisis } from './apothiki/index.js';
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
import { arxikopoiisi_thematos } from './design/themata.js';

// Αρχικοποίηση θέματος από localStorage
arxikopoiisi_thematos();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <ParoxosPeriballontos>
      <ParoxeApothekisis>
        <IonApp>
          <IonReactRouter>
            <OdoiNavigisis />
          </IonReactRouter>
        </IonApp>
      </ParoxeApothekisis>
    </ParoxosPeriballontos>
  </StrictMode>,
);
