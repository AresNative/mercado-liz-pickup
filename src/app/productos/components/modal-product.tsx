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
    IonLabel
} from "@ionic/react";
import { star, starHalf, starOutline, arrowBack, close } from "ionicons/icons";
import { Barcode, ChartColumnStackedIcon, Hash, Heart, MessageCircle, ThumbsUp } from "lucide-react";
import AddToCartButton from "./product-add-cart";
import { cn } from "@/utils/functions/cn";
import { IconLiz } from "./ionc-liz";
import { useEffect, useMemo, useState } from "react";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import ProductPreviewModal from "./modal-recomendado";

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

// Datos de ejemplo para comentarios
const sampleComments = [
    {
        id: 1,
        user: "María González",
        avatar: "/logo.jpg",
        rating: 5,
        comment: "Excelente producto, muy buena calidad y llegó en perfecto estado.",
        date: "2024-01-15",
        likes: 12
    },
    {
        id: 2,
        user: "Carlos Rodríguez",
        avatar: "/logo.jpg",
        rating: 4,
        comment: "Buen producto, cumple con lo esperado. La entrega fue rápida.",
        date: "2024-01-10",
        likes: 8
    },
    {
        id: 3,
        user: "Ana Martínez",
        avatar: "/logo.jpg",
        rating: 3,
        comment: "Regular, esperaba algo mejor por el precio.",
        date: "2024-01-05",
        likes: 3
    }
];

