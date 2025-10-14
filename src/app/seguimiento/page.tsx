import Footer from "@/template/footer";
import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonTitle, IonToolbar } from "@ionic/react";

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
                    <IonTitle
                        size="large"
                        className="text-white text-5xl p-2 font-medium h-full">
                        Liz
                    </IonTitle>
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