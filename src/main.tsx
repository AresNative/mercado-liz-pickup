import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Providers from './hooks/provider';
import { IonReactRouter } from '@ionic/react-router';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Providers>
      <IonReactRouter>
        <App />
      </IonReactRouter>
    </Providers>
  </React.StrictMode>
);