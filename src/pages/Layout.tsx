import { IonContent, IonPage } from '@ionic/react';
import CategorySlider from './@landing/components/categories';
import PromoBanner from './@landing/components/banner-offers';
import ProductGrid from './@landing/components/product/product-grid';
import HeaderCart from './@landing/components/header';

const Layout: React.FC = () => {
  return (
    <IonPage>
      <HeaderCart />
      <IonContent fullscreen>
        <CategorySlider />

        <PromoBanner />

        <ProductGrid />
      </IonContent>
    </IonPage >
  );
};

export default Layout;
