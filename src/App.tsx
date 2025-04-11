import React from 'react';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { useAppSelector } from './hooks/selector';

// Importa tus componentes
import Process from './pages/@proces/layout';
import Layout from './pages/Layout';
import NotFound from './pages/NotFound';
import ProductID from './pages/@landing/[id]/product-id';
import CarritoPage from './pages/@carrito/page';
import Page from './pages/@landing/page';

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
  const sucursal = useAppSelector((state: any) => state.app.sucursal);
  const history = useHistory();
  const location = useLocation();

  React.useEffect(() => {
    // Redirigir solo si no hay sucursal y no está en layout
    if (!sucursal && location.pathname !== '/layout') {
      history.replace('/layout');
    }
    // Si hay sucursal y está en layout, redirigir a productos
    if (sucursal && location.pathname === '/layout') {
      history.replace('/products');
    }
  }, [sucursal, location.pathname, history]);

  return (
    <IonApp>
      <IonRouterOutlet>
        <Switch>
          <Route exact path="/layout">
            {sucursal ? <Redirect to="/products" /> : <Layout />}
          </Route>

          {/* Rutas protegidas */}
          <Route exact path="/products">
            {sucursal ? <Page /> : <Redirect to="/layout" />}
          </Route>
          <Route exact path="/process">
            {sucursal ? <Process /> : <Redirect to="/layout" />}
          </Route>
          <Route exact path="/carrito">
            {sucursal ? <CarritoPage /> : <Redirect to="/layout" />}
          </Route>
          <Route exact path="/products/:id">
            {sucursal ? <ProductID /> : <Redirect to="/layout" />}
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