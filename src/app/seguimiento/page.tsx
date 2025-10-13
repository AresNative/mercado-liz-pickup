import Footer from "@/template/footer";
import { IonPage, IonContent } from "@ionic/react";

export const Seguimiento = () => {
    return <IonPage>
        <IonContent fullscreen>
            <section className="py-16 px-4 max-w-6xl min-h-screen mx-auto">
                Hola desde page.tsx
            </section>
            <Footer />
        </IonContent>
    </IonPage>;
}