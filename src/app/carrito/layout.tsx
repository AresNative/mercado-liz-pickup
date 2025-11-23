import type React from "react";
import { useState } from "react";
import { IonPage, isPlatform } from "@ionic/react";
import Header from "@/template/header";
import Page from "./page";
import AppMenu from "@/template/menu";

const Layout: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    return (
        <>
            <AppMenu />
            <IonPage id="main-content">
                <Header isScrolled={isScrolled} showScrollBarr showMenuButton mobileScreen={isPlatform('mobile')} />
                <Page onScroll={(scrolled) => setIsScrolled(scrolled)} />
            </IonPage>
        </>
    );
};

export default Layout;