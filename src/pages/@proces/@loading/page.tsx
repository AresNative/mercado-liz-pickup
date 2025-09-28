import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { useGetWithFiltersMutation, usePutMutation } from "@/hooks/reducers/api";
import { LoadingScreen } from "@/pages/@landing/[id]/product-id";
import HeaderCart from "@/pages/@landing/components/header";
import { IonContent, IonPage } from "@ionic/react";
import { BarChart3, Calendar, Grid2x2X, MessageCircle, Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Sucursales, { sucursalesfind } from "./sections/Sucursales";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { useHistory } from "react-router";

// Definición de interfaces actualizadas
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
    servicio: string;
    sucursal_id: number;
    id_lista: number;
    nombre_lista?: string;
    array_lista?: string;
    productos?: Product[];
    fecha_creacion?: string;
}

const Page: React.FC = () => {
    const history = useHistory();
    const [activeCitas, setActiveCitas] = useState<Cita[]>([]);
    const [completedCitas, setCompletedCitas] = useState<Cita[]>([]);
    const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [GetData] = useGetWithFiltersMutation();

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
            subtotal: Number(subtotal.toFixed(2)),
            discountTotal: Number(discountTotal.toFixed(2)),
            total: Number((subtotal - discountTotal).toFixed(2))
        };
    }, [selectedCita]);

    const [putOrder] = usePutMutation();

    const updateCita = async (dataUpdater: any, id: number) => {
        try {
            await putOrder({
                url: "v1/pickup/listas",
                data: dataUpdater,
                id: id
            });
            // Recargar citas después de actualizar
            loadCitas();
        } catch (error) {
            console.error('Error al actualizar cita:', error);
        }
    };

    // Función para parsear productos desde array_lista
    const parseProductsFromCita = (cita: Cita): Cita => {
        if (!cita.array_lista) {
            return { ...cita, productos: [] };
        }

        try {
            const productos = JSON.parse(cita.array_lista);
            return {
                ...cita,
                productos: Array.isArray(productos) ? productos : []
            };
        } catch (err) {
            console.error('Error parsing products for appointment:', cita.id, err);
            return { ...cita, productos: [] };
        }
    };

    // Función para cargar todas las citas
    const loadCitas = async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Obtener todas las citas del usuario
            const response = await GetData({
                url: "v1/pickup/listas",
                filtros: {
                    Filtros: [
                        { Key: "id_cliente", Value: userId }
                    ],
                    Order: [{ Key: "fecha_creacion", Direction: "Desc" }]
                },
                pageSize: 50 // Aumentar para obtener más historial
            }).unwrap();

            const allCitas = response.data || [];

            // Procesar todas las citas para incluir productos
            const citasWithProducts = allCitas.map(parseProductsFromCita);

            // Separar en activas y completadas
            const active = citasWithProducts.filter((cita: any) =>
                cita.estado === "nuevo" || cita.estado === "proceso"
            );

            const completed = citasWithProducts.filter((cita: any) =>
                cita.estado !== "nuevo" && cita.estado !== "proceso"
            );

            setActiveCitas(active);
            setCompletedCitas(completed);

            // Seleccionar la primera cita disponible
            if (active.length > 0) {
                setSelectedCita(active[0]);
            } else if (completed.length > 0) {
                setSelectedCita(completed[0]);
            } else {
                setSelectedCita(null);
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('No pudimos cargar la información de tus citas');
        } finally {
            setIsLoading(false);
        }
    };

    // Cargar citas al montar el componente
    useEffect(() => {
        loadCitas();
    }, [userId]);

    const handleSelectCita = (cita: Cita) => {
        setSelectedCita(cita);
    };

    const handleCancelCita = async (cita: Cita) => {
        if (!cita.fecha) {
            alert('No se puede cancelar: fecha no especificada');
            return false;
        }

        const fechaCita = new Date(cita.fecha);
        const fechaLimite = new Date(fechaCita.getTime() - 15 * 60000);
        const ahora = new Date();

        if (ahora > fechaLimite) {
            alert('No puedes cancelar la cita con menos de 15 minutos de anticipación');
            return false;
        }

        if (window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
            try {
                await updateCita({
                    estado: "cancelado"
                }, cita.id);
                alert('Cita cancelada exitosamente');
                return true;
            } catch (error) {
                console.error('Error al cancelar cita:', error);
                alert('Error al cancelar la cita');
                return false;
            }
        }
        return false;
    };

    // Función para formatear moneda
    const formatCurrency = (amount: number): string => {
        return amount.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Función para formatear fecha
    const formatDate = (dateString: string): string => {
        try {
            return format(
                parseISO(dateString),
                "EEEE d 'de' MMMM, yyyy 'a las' HH:mm",
                { locale: es }
            );
        } catch (error) {
            return "Fecha no especificada";
        }
    };

    // Obtener nombre de sucursal
    const getSucursalName = (sucursalId: number): string => {
        const sucursal = sucursalesfind.find((row: any) => row.id === sucursalId);
        return sucursal?.nombre || "Sucursal no especificada";
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
                        title={`Cita #${selectedCita?.id || "N/A"}`}
                        description={selectedCita?.estado ? `Estado: ${selectedCita.estado}` : "Selecciona una cita"}
                        icon={<BarChart3 className="h-6 w-6 text-primary" />}
                    >
                        <div className="max-h-[300px] md:max-h-[500px] p-4 min-h-0 flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/30 scrollbar-track-transparent transition-colors">
                            {selectedCita?.productos && selectedCita.productos.length > 0 ? (
                                <>
                                    {selectedCita.productos.map((item, index) => (
                                        <article
                                            key={`${item.id}-${index}`}
                                            className="flex flex-col sm:flex-row gap-4 p-4 bg-white border-b border-b-gray-100 hover:shadow-md transition-all duration-300 rounded-lg"
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
                                                            ${formatCurrency(item.precio)}
                                                        </div>
                                                        {item.precioRegular && item.precioRegular > item.precio && (
                                                            <div className="text-xs text-gray-400 line-through">
                                                                ${formatCurrency(item.precioRegular)}
                                                            </div>
                                                        )}
                                                        <span className="text-xs text-gray-500 block">
                                                            {item.quantity} {item.unidad}(s)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}

                                    <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Subtotal:</span>
                                            <span>${formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountTotal > 0 && (
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Descuentos:</span>
                                                <span>-${formatCurrency(discountTotal)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold border-t pt-2 text-base">
                                            <span>Total:</span>
                                            <span>${formatCurrency(total)}</span>
                                        </div>
                                        <footer className="flex items-center justify-between mt-4">
                                            <button
                                                onClick={() => history.push(`/chat/${selectedCita.id}`)}
                                                className="flex gap-1 items-center bg-purple-500 text-white text-xs px-4 py-2 rounded-md cursor-pointer hover:bg-purple-600 transition-colors"
                                            >
                                                <MessageCircle className="size-4" />
                                                Chat
                                            </button>
                                            {selectedCita.estado === "nuevo" && (
                                                <button
                                                    onClick={() => handleCancelCita(selectedCita)}
                                                    className="flex gap-1 items-center bg-red-500 text-white text-xs px-4 py-2 rounded-md cursor-pointer hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash className="size-4" /> Cancelar
                                                </button>
                                            )}
                                        </footer>
                                    </div>
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
                        description={`${activeCitas.length} citas en proceso`}
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
                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                            <div className="flex justify-between items-start">
                                                <span className="text-gray-500 font-medium">Cita #{cita.id}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${cita.estado === "nuevo"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                                    }`}>
                                                    {cita.estado}
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">Fecha:</span>
                                                <span className="block">{formatDate(cita.fecha)}</span>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">Servicio:</span>
                                                <span className="block">{cita.servicio || "Pickup"}</span>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">Productos:</span>
                                                <span className="block">
                                                    {cita.productos?.length || 0} artículos
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">Sucursal:</span>
                                                <span className="block">{getSucursalName(cita.sucursal_id)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 text-center p-4">
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
                        description={`${completedCitas.length} citas anteriores`}
                        icon={<Calendar className="h-6 w-6 text-blue-500" />}
                    >
                        <div className="max-h-[200px] overflow-y-auto pr-2">
                            {completedCitas.length > 0 ? (
                                completedCitas.map((cita) => (
                                    <div
                                        key={cita.id}
                                        className={`bg-muted/30 rounded-lg p-4 mb-4 border-l-4 cursor-pointer transition-colors ${selectedCita?.id === cita.id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-300 hover:bg-gray-50"
                                            }`}
                                        onClick={() => handleSelectCita(cita)}
                                    >
                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                            <div className="flex justify-between items-start">
                                                <span className="text-gray-500 font-medium">Cita #{cita.id}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${cita.estado === "completado"
                                                    ? "bg-green-100 text-green-800"
                                                    : cita.estado === "cancelado"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-gray-100 text-gray-800"
                                                    }`}>
                                                    {cita.estado}
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">Fecha:</span>
                                                <span className="block">{formatDate(cita.fecha)}</span>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">Servicio:</span>
                                                <span className="block">{cita.servicio || "Pickup"}</span>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">Productos:</span>
                                                <span className="block">
                                                    {cita.productos?.length || 0} artículos
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">Sucursal:</span>
                                                <span className="block">{getSucursalName(cita.sucursal_id)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 text-center p-4">
                                    {error || "Aún no tienes citas completadas"}
                                </div>
                            )}
                        </div>
                    </BentoItem>
                </BentoGrid>
            </IonContent>
        </IonPage>
    );
};

export default Page;