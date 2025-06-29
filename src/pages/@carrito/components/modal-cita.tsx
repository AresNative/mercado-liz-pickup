import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from "@ionic/react";
import { AppointmentCalendar } from "./appointment-calendar";

export default function ModalCita(
    { modal, showModal, setShowModal }:
        { modal: any, showModal: boolean, setShowModal: (show: boolean) => void }) {

    return (
        <IonModal
            ref={modal}
            isOpen={showModal}
            onDidDismiss={() => setShowModal(false)}
            trigger="open-modal"
            expandToScroll={true}
        >
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Agendar Recolección</IonTitle>
                    <IonButtons slot="start">
                        <IonButton fill="clear" onClick={() => setShowModal(false)} color={"tertiary"}>
                            Cerrar
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent role="feed" className="ion-padding">
                <AppointmentCalendar />
            </IonContent>
        </IonModal>
    );
}