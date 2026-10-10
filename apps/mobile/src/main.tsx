import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { IonApp } from '@ionic/react';
import './design/tokens.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <IonApp>
      <div data-testid="efarmogi-etoimi">DPS.guide</div>
    </IonApp>
  </StrictMode>,
);
