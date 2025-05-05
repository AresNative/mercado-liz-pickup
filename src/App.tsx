import React, { useCallback, useEffect } from 'react';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { useAppSelector } from './hooks/selector';

import { getLocalStorageItem } from './utils/functions/local-storage';
import { RootState } from './hooks/store';

// Importa tus componentes
import Process from './pages/@proces/layout';
import Layout from './pages/Layout';
import NotFound from './pages/NotFound';
import ProductID from './pages/@landing/[id]/product-id';
import CarritoPage from './pages/@carrito/page';
import Page from './pages/@landing/page';
import LoadingPage from "@/pages/@proces/@loading/page"
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

setupIonicReact({
  mode: 'ios',
});
const App: React.FC = () => {
  // Usar useNavigate en lugar de useHistory para react-router v6 (si es posible)
  const history = useHistory();
  const location = useLocation();

  // Obtener valores de forma correcta y tipada
  const localBranch = getLocalStorageItem("sucursal");
  const reduxBranch = useAppSelector((state: RootState) => state.app.sucursal);
  const currentBranch = localBranch ?? reduxBranch;

  // Usar useCallback para memoizar la lógica de redirección
  const checkRedirect = useCallback(() => {
    const isLayoutPage = location.pathname === '/layout';

    if (!currentBranch && !isLayoutPage) {
      history.replace('/layout');
      return;
    }

    if (currentBranch && isLayoutPage) {
      history.replace('/products');
    }
  }, [currentBranch, location.pathname, history]);

  // Efecto más limpio y eficiente
  useEffect(() => {
    checkRedirect();
  }, [checkRedirect]);

  return (
    <IonApp>
      <IonRouterOutlet>
        <Switch>
          <Route exact path="/layout">
            {currentBranch ? <Redirect to="/products" /> : <Layout />}
          </Route>
          {/* Rutas protegidas */}
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
          <Route exact path="/">
            <Redirect to="/products" />
          </Route>

          {/* Manejo de rutas no encontradas */}
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </IonRouterOutlet>
    </IonApp>
  );
};

export default React.memo(App);