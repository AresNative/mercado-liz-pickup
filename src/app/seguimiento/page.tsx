import Footer from "@/template/footer";
import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonTitle, IonToolbar } from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";

const Seguimiento: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    return (
        <IonContent fullscreen
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
                    <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                </IonToolbar>
            </IonHeader>
            <section className="py-16 px-4 max-w-6xl min-h-screen mx-auto">
                Hola desde page.tsx
            </section>
            <Footer />
        </IonContent>
    );
}

export default Seguimiento;