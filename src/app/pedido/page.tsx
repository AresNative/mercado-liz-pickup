import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonToolbar, IonTitle } from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";

const Pedido: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    return <IonContent fullscreen
        scrollEvents
        onIonScroll={(e) => {
            const isScrolled = e.detail.scrollTop > 20;
            onScroll?.(isScrolled);
        }}
    >
        <IonHeader
            collapse="condense"
            className="custom-toolbar h-fit absolute -top-0"
        >
            <IonToolbar>
                <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
            </IonToolbar>
        </IonHeader>
        <section className=" my-10 mx-4">Hola desde page.tsx</section>
    </IonContent>;
}

export default Pedido;