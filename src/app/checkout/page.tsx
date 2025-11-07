import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonToolbar, IonButton } from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";
import { useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import { formatValue } from '@/utils/constants/format-values';
import MainForm from "@/components/form/main-form";
import { CheckOutField } from "./utils/checkoutfield";
import { CheckOutTarjetaField } from "./utils/tarjetacheckoutfiel";
import Calendar from "./components/calendar";
import Sucursales from "./components/map";
import { useRef, useState } from "react";
import TimeSlots from "./components/time";
import { useGetWithFiltersGeneralInIntelisisMutation, usePostIntelisisMutation } from "@/hooks/reducers/api_int";
import { usePostMutation } from "@/hooks/reducers/api";
import { usePedidosSignalR } from "./utils/signalr-pedidos";

const Checkout: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    // 🔶 SIGNAL-R -> manejo de tiempo real
    const handlePedidoActualizado = (pedido: any) => {
        console.log("Pedido actualizado:", pedido);
    };
    const handleNuevoPedido = (pedido: any) => {
        console.log("Nuevo pedido recibido:", pedido);
    };
    const handlePedidoEliminado = (pedidoId: number) => {
        console.log("Pedido eliminado:", pedidoId);
    }
    const handleRefrescarDatos = () => {
        console.log("Refrescando datos de pedidos...");
    }
    // ✅ CONEXIÓN SIGNAL-R Y GESTIÓN DE PEDIDOS
    const {
        connection,
        isConnected,
        unirseAPedido,
        salirDePedido,
        notificarCambioLista
    } = usePedidosSignalR(
        handlePedidoActualizado,
        handleNuevoPedido,
        handlePedidoEliminado,
        handleRefrescarDatos
    );

    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const infoFormRef = useRef<HTMLFormElement>(null);
    const pagoFormRef = useRef<HTMLFormElement>(null);

    const cart = useAppSelector((state: RootState) => state.cart);
    const { items = [] } = cart || {}; // Mejor manejo del estado inicial

    const total = items.reduce((sum, item) => {
        return sum + ((item.descuento ? item.descuento : item.precio) * item.quantity);
    }, 0);

    const serv = total * 0.05; //->calculo del 5% de servicio
    const totalConServicio = total + serv; //-> total mas servicio

    // ? mercados-liz
    const [PostData] = usePostMutation()
    //? intelisis
    const [PostInt, { isLoading: isLoadingPost }] = usePostIntelisisMutation();
    const [GetInt, { isLoading: isLoadingGet }] = useGetWithFiltersGeneralInIntelisisMutation();

    const handleConfirmarCita = async () => {
        try {

            const result = await GetInt({
                table: `[TC032841E_Pruebas].dbo.venta`,
                pageSize: 1,
                page: 1,
                filtros: {
                    "Filtros": [
                        {
                            "Key": "Usuario",
                            "Value": "SISTEMAS02"
                        },
                        {
                            "Key": "MovID",
                            "Value": "Null",
                            "Operator": "<>"
                        }
                    ],
                    "Order": [
                        {
                            "Key": "id",
                            "Direction": "desc"
                        }
                    ]
                },
                signal: undefined,
            });

            if ('data' in result && result.data) {
                const apiResp: any = result.data;
                const apiData = Array.isArray(apiResp.data) ? apiResp.data : apiResp;
                // Extraer id (la API usa "ID" en mayúsculas según el ejemplo)
                let ventaId: number | string | null = null;
                let MovId: number | string | null = null;
                if (Array.isArray(apiData) && apiData.length > 0) {
                    ventaId = apiData[0].id ?? apiData[0].Id ?? apiData[0].ID ?? apiData[0].ventaId ?? null;
                    MovId = apiData[0].MovID ?? apiData[0].MovID ?? apiData[0].MOVID ?? apiData[0].MovId ?? null;
                } else if (typeof apiData === "object" && apiData !== null) {
                    ventaId = apiData.id ?? apiData.Id ?? apiData.ID ?? apiData.ventaId ?? null;
                    MovId = apiData.MovID ?? apiData.MovID ?? apiData.MOVID ?? apiData.ventaId ?? null;
                }

                if (ventaId != null) {
                    console.log("Venta obtenida:", ventaId, MovId);
                    try {


                    } catch (postError) {
                        console.error("Error en PostInt:", postError);
                    }

                } else {
                    console.warn("No se encontró 'id' en la respuesta:", apiData);
                }
            }

            // Disparar el envío de ambos formularios
            const infoForm = infoFormRef.current;
            const pagoForm = pagoFormRef.current;

            if (infoForm && pagoForm) {
                // Crear y disparar eventos de submit
                const submitEvent = new Event('submit', {
                    bubbles: true,
                    cancelable: true
                });

                // Disparar ambos formularios
                const infoSubmitted = infoForm.dispatchEvent(submitEvent);
                const pagoSubmitted = pagoForm.dispatchEvent(submitEvent);

                if (infoSubmitted && pagoSubmitted) {
                    console.log("Ambos formularios enviados correctamente");
                    // Aquí puedes agregar lógica adicional después del envío exitoso
                }
            }
        } catch (error) {
            console.error("Error al enviar formularios:", error);
        }
    };

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
                </IonToolbar>
            </IonHeader>

            {/*  Contenedor general */}
            <section className="flex flex-col md:flex-row-reverse gap-4 px-4 mt-6 max-w-6xl mx-auto">
                <div className="md:w-1/3">
                    {/*  Resumen del pedido */}
                    <article className="w-full bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-fit z-50 sticky top-4">
                        <h2 className="font-bold text-lg mb-4">Resumen del pedido</h2>
                        <p className="flex justify-between"><span className="text-gray-500">Subtotal</span>{total > 0 && (formatValue(total, "currency"))}</p>
                        <p className="flex justify-between"><span className="text-gray-500">Tarifa de servicio</span> {formatValue(serv, "currency")}</p>
                        <hr className="my-3" />
                        <p className="flex justify-between font-semibold"><span>Total</span>{formatValue(totalConServicio, "currency")}</p>
                        <IonButton expand="block" shape="round" className="custom-tertiary mt-5" onClick={handleConfirmarCita}>Confirmar cita</IonButton>
                    </article>

                    <Sucursales sucursalVista="(Precio Lista)" />
                </div>

                {/*  Secciones principales */}
                <section className="flex flex-col gap-4 w-full md:w-2/3">
                    <Calendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                    <TimeSlots selectedDate={selectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} />
                    <div className="border-2 rounded-lg p-4">
                        <h2 className="font-bold text-lg mb-2">Información</h2>
                        <MainForm
                            ref={infoFormRef}
                            actionType=""
                            dataForm={CheckOutField()}
                            message_button=""
                            onSuccess={(result) => {
                                console.log("Información usuario:", result);
                            }}
                            showButton={false}
                        />
                    </div>
                    <div className="border-2 rounded-lg p-4">
                        <h2 className="font-bold text-lg mb-1">Forma de pago</h2>
                        <h3 className="text-sm mb-1">Ingresa los detalles de tu forma de pago para completar la compra.</h3>
                        <MainForm
                            ref={pagoFormRef}
                            actionType=""
                            dataForm={CheckOutTarjetaField()}
                            message_button=""
                            onSuccess={(result) => {
                                console.log("Información pago:", result);
                            }}
                            showButton={false}
                        />
                    </div>
                </section>
            </section>

        </IonContent>
    );
};


export default Checkout;