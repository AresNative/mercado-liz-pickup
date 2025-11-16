import { Producto } from "@/utils/types/page";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonImg,
    IonText,
    IonBadge,
    IonIcon,
    IonFooter,
    IonAvatar,
    IonChip,
    IonRow,
    IonCol,
    IonGrid
} from "@ionic/react";
import { useIonRouter } from "@ionic/react";
import { heart, barcode, close, cart, star, starHalf, starOutline, arrowBack } from "ionicons/icons";
import { Barcode, ChartColumnStackedIcon, Hash, Heart, MessageCircle, ThumbsUp } from "lucide-react";
import AddToCartButton from "./product-add-cart";
import { cn } from "@/utils/functions/cn";
import { IconLiz } from "./ionc-liz";
import { useMemo } from "react";

interface ProductModalProps {
    producto: Producto;
    image: string;
    handleFavoriteToggle: (e: React.MouseEvent) => void;
    isFavorite: boolean;
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

// Datos de ejemplo para productos recomendados
const recommendedProducts: Producto[] = [
    {
        id: "REC001",
        nombre: "Producto Recomendado 1",
        precio: 25.99,
        precioRegular: 29.99,
        descuento: 15,
        cantidad: 15,
        unidad: "unidad",
        categoria: "Electrónicos"
    },
    {
        id: "REC002",
        nombre: "Producto Recomendado 2",
        precio: 45.50,
        precioRegular: 45.50,
        descuento: 0,
        cantidad: 8,
        unidad: "unidad",
        categoria: "Hogar"
    },
    {
        id: "REC003",
        nombre: "Producto Recomendado 3",
        precio: 12.75,
        precioRegular: 15.99,
        descuento: 20,
        cantidad: 20,
        unidad: "unidad",
        categoria: "Oficina"
    }
];

const ModalProd: React.FC<ProductModalProps> = ({ producto, image, handleFavoriteToggle, isFavorite }) => {
    const router = useIonRouter();
    const isLowStock = producto.cantidad > 0 && producto.cantidad <= 10;
    const isOutOfStock = producto.cantidad <= 0;

    // Price calculations
    const { discountPercentage } = useMemo(() => {
        const percentage = producto.descuento
            ? ((producto.precio - producto.descuento) / producto.precio) * 100
            : 0;
        let roundedDiscount = Math.round(percentage);
        return { discountPercentage: roundedDiscount };
    }, [producto.precio, producto.precioRegular, producto.descuento]);

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

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="bg-purple-600 text-white" />
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
                            (<IconLiz fill="#DBDBDB" />)}
                        <ul className="absolute w-[90%] mx-auto top-2 flex justify-between items-center">
                            <li className="flex flex-col gap-1">
                                {discountPercentage > 0 && (
                                    <div className="w-full text-center border-2 border-red-600 text-red-600  text-xs font-semibold px-2 py-1 rounded-md">
                                        -{discountPercentage}%
                                    </div>
                                )}
                                {isLowStock && (
                                    <div className="w-full text-center border-2 border-yellow-600 text-yellow-600 text-xs font-semibold px-2 py-1 rounded-md">
                                        Última(s) {producto.cantidad}
                                    </div>
                                )}
                                {isOutOfStock && (
                                    <div className="w-full text-center border-2 border-gray-600 text-gray-600  text-xs font-semibold px-2 py-1 rounded-md">
                                        Agotado
                                    </div>
                                )}
                            </li>
                            <button
                                onClick={handleFavoriteToggle}
                                className="top-2 right-10 p-1.5 bg-white/80 rounded-full backdrop-blur-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                            >
                                <Heart
                                    className={cn(
                                        "w-6 h-6 transition-colors",
                                        isFavorite
                                            ? "fill-red-400 text-red-500"
                                            : "text-gray-400 hover:text-red-400"
                                    )}
                                />
                            </button>
                        </ul>
                    </header>
                    {/* Información básica del producto */}
                    <section className="space-y-3">
                        <label className="font-bold">{producto.nombre}</label>
                        {/* Precio */}
                        <div className="flex items-center gap-2">
                            {producto.descuento ? (
                                <>
                                    <span className="text-lg font-semibold text-purple-600">
                                        ${producto.descuento.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-gray-500 line-through">
                                        ${producto.precio.toFixed(2)}
                                    </span>
                                </>
                            ) : (
                                <span className="text-lg font-semibold text-purple-600">
                                    ${producto.precio.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* Detalles */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Barcode className="size-4 text-purple-600" />
                                <IonText color="medium">
                                    <span>Código: {producto.id}</span>
                                </IonText>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Hash className="size-4 text-purple-600" />
                                <IonText color="medium">
                                    <span>Stock: {(/kilo|kg/i).test(producto.unidad)
                                        ? (producto.unidad !== 'Pieza' ? (producto.factor ? (producto.cantidad / producto.factor) : producto.cantidad) : producto.cantidad)
                                        : (producto.unidad !== 'Pieza' ? (producto.factor ? Math.trunc(producto.cantidad / producto.factor) : Math.trunc(producto.cantidad)) : Math.trunc(producto.cantidad))}
                                        <label className="text-green-600 ml-2">{producto.unidad}(s)</label>
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
                                {recommendedProducts.map((recommended) => (
                                    <IonCol size="6" key={recommended.id}>
                                        <div
                                            className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => router.push(`/product/${recommended.id}`)}
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
                        <strong className="text-gray-500">Agregar a carrito</strong>
                        <AddToCartButton id={producto.id} cantidad={producto.cantidad} producto={producto} />
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
}

export default ModalProd;