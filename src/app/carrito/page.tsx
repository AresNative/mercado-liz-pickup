import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonToolbar, IonTitle } from "@ionic/react";

const Carrito: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    return <IonContent fullscreen
        scrollEvents
        onIonScroll={(e) => {
            const isScrolled = e.detail.scrollTop > 20;
            onScroll?.(isScrolled);
        }}
    >
        <IonHeader
            collapse="condense"
            className="custom-toolbar z-50 -top-16"
        >
            <IonToolbar>
                <IonTitle
                    size="large"
                    className="text-white text-5xl p-2 font-medium h-full">
                    Liz
                </IonTitle>
            </IonToolbar>
        </IonHeader>
        <section>Hola desde page.tsx</section>
    </IonContent>;
}

export default Carrito;