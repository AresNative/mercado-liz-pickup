import MainForm from "@/components/form/main-form";
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonDatetime, IonTextarea, IonBackButton } from "@ionic/react";
import { useState } from "react";
import { CitasField } from "../constants/citas-field";

export default function ModalCita(
    { modal, showModal, setShowModal }:
        { modal: any, showModal: boolean, setShowModal: (show: boolean) => void }) {

    const [selectedDateTime, setSelectedDateTime] = useState<string>();
    const [notes, setNotes] = useState<string>('');
    const handleSchedule = () => {
        if (!selectedDateTime) {
            alert('Por favor selecciona una fecha y hora');
            return;
        }

        // Aquí iría la lógica para enviar los datos
        console.log('Fecha y hora seleccionada:', selectedDateTime);
        console.log('Aclaraciones:', notes);

        // Cerrar modal y resetear campos
        setShowModal(false);
        setSelectedDateTime("");
        setNotes('');
    };

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

            <IonContent className="ion-padding">
                <MainForm
                    message_button={'Enviar'}
                    actionType={"post-login"}
                    dataForm={CitasField()}
                    onSuccess={(result: any) => {
                        console.log(result);
                    }}
                />
            </IonContent>
        </IonModal>
    );
}