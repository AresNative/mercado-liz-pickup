import React, { useCallback, useEffect } from 'react';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
// Estilos
import './theme/variables.css';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.class.css';

import "driver.js/dist/driver.css";

import NotFound from './app/NotFound';

import Background from './template/background';

import Layout from './app/layout';
import LayoutProductos from './app/productos/layout';
import LayoutPedido from './app/pedido/layout';
import LayoutCheckout from './app/checkout/layout';

setupIonicReact({
  mode: 'ios',
});
const App: React.FC = () => {

  return (
    <IonApp>
      <IonRouterOutlet>

        <Background>
          <Switch>

            <Route path="/home">
              <Layout />
            </Route>
            <Route path="/productos">
              <LayoutProductos />
            </Route>
            <Route path="/checkout">
              <LayoutCheckout />
            </Route>
            <Route path="/pedido">
              <LayoutPedido />
            </Route>

            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </Background>
      </IonRouterOutlet>
    </IonApp>
  );
};

export default React.memo(App);