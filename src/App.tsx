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

            {/*  <Route exact path="/layout">
            {currentBranch ? <Redirect to="/products" /> : <Layout />}
          </Route>
          <Route exact path="/products">
            {currentBranch ? <Page /> : <Redirect to="/layout" />}
          </Route>
          <Route exact path="/process">
            {currentBranch ? <Process /> : <Redirect to="/layout" />}
          </Route>
          <Route exact path="/carrito">
            {currentBranch ? <CarritoPage /> : <Redirect to="/layout" />}
          </Route>
          <Route exact path="/loading">
            {currentBranch ? <LoadingPage /> : <Redirect to="/layout" />}
          </Route>
          <Route exact path="/products/:id">
            {currentBranch ? <ProductID /> : <Redirect to="/layout" />}
          </Route>
          <Route exact path="/pay">
            {currentBranch ? <PagoPage /> : <Redirect to="/layout" />}
          </Route>
          <Route path="/chat">
            <Chat />
          </Route> */}

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