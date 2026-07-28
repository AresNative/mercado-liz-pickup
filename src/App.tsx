import React, { useCallback, useEffect } from 'react';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonTabs, isPlatform, setupIonicReact } from '@ionic/react';
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
import LayoutCarrito from './app/carrito/layout';
import LayoutCheckout from './app/checkout/layout';
import LayoutSeguimiento from './app/seguimiento/layout';
import LayoutUsuario from './app/perfil/layout';
import Tabs from './template/tabs';
import { IonReactRouter } from '@ionic/react-router';
import { usePushNotifications } from './hooks/use-notifications';
import AccesDenied from './app/AccesDenied';

setupIonicReact({
  mode: 'ios',
  rippleEffect: false,
  animated: true,
  hardwareBackButton: true,
});

const App: React.FC = () => {
 usePushNotifications();
  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>

            <Background>
              <Switch>

                <Route path="/home" render={() => <Layout />} exact />
                <Route path="/productos" render={() => <LayoutProductos />} exact />
                <Route path="/ofertas" render={() => <LayoutProductos />} exact />
                <Route path="/carrito" render={() => <LayoutCarrito />} exact />
                <Route path="/checkout" render={() => <LayoutCheckout />} exact />
                <Route path="/seguimiento" render={() => <LayoutSeguimiento />} exact />
                <Route path="/cuentas" render={() => <LayoutUsuario />} exact />
                <Route path="/acceso-denegado" render={() => <AccesDenied />} exact />
                <Redirect exact path="/" to="/home" />

                <Route>
                  <NotFound />
                </Route>

              </Switch>
            </Background>
          </IonRouterOutlet>
          <Tabs />
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default React.memo(App);