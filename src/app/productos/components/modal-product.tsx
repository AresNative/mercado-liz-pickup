import { Producto } from "@/utils/types/page";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonContent,
    IonText,
    IonIcon,
    IonFooter,
    IonAvatar,
    IonRow,
    IonCol,
    IonGrid,
    useIonModal,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
    isPlatform
} from "@ionic/react";
import { star, starHalf, starOutline, arrowBack, close } from "ionicons/icons";
import { Barcode, ChartColumnStackedIcon, Hash, Heart, MessageCircle, ThumbsUp } from "lucide-react";
import AddToCartButton from "./product-add-cart";
import { cn } from "@/utils/functions/cn";
import { IconLiz } from "./ionc-liz";
import { useEffect, useMemo, useState } from "react";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import ProductPreviewModal from "./modal-recomendado";
import { useGetWithFiltersGeneralMutation } from "@/hooks/reducers/api";
import { EnvConfig } from "@/utils/constants/env.config";
import { formatValue } from "@/utils/constants/format-values";

const { hubs: apiUrl } = EnvConfig();

interface ProductModalProps {
    producto: Producto;
    image: string;
    handleFavoriteToggle: (e: React.MouseEvent) => void;
    isFavorite: boolean;
    onDismiss: () => void;
}

interface Unidad {
    id: string;
    unidad: string;
    factor: number;
    precio: number;
    descuento?: number;
    cantidad: number;
}