const ModalProd: React.FC<ProductModalProps> = ({
    producto,
    image,
    handleFavoriteToggle,
    isFavorite,
    onDismiss
}) => {
    const [recomendados, setrecomendados] = useState<Producto[]>([])
    const [recomendadosselect, setrecomendadosselect] = useState()
    const [unidades, setUnidades] = useState<Unidad[]>([]);
    const [unidadSeleccionada, setUnidadSeleccionada] = useState<Unidad>({
        id: producto.id,
        unidad: producto.unidad,
        factor: producto.factor || 1,
        precio: producto.precio,
        descuento: producto.descuento,
        cantidad: producto.cantidad
    });

    const [getWithFilter] = useGetWithFiltersGeneralInIntelisisMutation();
    const isLowStock = unidadSeleccionada.cantidad > 0 && unidadSeleccionada.cantidad <= 10;
    const isOutOfStock = unidadSeleccionada.cantidad <= 0;

    // Price calculations para la unidad seleccionada
    const { discountPercentage } = useMemo(() => {
        const precio = unidadSeleccionada.precio;
        const descuento = unidadSeleccionada.descuento || 0;
        const percentage = descuento > 0
            ? ((precio - descuento) / precio) * 100
            : 0;
        let roundedDiscount = Math.round(percentage);
        return { discountPercentage: roundedDiscount };
    }, [unidadSeleccionada.precio, unidadSeleccionada.descuento]);

    // Calcular rating promedio
    const averageRating = sampleComments.reduce((acc, comment) => acc + comment.rating, 0) / sampleComments.length;

    // Renderizar estrellas
    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => {
            const starValue = index + 1;
            if (starValue <= Math.floor(rating)) {
                return <IonIcon key={index} icon={star} className="text-yellow-400" />;
            } else if (starValue === Math.ceil(rating) && !Number.isInteger(rating)) {
                return <IonIcon key={index} icon={starHalf} className="text-yellow-400" />;
            } else {
                return <IonIcon key={index} icon={starOutline} className="text-yellow-400" />;
            }
        });
    };

    // Función para cargar las unidades disponibles del artículo
    async function cargarUnidades() {
        try {
            const response = await getWithFilter({
                table: `
                ArtUnidad AS au
                INNER JOIN ListaPreciosDUnidad AS lpu 
                    ON au.Articulo = lpu.Articulo 
                    AND au.Unidad = lpu.Unidad
                    AND lpu.Lista = '(Precio Lista)'
                LEFT JOIN ArtDisponible AS ad 
                    ON au.Articulo = ad.Articulo 
                    AND ad.Almacen = 'ALMMAYO'
                LEFT JOIN (
                    SELECT *, 
                        ROW_NUMBER() OVER (PARTITION BY Articulo, Unidad ORDER BY id DESC) AS rn
                    FROM OfertaD
                ) AS ofrd 
                    ON ofrd.Articulo = au.Articulo 
                    AND ofrd.Unidad = au.Unidad 
                    AND ofrd.rn = 1
            `,
                pageSize: 10,
                page: 1,
                filtros: {
                    Filtros: [{ key: "au.Articulo", Operator: "=", Value: producto.articulo }],
                    Selects: [
                        { key: "au.Unidad" },
                        { key: "au.Factor" },
                        { key: "lpu.Precio" },
                        { key: "ofrd.Precio", alias: "Descuento" },
                    ],
                    Agregaciones: [
                        {
                            Key: "ad.DispMenosApartado",
                            Operation: "SUM",
                            Alias: "Cantidad",
                        },
                    ],
                    Order: [{ Key: "au.Factor", Direction: "ASC" }],
                },
                signal: undefined,
            }).unwrap();

            if (response && response.data) {
                const unidadesData: Unidad[] = response.data.map((item: any) => ({
                    id: `${producto.codigo}-${item.Unidad}`, // ID único con artículo y unidad
                    unidad: item.Unidad || "Unidad",
                    factor: item.Factor || 1,
                    precio: item.Precio || 0,
                    descuento: item.Descuento || 0,
                    cantidad: item.Cantidad || 0
                }));

                setUnidades(unidadesData);

                // Seleccionar la unidad por defecto si existe en las unidades cargadas
                const unidadDefault = unidadesData.find(u => u.unidad === producto.unidad) || unidadesData[0];
                if (unidadDefault) {
                    setUnidadSeleccionada(unidadDefault);
                }
            }
        } catch (error) {
            console.error("Error al cargar unidades:", error);
            // En caso de error, mantener la unidad original con ID correcto
            setUnidades([{
                id: `${producto.articulo}-${producto.unidad}`, // ID único
                unidad: producto.unidad,
                factor: producto.factor || 1,
                precio: producto.precio,
                descuento: producto.descuento,
                cantidad: producto.cantidad
            }]);
        }
    }

    async function LoadImage() {
        const response = await getWithFilter({
            table: `
                CB AS cb
                    INNER JOIN Art AS art
                        ON cb.Cuenta = art.Articulo
                    INNER JOIN ListaPreciosDUnidad AS lpu
                        ON art.Articulo = lpu.Articulo
                        AND cb.Unidad = lpu.Unidad
                        AND lpu.Lista = '(Precio Lista)'
                        AND lpu.Precio > 0
                    INNER JOIN ArtUnidad AS au
                        ON art.Articulo = au.Articulo
                        AND lpu.Unidad = au.Unidad
                    INNER JOIN ArtDisponible AS ad On Almacen = 'ALMMAYO' AND art.Articulo = ad.Articulo
                    LEFT JOIN (
                                    SELECT *,
                                        ROW_NUMBER() OVER (PARTITION BY Articulo, Unidad ORDER BY id DESC) AS rn
                                    FROM OfertaD
                                ) AS ofrd On ofrd.Articulo = art.Articulo AND ofrd.Unidad = cb.Unidad AND ofrd.rn = 1
                    LEFT JOIN Oferta AS ofr On ofr.Articulo = art.Articulo AND ofr.FechaD < GETDATE() AND ofr.FechaA > GETDATE()
                `,
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
                Order: [{ Key: "cb.Codigo", Direction: "DESC" }],
            },
            signal: undefined,
        }).unwrap();

        if (response && response.data) {
            const apiData: any = response.data;

            if (apiData && apiData.length > 0) {
                const mappedItems: Producto[] = apiData.map((item: any) => ({
                    id: item.Codigo || `item-${Date.now()}-${Math.random()}`,
                    articulo: item.Articulo || "Articulo",
                    nombre: item.Descripcion1 || "Sin nombre",
                    categoria: item.Grupo || "Sin categoría",
                    unidad: item.Unidad || "Unidad",
                    precio: item.Precio || 0,
                    cantidad: item.Cantidad || 1,
                    factor: item.Factor || 1,
                    impuesto1: item.Impuesto1 || 0,
                    impuesto2: item.Impuesto2 || 0,
                    tipoImpuesto1: item.TipoImpuesto1 || 0,
                    tipoImpuesto2: item.TipoImpuesto2 || 0,
                    descuento: item.Descuento || 0,
                }));

                setrecomendados(mappedItems);
            }
        }
    }

    useEffect(() => {
        LoadImage();
        cargarUnidades();
    }, [producto]);

    // Corrección: pasar las opciones del modal al presentarlo
    const [present, dismiss] = useIonModal(ProductPreviewModal, {
        producto: recomendadosselect,
        onDismiss: () => dismiss(),
    });

    useEffect(() => {
        if (!recomendadosselect) return;

        present({
            initialBreakpoint: 0.95,
            breakpoints: [0, 0.5, 0.95],
        });
    }, [recomendadosselect]);

    // Función para manejar el cambio de unidad
    const handleUnidadChange = (unidad: string) => {
        const unidadEncontrada = unidades.find(u => u.unidad === unidad);
        if (unidadEncontrada) {
            // Crear un ID único que combine el artículo y la unidad seleccionada
            const nuevoId = `${producto.codigo}-${unidad}`;

            setUnidadSeleccionada({
                ...unidadEncontrada,
                id: nuevoId // Actualizar el ID con la unidad seleccionada
            });
        }
    };

    // Función para formatear el stock según la unidad
    const formatearStock = (cantidad: number, unidad: string, factor: number) => {
        if (/kilo|kg/i.test(unidad)) {
            return unidad !== 'Pieza'
                ? (factor ? (cantidad / factor).toFixed(2) : cantidad.toFixed(2))
                : cantidad.toFixed(0);
        } else {
            return unidad !== 'Pieza'
                ? (factor ? Math.trunc(cantidad / factor) : Math.trunc(cantidad))
                : Math.trunc(cantidad);
        }
    };

    // Y en el productoActualizado, asegúrate de usar el ID correcto
    const productoActualizado: Producto = useMemo(() => {
        // Usar el ID de unidadSeleccionada que ahora se actualiza correctamente
        const idUnico = unidadSeleccionada.id || `${producto.codigo}-${unidadSeleccionada.unidad}`;

        return {
            ...producto,
            id: idUnico, // Usar el ID único que incluye la unidad
            codigo: producto.codigo || producto.id,
            articulo: producto.articulo,
            nombre: producto.nombre,
            categoria: producto.categoria,
            unidad: unidadSeleccionada.unidad,
            factor: unidadSeleccionada.factor,
            precio: unidadSeleccionada.precio,
            descuento: unidadSeleccionada.descuento,
            cantidad: producto.cantidad,
            impuesto1: producto.impuesto1 || 0,
            impuesto2: producto.impuesto2 || 0,
            tipoImpuesto1: producto.tipoImpuesto1 || 0,
            tipoImpuesto2: producto.tipoImpuesto2 || 0
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
                    <header className="relative rounded-lg overflow-hidde flex justify-center">
                        {image ?
                            (<img
                                src={image ? image : "/logo.jpg"}
                                alt="Product Image"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />) :
                            (<IconLiz fill="#DBDBDB" width="300" />)}
                        <ul className="absolute w-[90%] mx-auto top-2 flex justify-between items-center">
                            <li className="flex flex-col gap-1">
                                {discountPercentage > 0 && (
                                    <div className="w-full text-center border-2 border-red-600 text-red-600  text-xs font-semibold px-2 py-1 rounded-md">
                                        -{discountPercentage}%
                                    </div>
                                )}
                                {isLowStock && (
                                    <div className="w-full text-center border-2 border-yellow-600 text-yellow-600 text-xs font-semibold px-2 py-1 rounded-md">
                                        Última(s) {formatearStock(unidadSeleccionada.cantidad, unidadSeleccionada.unidad, unidadSeleccionada.factor)}
                                    </div>
                                )}
                                {isOutOfStock && (
                                    <div className="w-full text-center border-2 border-gray-600 text-gray-600  text-xs font-semibold px-2 py-1 rounded-md">
                                        Agotado
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
                        <label className="font-bold">{producto.nombre}</label>

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
                            {unidadSeleccionada.descuento ? (
                                <>
                                    <span className="text-lg font-semibold text-purple-600">
                                        ${unidadSeleccionada.descuento.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-gray-500 line-through">
                                        ${unidadSeleccionada.precio.toFixed(2)}
                                    </span>
                                </>
                            ) : (
                                <span className="text-lg font-semibold text-purple-600">
                                    ${unidadSeleccionada.precio.toFixed(2)}
                                </span>
                            )}
                            <span className="text-sm text-gray-500 ml-2">
                                / {unidadSeleccionada.unidad}
                            </span>
                        </div>

                        {/* Detalles */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Barcode className="size-4 text-purple-600" />
                                <IonText color="medium">
                                    <span>Código: {producto.codigo}</span>
                                </IonText>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Hash className="size-4 text-purple-600" />
                                <IonText color="medium">
                                    <span>
                                        Stock: {formatearStock(unidadSeleccionada.cantidad, unidadSeleccionada.unidad, unidadSeleccionada.factor)}
                                        <label className="text-green-600 ml-2">{unidadSeleccionada.unidad}(s)</label>
                                        {unidadSeleccionada.factor > 1 && (
                                            <label className="text-gray-500 ml-2">
                                                (Contiene: {unidadSeleccionada.factor} pzs.)
                                            </label>
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

                    {/* Resto del código se mantiene igual */}
                    {/* Sección de Puntuación y Comentarios */}
                    <section className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <IonText>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <MessageCircle className="size-5" />
                                    Valoraciones ({sampleComments.length})
                                </h2>
                            </IonText>
                            <div className="flex items-center gap-2">
                                <div className="flex">
                                    {renderStars(averageRating)}
                                </div>
                                <IonText color="medium">
                                    <span className="text-sm">{averageRating.toFixed(1)}/5.0</span>
                                </IonText>
                            </div>
                        </div>

                        {/* Lista de comentarios */}
                        <div className="space-y-4">
                            {sampleComments.map((comment) => (
                                <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                    <div className="flex items-start gap-3">
                                        <IonAvatar className="w-8 h-8">
                                            <img src={comment.avatar} alt={comment.user} />
                                        </IonAvatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <IonText>
                                                    <span className="font-medium text-sm">{comment.user}</span>
                                                </IonText>
                                                <div className="flex items-center gap-1">
                                                    <div className="flex">
                                                        {renderStars(comment.rating)}
                                                    </div>
                                                    <IonText color="medium">
                                                        <span className="text-xs">{comment.date}</span>
                                                    </IonText>
                                                </div>
                                            </div>
                                            <IonText>
                                                <p className="text-sm text-gray-600 mb-2">{comment.comment}</p>
                                            </IonText>
                                            <div className="flex items-center gap-4">
                                                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600">
                                                    <ThumbsUp className="size-3" />
                                                    <span>Útil ({comment.likes})</span>
                                                </button>
                                                <button className="text-xs text-gray-500 hover:text-purple-600">
                                                    Responder
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Sección de Productos Recomendados */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <IonText>
                            <h2 className="text-lg font-semibold mb-4">Productos Recomendados</h2>
                        </IonText>

                        <IonGrid className="p-0">
                            <IonRow>
                                {recomendados.map((recommended: any) => (
                                    <IonCol size="6" key={recommended.id}>
                                        <div
                                            className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => {
                                                setrecomendadosselect(recommended);
                                            }}
                                        >
                                            <img
                                                src="/logo.jpg"
                                                alt={recommended.nombre}
                                                className="w-16 h-16 object-cover mx-auto mb-2 rounded"
                                            />
                                            <IonText>
                                                <p className="text-xs font-medium mb-1 line-clamp-2">{recommended.nombre}</p>
                                            </IonText>
                                            <span className="text-sm font-bold text-purple-800">${recommended.precio.toFixed(2)}</span>
                                        </div>
                                    </IonCol>
                                ))}
                            </IonRow>
                        </IonGrid>
                    </div>
                </article>
            </IonContent>

            {/* Footer con botón de añadir al carrito */}
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
                            id={productoActualizado.id} // Usar el ID único
                            cantidad={formatearStock(unidadSeleccionada.cantidad, unidadSeleccionada.unidad, unidadSeleccionada.factor)}
                            producto={productoActualizado} // Pasar el producto actualizado
                        />
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
}

export default ModalProd;