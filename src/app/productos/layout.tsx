import type React from "react";
import { useState } from "react";
import { IonPage, isPlatform } from "@ionic/react";
import Header from "@/template/header";
import Page from "./page";
import AppMenu from "@/template/menu";
import Ofertas from "./ofertas";
import { useLocation } from "react-router";

const Layout: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    // ✅ Detectar si estamos en la ruta de ofertas
    const isOfertasPage = location.pathname === '/ofertas';
    return (
        <>
            <AppMenu />
            <IonPage id="main-content">
                <Header isScrolled={isScrolled} showScrollBarr showMenuButton mobileScreen={isPlatform('mobile')} />
                {isOfertasPage ? (<Ofertas onScroll={(scrolled) => setIsScrolled(scrolled)} mobileScreen={isPlatform('mobile')} />) :
                    (<Page onScroll={(scrolled) => setIsScrolled(scrolled)} mobileScreen={isPlatform('mobile')} />)}
            </IonPage>
        </>
    );
};

export default Layout;