const ModalProd: React.FC<ProductModalProps> = ({
    producto,
    image: propImage,
    handleFavoriteToggle,
    isFavorite,
    onDismiss
}) => {
    const [image, setImage] = useState(propImage || "");
    const [recomendados, setrecomendados] = useState<Producto[]>([])
    const [recomendadosselect, setrecomendadosselect] = useState()
    const [unidades, setUnidades] = useState<Unidad[]>([]);
    const [unidadSeleccionada, setUnidadSeleccionada] = useState<Unidad>({
        id: producto.id,
        cantidad: producto.cantidad,
        unidad: producto.unidad,
        factor: producto.factor || 1,
        precio: producto.precio,
        descuento: producto.descuento
    });

    const [getWithFilter] = useGetWithFiltersGeneralInIntelisisMutation();
    const [getWithFilterImg] = useGetWithFiltersGeneralMutation();

    const isLowStock = unidadSeleccionada.cantidad > 0 && unidadSeleccionada.cantidad <= 10;
    const isOutOfStock = unidadSeleccionada.cantidad <= 0;

    // Price calculations para la unidad seleccionada
    const { discountPercentage } = useMemo(() => {
        const precioActual = unidadSeleccionada.precio;
        const descuentoActual = unidadSeleccionada.descuento;
        if (descuentoActual && descuentoActual > 0 && precioActual > descuentoActual) {
            const percentage = ((precioActual - descuentoActual) / precioActual) * 100;
            return { discountPercentage: Math.round(percentage) };
        }
        return { discountPercentage: 0 };
    }, [unidadSeleccionada.precio, unidadSeleccionada.descuento]);

    // Función para cargar las unidades disponibles del artículo
    async function cargarUnidades() {
        try {
            const response = await getWithFilter({
                table: `Art AS art INNER JOIN ArtUnidad AS au ON art.Articulo = au.Articulo AND au.Articulo = '${producto.articulo}' INNER JOIN ListaPreciosDUnidad AS lpu ON au.Articulo = lpu.Articulo AND au.Unidad = lpu.Unidad AND lpu.Lista = '(Precio Lista)' INNER JOIN ArtDisponible AS ad on art.Articulo = ad.Articulo AND ad.DispMenosApartado > 0 AND ad.Almacen = 'ALMMAYO' AND (ad.DispMenosApartado / au.Factor) > 0 LEFT JOIN Oferta AS ofr ON ofr.Estatus = 'VIGENTE' AND ofr.FechaD <= GETDATE() AND ofr.FechaA >= GETDATE() AND ofr.SucursalDestino = '4' OR ofr.Estatus = 'VIGENTE' AND ofr.FechaD <= GETDATE() AND ofr.FechaA >= GETDATE() AND ofr.TodasSucursales = 'true' LEFT JOIN OfertaD AS ofrd ON ofr.ID = ofrd.ID AND  ofrd.Articulo = art.Articulo AND ofrd.Unidad = art.Unidad AND ofrd.Precio > 0`,
                pageSize: 10,
                page: 1,
                filtros: {
                    Filtros: [{ key: "au.Articulo", Operator: "=", Value: producto.articulo }],
                    Selects: [
                        { key: "au.Unidad" },
                        { key: "au.Articulo" },
                        { key: "au.Factor" },
                        { key: "lpu.Precio" },
                        { key: "ofrd.Precio", alias: "Descuento" },
                        { key: "ofrd.Porcentaje" },
                    ],
                    Agregaciones: [
                        {
                            Key: "ad.DispMenosApartado",
                            Operation: "SUM",
                            Alias: "Cantidad",
                        },
                    ],
                    Order: [{ Key: "Factor", Direction: "ASC" }],
                },
                signal: undefined,
            }).unwrap();

            if (response && response.data) {
                const unidadesData: Unidad[] = response.data.map((item: any) => {
                    let descuentoValor = 0;
                    if (item.Porcentaje) {
                        descuentoValor = item.Precio - ((item.Porcentaje / 100) * item.Precio);
                    } else if (item.Descuento) {
                        descuentoValor = item.Descuento;
                    }
                    return {
                        id: `${item.Articulo}-${item.Unidad}-${item.Factor}`,
                        unidad: item.Unidad || "Unidad",
                        factor: item.Factor || 1,
                        precio: item.Precio || 0,
                        descuento: descuentoValor,
                        cantidad: item.Cantidad || 0
                    };
                });

                setUnidades(unidadesData);

                // Seleccionar la unidad por defecto: la que coincide con producto.unidad, o la primera
                const unidadDefault = unidadesData.find(u => u.unidad === producto.unidad) || unidadesData[0];
                if (unidadDefault) {
                    setUnidadSeleccionada(unidadDefault);
                }
            }
        } catch (error) {
            console.error("Error al cargar unidades:", error);
            // En caso de error, mantener la unidad original
            setUnidades([{
                id: producto.id,
                unidad: producto.unidad,
                factor: producto.factor || 1,
                precio: producto.precio,
                descuento: producto.descuento,
                cantidad: producto.cantidad
            }]);
        }
    }

    async function LoadImage() {
        if (propImage) {
            setImage(propImage);
            return;
        }
        try {
            const response = await getWithFilterImg({
                table: `imagenes left join articulos on articulos.id = imagenes.id_ref`,
                pageSize: 10,
                page: 1,
                tag: 'Productos',
                filtros: {
                    "Filtros": [
                        {
                            "Key": "articulo",
                            "Value": producto.articulo,
                            "Operator": "="
                        },
                        {
                            "Key": "tabla",
                            "Value": "articulos",
                            "Operator": "="
                        }
                    ],
                    "Selects": [
                        { key: "articulos.id" },
                        { key: "articulos.nombre" },
                        { key: "articulos.descripcion" },
                        { key: "articulos.precio" },
                        { key: "imagenes.url" }
                    ]
                }
            }).unwrap();

            if (response && response.data && response.data.length > 0) {
                const imgUrl = apiUrl.slice(0, -1) + response.data[0].url;
                setImage(imgUrl);
            }
        } catch (error) {
            console.error("Error loading image", error);
        }
    }

    async function LoadRecomendados() {
        try {
            const response = await getWithFilter({
                table: `CB AS cb INNER JOIN Art AS art ON cb.Cuenta = art.Articulo INNER JOIN ListaPreciosDUnidad AS lpu ON art.Articulo = lpu.Articulo AND cb.Unidad = lpu.Unidad AND lpu.Lista = '(Precio Lista)' AND lpu.Precio > 0 INNER JOIN ArtUnidad AS au ON art.Articulo = au.Articulo AND lpu.Unidad = au.Unidad INNER JOIN ArtDisponible AS ad On ad.Almacen = 'ALMMAYO' AND art.Articulo = ad.Articulo LEFT JOIN Oferta AS ofr On ofr.Articulo = art.Articulo AND ofr.Estatus = 'VIGENTE' AND ofr.FechaD < GETDATE() AND ofr.FechaA > GETDATE() LEFT JOIN OfertaD AS ofrd On ofr.ID = ofrd.ID AND ofrd.Articulo = art.Articulo AND ofrd.Unidad = cb.Unidad `,
                pageSize: 4,
                page: 1,
                filtros: {
                    Filtros: [{ key: "art.Grupo", Operator: "=", Value: producto.categoria }],
                    Selects: [
                        { key: "cb.Codigo" },
                        { key: "art.Articulo" },
                        { key: "art.Grupo" },
                        { key: "art.Descripcion1" },
                        { key: "lpu.Unidad" },
                        { key: "lpu.Precio" },
                        { key: "ofrd.Precio", alias: "Descuento" },
                        { key: "au.Unidad", alias: "UnidadFactor" },
                        { key: "au.Factor" },
                    ],
                    Agregaciones: [
                        {
                            Key: "ad.DispMenosApartado",
                            Operation: "SUM",
                            Alias: "Cantidad",
                        },
                    ],
                    Order: [{ Key: "Codigo", Direction: "DESC" }],
                },
                signal: undefined,
            }).unwrap();

            if (response && response.data) {
                const apiData: any = response.data;
                const mappedItems: Producto[] = apiData.map((item: any) => ({
                    id: `${item.Articulo}-${item.Unidad}-${item.Factor}`,
                    articulo: item.Articulo || "Articulo",
                    nombre: item.Descripcion1 || "Sin nombre",
                    categoria: item.Grupo || "Sin categoría",
                    unidad: item.Unidad || "Unidad",
                    precio: item.Precio || 0,
                    cantidad: item.Cantidad || 1,
                    factor: item.Factor || 1,
                    impuesto1: 0,
                    impuesto2: 0,
                    tipoImpuesto1: 0,
                    tipoImpuesto2: 0,
                    descuento: item.Descuento || 0,
                }));
                setrecomendados(mappedItems);
            }
        } catch (error) {
            console.error("Error loading recomendados", error);
        }
    }

    useEffect(() => {
        LoadImage();
        LoadRecomendados();
        cargarUnidades();
    }, [producto]);

    const [present, dismiss] = useIonModal(ProductPreviewModal, {
        producto: recomendadosselect,
        onDismiss: () => dismiss(),
    });

    useEffect(() => {
        if (!recomendadosselect) return;
        present(isPlatform('desktop') ? {
                    initialBreakpoint: 0.95,
                    breakpoints: [0, 0.5, 0.95],
                } : undefined);
    }, [recomendadosselect]);

    const handleUnidadChange = (unidad: string) => {
        const unidadEncontrada = unidades.find(u => u.unidad === unidad);
        if (unidadEncontrada) {
            setUnidadSeleccionada(unidadEncontrada);
        }
    };

    const formatearStock = (cantidad: number, unidad: string, factor: number = 1) => {
        if (/kilo|kg/i.test(unidad)) {
            return (cantidad / factor).toFixed(2);
        } else {
            return Math.trunc(cantidad / factor);
        }
    };

    const productoActualizado: Producto = useMemo(() => {
        return {
            ...producto,
            id: `${producto.articulo}-${unidadSeleccionada.unidad}-${unidadSeleccionada.factor}`,
            unidad: unidadSeleccionada.unidad,
            factor: unidadSeleccionada.factor,
            precio: unidadSeleccionada.precio,
            descuento: unidadSeleccionada.descuento,
            cantidad: unidadSeleccionada.cantidad,
        };
    }, [producto, unidadSeleccionada]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="bg-purple-600 text-white">
                    <IonButton
                        fill="clear"
                        slot="start"
                        color={"light"}
                        onClick={onDismiss}
                    >
                        <IonIcon icon={close} />
                    </IonButton>
                    <IonText className="text-center">
                        <h1 className="text-lg font-semibold">Detalles del Producto</h1>
                    </IonText>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <article className="flex flex-col gap-4">
                    {/* Imagen del producto */}
                    <header className="relative rounded-lg overflow-hidden flex justify-center">
                        {image ? (
                            <img
                                src={image}
                                alt="Product Image"
                                className="w-full max-w-[300px] object-contain aspect-square"
                            />
                        ) : (
                            <IconLiz fill="#DBDBDB" width="300" height="300" />
                        )}
                        <ul className="absolute w-[90%] mx-auto top-2 flex justify-between items-center">
                            <li className="flex flex-col gap-1">
                                {discountPercentage > 0 && (
                                    <div className="w-full text-center border-2 bg-red-100 border-red-600 text-red-600 text-xs font-semibold px-2 py-1 rounded-md">
                                        -{discountPercentage}%
                                    </div>
                                )}
                                {isLowStock && (
                                    <div className="w-full text-center border-2 bg-yellow-100 border-yellow-600 text-yellow-600 text-xs font-semibold px-2 py-1 rounded-md">
                                        última(s) {formatearStock(unidadSeleccionada.cantidad, unidadSeleccionada.unidad, unidadSeleccionada.factor)} {unidadSeleccionada.unidad}(s)
                                    </div>
                                )}
                                {isOutOfStock && (
                                    <div className="w-full text-center border-2 bg-gray-100 border-gray-600 text-gray-600 text-xs font-semibold px-2 py-1 rounded-md">
                                        agotado
                                    </div>
                                )}
                            </li>
                            {handleFavoriteToggle && (
                                <button
                                    onClick={handleFavoriteToggle}
                                    className="top-2 right-10 p-1.5 bg-white/80 rounded-full backdrop-blur-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}>
                                    <Heart
                                        className={cn(
                                            "w-6 h-6 transition-colors",
                                            isFavorite
                                                ? "fill-red-400 text-red-500"
                                                : "text-gray-400 hover:text-red-400"
                                        )}
                                    />
                                </button>
                            )}
                        </ul>
                    </header>

                    {/* Información básica del producto */}
                    <section className="space-y-3">
                        <label className="font-bold text-lg">{producto.nombre}</label>

                        {/* Selector de Unidad */}
                        {unidades.length > 1 && (
                            <IonItem className="rounded-lg border border-gray-200 px-2">
                                <IonLabel position="stacked">Seleccionar Unidad</IonLabel>
                                <IonSelect
                                    value={unidadSeleccionada.unidad}
                                    onIonChange={(e) => handleUnidadChange(e.detail.value)}
                                    interface="action-sheet"
                                >
                                    {unidades.map((unidad, index) => (
                                        <IonSelectOption key={index} value={unidad.unidad}>
                                            {unidad.unidad} {unidad.factor !== 1 && `(Contiene: ${unidad.factor} pzs.)`}
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                        )}

                        {/* Precio */}
                        <div className="flex items-center gap-2">
                            {unidadSeleccionada.descuento && unidadSeleccionada.descuento > 0 ? (
                                <>
                                    <span className="text-2xl font-bold text-purple-600">
                                        {formatValue(unidadSeleccionada.descuento, "currency")}
                                    </span>
                                    <span className="text-sm text-gray-500 line-through">
                                        {formatValue(unidadSeleccionada.precio, "currency")}
                                    </span>
                                </>
                            ) : (
                                <span className="text-2xl font-bold text-purple-600">
                                    {formatValue(unidadSeleccionada.precio, "currency")}
                                </span>
                            )}
                            <span className="text-sm text-gray-500">
                                / {unidadSeleccionada.unidad}
                            </span>
                        </div>

                        {/* Detalles */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Hash className="size-4 text-purple-600" />
                                <IonText color="medium">
                                    <span>
                                        Stock: {formatearStock(unidadSeleccionada.cantidad, unidadSeleccionada.unidad, unidadSeleccionada.factor)} {unidadSeleccionada.unidad}(s)
                                        {unidadSeleccionada.factor > 1 && (
                                            <span className="text-gray-500 ml-2">
                                                (Contiene: {unidadSeleccionada.factor} pzs.)
                                            </span>
                                        )}
                                    </span>
                                </IonText>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <ChartColumnStackedIcon className="size-4 text-purple-600" />
                                <IonText color="medium">
                                    <span>Categoría: {producto.categoria}</span>
                                </IonText>
                            </div>
                        </div>
                    </section>

                    {/* Sección de Productos Recomendados */}
                    {recomendados.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <IonText>
                                <h2 className="text-lg font-semibold mb-4">Productos Recomendados</h2>
                            </IonText>

                            <IonGrid className="p-0">
                                <IonRow>
                                    {recomendados.map((recommended:any) => (
                                        <IonCol size="6" key={recommended.id}>
                                            <div
                                                className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => setrecomendadosselect(recommended)}
                                            >
                                                <img
                                                    src="/logo.jpg"
                                                    alt={recommended.nombre}
                                                    className="w-16 h-16 object-cover mx-auto mb-2 rounded"
                                                />
                                                <IonText>
                                                    <p className="text-xs font-medium mb-1 line-clamp-2">{recommended.nombre}</p>
                                                </IonText>
                                                <span className="text-sm font-bold text-purple-800">
                                                    {formatValue(recommended.precio, "currency")}
                                                </span>
                                            </div>
                                        </IonCol>
                                    ))}
                                </IonRow>
                            </IonGrid>
                        </div>
                    )}
                </article>
            </IonContent>

            <IonFooter className="bg-white border-t border-gray-200">
                <IonToolbar>
                    <div className="flex items-center justify-between px-4 pt-2 pb-10 md:pb-16">
                        <div className="flex flex-col">
                            <strong className="text-gray-500">Agregar a carrito</strong>
                            {unidades.length > 1 && (
                                <span className="text-xs text-gray-400">
                                    Unidad: {unidadSeleccionada.unidad}
                                </span>
                            )}
                        </div>
                        <AddToCartButton
                            id={productoActualizado.id}
                            cantidad={formatearStock(unidadSeleccionada.cantidad, unidadSeleccionada.unidad, unidadSeleccionada.factor)}
                            producto={productoActualizado}
                        />
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
}

export default ModalProd;