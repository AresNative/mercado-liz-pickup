import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import Layout from './pages/Layout';
import NotFound from './pages/NotFound'; // Asegúrate de crear este componente
import ProductID from './pages/@landing/[id]/product-id';

/* Theme variables */
import './theme/variables.css';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* import '@ionic/react/css/palettes/dark.always.css'; */
import '@ionic/react/css/palettes/dark.class.css';
import React from 'react';
import Providers from './hooks/provider';
/* import '@ionic/react/css/palettes/dark.system.css'; */


setupIonicReact({
  /*  rippleEffect: false, */
  mode: 'ios',
});

const App: React.FC = () => (
  <IonApp>
    <Providers>
      <IonReactRouter>
        <IonRouterOutlet>
          <Switch>
            <Route exact path="/products">
              <Layout />
            </Route>
            <Route exact path="/">
              <Redirect to="/products" />
            </Route>
            <Route exact path="/products/:id" component={ProductID} />
            {/* Ruta para páginas no encontradas */}
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </Providers>
  </IonApp>
);

export default React.memo(App);