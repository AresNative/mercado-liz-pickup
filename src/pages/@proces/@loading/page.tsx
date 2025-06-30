import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { useGetAllMutation, usePutMutation } from "@/hooks/reducers/api";
import { LoadingScreen } from "@/pages/@landing/[id]/product-id";
import HeaderCart from "@/pages/@landing/components/header";
import { IonContent, IonPage } from "@ionic/react";
import { BarChart3, Calendar, Grid2x2X, Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Sucursales, { sucursalesfind } from "./sections/Sucursales";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

// Definición de interfaces
interface Product {
    id: number;
    nombre: string;
    precio: number;
    precioRegular?: number;
    quantity: number;
    unidad: string;
    image?: string;
    categoria: string;
}

interface Cita {
    id: number;
    fecha: string;
    estado: string;
    plan: string;
    sucursal: string;
    id_lista: number;
    productos?: Product[];
}

const Page: React.FC = () => {
    const [activeCitas, setActiveCitas] = useState<Cita[]>([]);
    const [completedCitas, setCompletedCitas] = useState<Cita[]>([]);
    const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [GetData] = useGetAllMutation();

    const userId = getLocalStorageItem("user");

    // Calcular totales para la cita seleccionada
    const { subtotal, discountTotal, total } = useMemo(() => {
        if (!selectedCita || !selectedCita.productos || selectedCita.productos.length === 0) {
            return { subtotal: 0, discountTotal: 0, total: 0 };
        }

        const cartItems = selectedCita.productos;

        const subtotal = cartItems.reduce(
            (acc, item) => acc + (item.precioRegular || item.precio) * item.quantity,
            0
        );

        const discountTotal = cartItems.reduce(
            (acc, item) => item.precioRegular
                ? acc + (item.precioRegular - item.precio) * item.quantity
                : acc,
            0
        );

        return {
            subtotal,
            discountTotal,
            total: subtotal - discountTotal
        };
    }, [selectedCita]);
    const [putOrder] = usePutMutation();
    const updateCita = async (dataUpdater: any, id: number) => {
        await putOrder({
            url: "citas",
            data: dataUpdater,
            id: id
        });
    };
    // Cargar todas las citas y sus productos
    useEffect(() => {
        const loadCitas = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                // Obtener citas activas (no terminadas)
                const activeResponse = await GetData({
                    url: "citas",
                    filters: {
                        Filtros: [
                            { Key: "id_cliente", Value: userId },
                            { Key: "estado", Value: "nuevo", Operator: "like" },
                            { Key: "estado", Value: "proceso", Operator: "=" }
                        ],
                        Order: [{ Key: "fecha", Direction: "Asc" }]
                    },
                    pageSize: 2
                });

                const activeCitasData = activeResponse.data?.data || [];

                // Obtener citas completadas (terminadas)
                const completedResponse = await GetData({
                    url: "citas",
                    filters: {
                        Filtros: [
                            { Key: "id_cliente", Value: userId },
                            { Key: "estado", Value: "listo", operator: "like" },
                            { Key: "estado", Value: "cancelado", operator: "like" }
                        ],
                        Order: [{ Key: "fecha", Direction: "Desc" }]
                    },
                    pageSize: 10
                });

                const completedCitasData = completedResponse.data.data || [];

                // Cargar productos para cada cita
                const loadProductsForCitas = async (citas: Cita[]) => {
                    return await Promise.all(
                        citas.map(async (cita) => {
                            try {
                                const listasResponse = await GetData({
                                    url: "listas",
                                    filters: {
                                        Filtros: [
                                            { Key: "id_cliente", Value: userId },
                                            { Key: "id", Value: cita.id_lista }
                                        ]
                                    },
                                    pageSize: 1
                                });

                                const lista = listasResponse.data?.data[0];

                                if (lista && lista.array_lista) {

                                    return {
                                        ...cita,
                                        productos: JSON.parse(lista.array_lista) || []
                                    };
                                }
                                return cita;
                            } catch (err) {
                                console.error('Error loading products for appointment:', cita.id, err);
                                return cita;
                            }
                        })
                    );
                };

                // Cargar productos solo para citas activas y la primera completada
                const loadedActiveCitas = await loadProductsForCitas(activeCitasData);
                const loadedCompletedCitas = completedCitasData.length > 0 ?
                    completedCitasData
                    : [];

                setActiveCitas(loadedActiveCitas);
                setCompletedCitas(loadedCompletedCitas);

                // Seleccionar la primera cita activa si existe
                if (loadedActiveCitas.length > 0) {
                    setSelectedCita(loadedActiveCitas[0]);
                } else if (loadedCompletedCitas.length > 0) {
                    setSelectedCita(loadedCompletedCitas[0]);
                }

                setError(null);
            } catch (err) {
                setError('No pudimos cargar la información de tus citas');
                console.error('Error fetching data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadCitas();
    }, [userId, GetData]);

    const handleSelectCita = (cita: Cita) => {
        setSelectedCita(cita);
        // Cargar productos si no están cargados
        if (!cita.productos && cita.id_lista) {
            loadProductsForCita(cita);
        }
    };

    const loadProductsForCita = async (cita: Cita) => {
        try {
            const listasResponse = await GetData({
                url: "listas",
                filters: {
                    Filtros: [
                        { Key: "id_cliente", Value: userId },
                        { Key: "id", Value: cita.id_lista }
                    ]
                },
                pageSize: 1
            });

            const lista = listasResponse.data?.data[0];

            if (lista) {
                const updatedCita = {
                    ...cita,
                    productos: JSON.parse(lista.array_lista) || []
                };

                // Actualizar en el estado correspondiente
                if (activeCitas.some(ac => ac.id === cita.id)) {
                    setActiveCitas(prev => prev.map(c => c.id === cita.id ? updatedCita : c));
                } else {
                    setCompletedCitas(prev => prev.map(c => c.id === cita.id ? updatedCita : c));
                }
                setSelectedCita(updatedCita);
            }
        } catch (err) {
            console.error('Error loading products for appointment:', cita.id, err);
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!userId) {
        return (
            <IonPage>
                <HeaderCart back carr />
                <IonContent role="feed" fullscreen>
                    <section className="w-full h-full flex flex-col gap-4 items-center justify-center text-gray-500">
                        <Grid2x2X className="w-40 h-40 text-gray-300" />
                        <span>No hay pedidos o clientes registrados</span>
                    </section>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <HeaderCart back carr />
            <IonContent role="feed" fullscreen>
                <BentoGrid>
                    {/* Productos de la cita seleccionada */}
                    <BentoItem
                        rowSpan={2}
                        colSpan={2}
                        title={`Productos de la cita ${selectedCita ? selectedCita?.id : ""} `}
                        description={selectedCita?.productos?.length ? "" : "No hay productos en esta cita"}
                        icon={<BarChart3 className="h-6 w-6 text-primary" />}
                    >
                        <div className="max-h-[300px] md:max-h-[500px] p-4 min-h-0 flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/30 scrollbar-track-transparent transition-colors">
                            {selectedCita?.productos?.length ? (
                                <>
                                    {selectedCita.productos.map((item, index) => (
                                        <article
                                            key={`${item.id}-${index}`}
                                            className="flex flex-col sm:flex-row gap-4 p-4 bg-white border-b border-b-gray-100 hover:shadow-md transition-all duration-300"
                                        >
                                            {item.image && (
                                                <div className="bg-gray-100 rounded-xl flex items-center justify-center sm:w-24 w-full h-20 flex-shrink-0">
                                                    <img
                                                        src={item.image}
                                                        alt={item.nombre}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 w-full">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm sm:text-base">
                                                            {item.nombre}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-1 capitalize">
                                                            {item.categoria}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-gray-900 text-sm sm:text-base">
                                                            ${item.precio.toLocaleString('es-MX', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2
                                                            })}
                                                        </div>
                                                        <span className="text-xs text-gray-500 block">
                                                            {item.quantity} {item.unidad}(s)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}

                                    {(discountTotal > 0 || selectedCita.productos.length > 0) && (
                                        <div className="space-y-2 mt-4">
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Subtotal:</span>
                                                <span>
                                                    ${subtotal.toLocaleString('es-MX', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </span>
                                            </div>
                                            {discountTotal > 0 && (
                                                <div className="flex justify-between text-sm text-green-600">
                                                    <span>Descuentos:</span>
                                                    <span>
                                                        -${discountTotal.toLocaleString('es-MX', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold border-t pt-2 text-base">
                                                <span>Total:</span>
                                                <span>
                                                    ${total.toLocaleString('es-MX', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </span>
                                            </div>
                                            <footer>

                                                {selectedCita.fecha && (() => {
                                                    const fechaCita = new Date(selectedCita.fecha);
                                                    const fechaLimite = new Date(fechaCita.getTime() + 15 * 60000); // 15 min en milisegundos
                                                    const ahora = new Date();

                                                    if (ahora < fechaLimite) {
                                                        return (
                                                            <button
                                                                onClick={() => updateCita({
                                                                    Citas: [{
                                                                        Id_Cliente: userId,
                                                                        Id_Usuario_Responsable: 1,
                                                                        Plan: "Pick Up",
                                                                        Id_Lista: selectedCita.id_lista,
                                                                        Estado: "cancelado"
                                                                    }]
                                                                }, selectedCita.id)}
                                                                className="flex gap-1 items-center bg-red-500 text-white text-xs px-4 py-2 rounded-md cursor-pointer"
                                                            >
                                                                <Trash className="size-4" /> Cancelar
                                                            </button>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </footer>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    {selectedCita ? "No hay productos en esta cita" : "Selecciona una cita para ver sus productos"}
                                </div>
                            )}
                        </div>
                    </BentoItem>

                    {/* Citas Activas */}
                    <BentoItem
                        rowSpan={2}
                        colSpan={1}
                        title="Citas Activas"
                        description={activeCitas.length === 0 ? "No tienes citas activas" : ""}
                        icon={<Calendar className="h-6 w-6 text-green-500" />}
                    >
                        <div className="max-h-[300px] md:max-h-[500px] overflow-y-auto pr-2">
                            {activeCitas.length > 0 ? (
                                activeCitas.map((cita) => (
                                    <div
                                        key={cita.id}
                                        className={`bg-muted/50 rounded-lg p-4 mb-4 border-l-4 cursor-pointer transition-colors ${selectedCita?.id === cita.id
                                            ? "border-green-500 bg-green-50"
                                            : "border-green-300 hover:bg-green-50"
                                            }`}
                                        onClick={() => handleSelectCita(cita)}
                                    >
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <span className="text-gray-500 font-medium">Fecha:</span>
                                            <span className="col-span-2">
                                                {format(
                                                    parseISO(cita.fecha),
                                                    "EEEE d 'de' MMMM, yyyy 'a las' HH:mm",
                                                    { locale: es }
                                                )}
                                            </span>

                                            <span className="text-gray-500 font-medium">Estado:</span>
                                            <span className="col-span-2 capitalize text-green-600 font-medium">
                                                {cita.estado.toLowerCase()}
                                            </span>

                                            <span className="text-gray-500 font-medium">Servicio:</span>
                                            <span className="col-span-2">{cita.plan}</span>

                                            <span className="text-gray-500 font-medium">Productos:</span>
                                            <span className="col-span-2">
                                                {cita.productos?.length || 0} artículos
                                            </span>

                                            <span className="text-gray-500 font-medium">Sucursal:</span>
                                            <span className="col-span-2">
                                                {sucursalesfind.find((row) => row.precio === cita.sucursal)?.nombre || "No especificada"}
                                            </span>
                                        </div>
                                        <Sucursales sucursalVista={cita.sucursal} />
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    {error || "No tienes citas activas en este momento"}
                                </div>
                            )}
                        </div>
                    </BentoItem>

                    {/* Citas Completadas */}
                    <BentoItem
                        rowSpan={3}
                        colSpan={3}
                        title="Historial de Citas"
                        description={completedCitas.length === 0 ? "No tienes citas anteriores" : ""}
                        icon={<Calendar className="h-6 w-6 text-blue-500" />}
                    >
                        <div className="max-h-[200px] overflow-y-auto pr-2">
                            {completedCitas.length > 0 ? (
                                completedCitas.map((cita) => (
                                    <div
                                        key={cita.id}
                                        className={`bg-muted/30 rounded-lg p-4 mb-4 border-l-4 cursor-pointer ${selectedCita?.id === cita.id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-300 hover:bg-gray-50"
                                            }`}
                                        onClick={() => handleSelectCita(cita)}
                                    >
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <span className="text-gray-500 font-medium">Fecha:</span>
                                            <span className="col-span-2">
                                                {format(
                                                    parseISO(cita.fecha),
                                                    "EEEE d 'de' MMMM, yyyy 'a las' HH:mm",
                                                    { locale: es }
                                                )}
                                            </span>

                                            <span className="text-gray-500 font-medium">Estado:</span>
                                            <span className="col-span-2 capitalize text-gray-600">
                                                {cita.estado}
                                            </span>

                                            <span className="text-gray-500 font-medium">Servicio:</span>
                                            <span className="col-span-2">{cita.plan}</span>

                                            <span className="text-gray-500 font-medium">Sucursal:</span>
                                            <span className="col-span-2">
                                                {sucursalesfind.find((row) => row.precio === cita.sucursal)?.nombre || "No especificada"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    {error || "Aún no tienes citas completadas"}
                                </div>
                            )}
                        </div>
                    </BentoItem>
                </BentoGrid>
            </IonContent>
        </IonPage >
    );
};

export default Page;