import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton } from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";
import { useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import { formatValue } from '@/utils/constants/format-values';
import CalendarioYHora from "./components/time";
import MainForm from "@/components/form/main-form";
import { CheckOutField } from "./utils/checkoutfield";
import { CheckOutTarjetaField } from "./utils/tarjetacheckoutfiel";

const Checkout: React.FC<PageProps> = ({ onScroll }: PageProps) => {

    const cart = useAppSelector((state: RootState) => state.cart);
    const { items = [] } = cart || {}; // Mejor manejo del estado inicial
    console.log(cart.items); // para ver si llega la info del carrito
    const total = items.reduce((sum, item) => {
        return sum + ((item.descuento ? item.descuento : item.precio) * item.quantity);
    }, 0);
    const serv = total * 0.05; //->calculo del 5% de servicio
    const totalConServicio = total + serv; //-> total mas servicio

    function presentAlert(arg0: { header: string; subHeader: string; message: string; buttons: string[]; }) {
        throw new Error("Function not implemented.");
    } //Alerta de fallo en el formulario

    /* PRUEBA METODO PAGO DESACTIVADO */

    /* PRUEBA METODO PAGO DESACTIVADO */

    return (
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 10;
                onScroll?.(isScrolled);
            }}
        >
            <IonHeader collapse="condense"
                className="custom-toolbar h-fit absolute -top-0"
            >
                <IonToolbar>
                    <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                    {/*  <IonTitle>Agendar</IonTitle> */}
                </IonToolbar>
            </IonHeader>

            {/*  Contenedor general */}
            <section className="flex flex-col md:flex-row-reverse gap-4 px-4 mt-6 max-w-6xl mx-auto">

                {/*  Resumen del pedido */}
                <article className="md:w-1/3 w-full bg-white rounded-xl border border-gray-200 p-4 shadow-sm sticky top-4 h-fit">
                    <h2 className="font-bold text-lg mb-4">Resumen del pedido</h2>
                    <p className="flex justify-between"><span className="text-gray-500">Subtotal</span>{total > 0 && (<p>{formatValue(total, "currency")}</p>)}</p>
                    <p className="flex justify-between"><span className="text-gray-500">Tarifa de servicio</span> {serv.toFixed(2)}</p>
                    <hr className="my-3" />
                    <p className="flex justify-between font-semibold"><span>Total</span>{totalConServicio.toFixed(2)}</p>
                    <IonButton expand="block" shape="round" className="custom-tertiary mt-5">Confirmar cita</IonButton>
                </article>

                {/*  Secciones principales */}
                <section className="flex flex-col w-full md:w-2/3">
                    <CalendarioYHora />
                    <div className="ion-padding ">
                        <div className="border-2 rounded-lg p-4">
                            <h2 className="font-bold text-lg mb-2">Información</h2>
                            <MainForm
                                actionType="post"
                                dataForm={CheckOutField()}
                                message_button=""
                                onSuccess={() => {
                                    presentAlert({
                                        header: 'Error al confirmar cita',
                                        subHeader: 'Datos recibidos pero no validados',
                                        message: 'Intenta mas tarde, hay errores de validacion en este momento.',
                                        buttons: ['Ok'],
                                    })
                                }}
                            />
                        </div>
                        <div className="border-2 rounded-lg p-4">
                            <h2 className="font-bold text-lg mb-1">Forma de pago</h2>
                            <h3 className="text-sm mb-1">Ingresa los detalles de tu forma de pago para completar la compra.</h3>
                            <MainForm
                                actionType="post"
                                dataForm={CheckOutTarjetaField()}
                                message_button=""
                                onSuccess={() => {
                                    presentAlert({
                                        header: 'Error al confirmar cita',
                                        subHeader: 'Datos recibidos pero no validados',
                                        message: 'Intenta mas tarde, hay errores de validacion en este momento.',
                                        buttons: ['Ok'],
                                    })
                                }}
                            />
                        </div>
                    </div>
                </section>
            </section>

        </IonContent>
    );
};


export default Checkout;