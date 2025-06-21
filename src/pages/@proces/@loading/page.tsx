import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { useGetAllMutation } from "@/hooks/reducers/api";
import { LoadingScreen } from "@/pages/@landing/[id]/product-id";
import HeaderCart from "@/pages/@landing/components/header";
import { IonContent, IonPage } from "@ionic/react";
import { BarChart3, Calendar, Grid2x2X } from "lucide-react";
import { useEffect, useState } from "react";
import {
    format
} from "date-fns"
import { es } from "date-fns/locale"
import Sucursales from "./sections/Sucursales";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import ProductCard from "@/pages/@landing/components/product/product-card";
import { mapApiProductLoadingPage } from "@/pages/@landing/utils/fromat-data";

const Page: React.FC = () => {
    const [cartItems, setcartItems] = useState<any>([])
    const [citas, setCitas] = useState<any>([])
    const [error, setError] = useState<string | null>(null);
    const [GetData, { isLoading: isLoadingGet }] = useGetAllMutation();

    const userId = getLocalStorageItem("user") || null;

    async function loadLastCitas() {
        if (!userId) return
        try {
            const { data: Citas } = await GetData({
                url: "citas",
                filters: {
                    "Filtros": [
                        { "Key": "id_cliente", "Value": userId },
                        { "Key": "estado", "Value": "terminado", "Operator": "<>" }
                    ],
                    "Order": [{ "Key": "id", "Direction": "Desc" }]
                },
                pageSize: 1
            });
            setCitas(Citas?.data[0] || []);
            const { data: Listas } = await GetData({
                url: "listas",
                filters: {
                    "Filtros": [
                        { "Key": "id_cliente", "Value": userId },
                        { "Key": "id", "Value": Citas?.data[0].id_lista }
                    ],
                    "Order": [{ "Key": "id", "Direction": "Desc" }]
                },
                pageSize: 1
            });
            const mappedProducts = JSON.parse(Listas.data[0].array_lista).map(mapApiProductLoadingPage);
            setcartItems(mappedProducts || [])
            setError(null);
        } catch (err) {
            setError('No pudimos cargar la información de tu cita');
            console.error('Error fetching citas:', err);
        }
    }
    useEffect(() => {
        loadLastCitas()
    }, [])


    const subtotal = cartItems.reduce((acc: any, item: any) =>
        acc + (item.precioRegular || item.precio) * item.quantity, 0);

    const discountTotal = cartItems.reduce((acc: any, item: any) =>
        item.discount ? acc + ((item.precioRegular! - item.precio) * item.quantity) : acc, 0);

    const total = subtotal - discountTotal;

    if (!citas.length && isLoadingGet) return <LoadingScreen />
    if (!userId) return <IonPage>
        <HeaderCart back carr />
        <IonContent fullscreen>
            <section className="text-gray-500 w-full h-full flex flex-col gap-4 items-center justify-center">
                <Grid2x2X className="w-40 h-40 text-gray-300" />
                <span>
                    No hay pedidos o clientes registados
                </span>
            </section>
        </IonContent>
    </IonPage>
    return (
        <IonPage>
            <HeaderCart back carr />
            <IonContent fullscreen>
                <BentoGrid>
                    {/* Listado de productos */}
                    <BentoItem
                        rowSpan={3}
                        colSpan={2}
                        title="Listado de productos"
                        description={cartItems.length === 0 ? "Tu carrito está vacío" : ""}
                        icon={<BarChart3 className="h-6 w-6 text-primary" />}
                    >
                        <div className="max-h-[300px] p-4 min-h-0 flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/30 scrollbar-track-transparent transition-colors">
                            {cartItems.length > 0 ? (
                                <>
                                    {cartItems.map((item: any, key: any) => (
                                        <ProductCard product={item} />
                                    ))}
                                    <div className="space-y-2 mt-4">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Subtotal:</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        {discountTotal > 0 && (<div className="flex justify-between text-sm text-green-600">
                                            <span>Descuentos:</span>
                                            <span>-${discountTotal.toFixed(2)}</span>
                                        </div>)}
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    No hay productos en el carrito
                                </div>
                            )}
                        </div>

                        {cartItems.length > 0 && (<div className="flex justify-between font-bold border-t pt-2 text-base">
                            <span>Total:</span>
                            <span>${total.toFixed(2)}</span>
                        </div>)}
                    </BentoItem>

                    {/* Informe del pedido */}
                    <BentoItem
                        rowSpan={3}
                        title="Informe del pedido"
                        description={error || (isLoadingGet ? "Cargando..." : !citas ? "Sin citas recientes" : "")}
                        icon={<Calendar className="h-6 w-6 text-green-500" />}
                    >
                        {isLoadingGet ? (
                            <div className="h-24 animate-pulse bg-muted/50 rounded-lg mt-4" />
                        ) : citas ? (
                            <section className="h-24 bg-muted/50 rounded-lg mt-4 p-4 flex flex-col justify-center gap-2">
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <span className="text-gray-500 font-medium">Fecha:</span>
                                    <span className="col-span-2">
                                        {citas.fecha
                                            ? format(
                                                new Date(citas.fecha),  // Usar Date directamente para parseo seguro
                                                "EEEE d 'de' MMMM, yyyy 'a las' hh:mm",
                                                { locale: es }
                                            )
                                            : 'Fecha no disponible'}
                                    </span>

                                    <span className="text-gray-500 font-medium">Estado:</span>
                                    <span className="col-span-2 capitalize">{citas.estado?.toLowerCase()}</span>

                                    <span className="text-gray-500 font-medium">Servicio:</span>
                                    <span className="col-span-2">{citas.plan}</span>
                                </div>
                            </section>
                        ) : (
                            <div className="h-24 flex items-center justify-center text-gray-500">
                                No se encontraron citas
                            </div>
                        )}
                        <Sucursales />
                    </BentoItem>
                </BentoGrid>
            </IonContent>
        </IonPage>
    )
}
export default Page;