import { IonPage, IonContent, IonButton, IonCol, IonGrid, IonRow, IonSegment, IonSegmentButton, IonSpinner } from "@ionic/react";
import { ScanBarcode, ShieldAlert, Star, Truck } from "lucide-react";
import { useParams } from "react-router";
import HeaderCart from "../components/header";
import { Product } from "@/utils/data/example-data";
import { useEffect, useState } from "react";
import { useGetArticulosQuery } from "@/hooks/reducers/api_int";
import { mapApiProductToAppProduct } from "../utils/fromat-data";
import { useAppDispatch, useAppSelector } from "@/hooks/selector";
import { addToCart, removeFromCart } from "@/hooks/slices/cart";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { cn } from "@/utils/functions/cn";

export const LoadingScreen = () => (
    <IonPage>
        <IonContent className="ion-padding" fullscreen>
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <IonSpinner
                        name="crescent"
                        className="h-12 w-12 text-purple-600"
                    />
                    <p className="mt-4 text-gray-600">Cargando pantalla...</p>
                </div>
            </div>
        </IonContent>
    </IonPage>
);

const ProductID: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((state: any) => state.cart.items);
    const precio = getLocalStorageItem("sucursal").precio ?? useAppSelector((state) => state.app.sucursal.precio);

    const { data, isFetching, error } = useGetArticulosQuery({
        page: 1,
        filtro: id,
        listaPrecio: precio
    })

    const [variants, setVariants] = useState<Product[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<Product | null>(null);
    const [localQuantity, setLocalQuantity] = useState(1);
    const [isInCart, setIsInCart] = useState(false);

    useEffect(() => {
        if (data) {
            const mappedProducts = data.data.map(mapApiProductToAppProduct);
            setVariants(mappedProducts);
            setSelectedVariant(mappedProducts[0] || null);
        }
    }, [data, id]);

    useEffect(() => {
        const inCart = cartItems.some((item: any) => item.id === selectedVariant?.id);
        setIsInCart(inCart);

        if (inCart) {
            const cartItem = cartItems.find((item: any) => item.id === selectedVariant?.id);
            setLocalQuantity(cartItem.quantity);
        } else {
            setLocalQuantity(1);
        }
    }, [cartItems, selectedVariant]);

    if (isFetching) {
        return <LoadingScreen />;
    }
    if (error) {
        return (
            <IonPage>
                <IonContent className="ion-padding" fullscreen>
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center text-red-500">
                            <ShieldAlert className="h-12 w-12 mx-auto" />
                            <p className="mt-4">Error cargando el producto</p>
                            <IonButton
                                onClick={() => window.location.reload()}
                                className="mt-4"
                            >
                                Reintentar
                            </IonButton>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }
    if (!selectedVariant) {
        return (
            <section className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white">404</h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Producto no encontrado</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Esta pagina no existe o el producto no esta disponible.</p>
                    <a href="/" className="mt-6 inline-block px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">Regresar.</a>
                </div>
            </section>
        );
    }

    const increaseLocalQuantity = () => {
        if (selectedVariant) {
            setLocalQuantity(prev => Math.min(prev + 1, selectedVariant.cantidad));
        }
    };

    const decreaseLocalQuantity = () => {
        setLocalQuantity(prev => Math.max(1, prev - 1));
    };

    const handleLocalQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
        if (selectedVariant) {
            setLocalQuantity(Math.min(newQuantity, selectedVariant.cantidad));
        } else {
            setLocalQuantity(newQuantity);
        }
    };

    const handleCartAction = () => {
        if (isInCart) {
            dispatch(removeFromCart(selectedVariant.id));
        } else {
            dispatch(addToCart({ ...selectedVariant, quantity: localQuantity }));
        }
    };

    const hasDiscount = selectedVariant.precioRegular && selectedVariant.descuento;
    const finalPrice = hasDiscount ? selectedVariant.precioRegular : selectedVariant.precio;
    const savings = hasDiscount ? (selectedVariant.precio - (selectedVariant.precioRegular || 0)).toFixed(2) : 0;

    return (
        <IonPage>
            <HeaderCart back />

            <IonContent className="ion-padding" fullscreen>
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                            {/* Sección de imagen */}
                            <div className="md:w-1/2 flex justify-center items-center p-6 bg-gray-50">
                                {selectedVariant.image && (
                                    <div className="relative w-full max-w-md">
                                        <div className="aspect-square w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                                            <img
                                                src={selectedVariant.image}
                                                alt={selectedVariant.nombre}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        {hasDiscount && (
                                            <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                                                -{selectedVariant.descuento}% OFF
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Sección de detalles */}
                            <div className="md:w-1/2 p-6 flex flex-col">
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedVariant.nombre}</h1>

                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center">
                                            {[...Array(3)].map((_, i) => (
                                                <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
                                            ))}
                                            {[...Array(2)].map((_, i) => (
                                                <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500">(2 reseñas)</span>
                                    </div>

                                    {/* Precios */}
                                    <div className="mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-2xl text-gray-900">
                                                ${finalPrice?.toFixed(2)}
                                            </span>
                                            {hasDiscount && (
                                                <span className="text-base text-gray-400 line-through">
                                                    ${selectedVariant.precio.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        {hasDiscount && (
                                            <span className="text-sm text-green-600 font-medium">
                                                Ahorras ${savings}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-gray-600 mb-6">
                                        {selectedVariant.categoria}
                                    </p>

                                    {/* Información adicional */}
                                    <div className="space-y-3 mb-6">
                                        {selectedVariant.unidad === "Caja" && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Truck className="h-4 w-4 text-gray-500" />
                                                <span>La caja contiene - {selectedVariant.factor} pieza(s)</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <ScanBarcode className="h-4 w-4 text-gray-500" />
                                            <span>Codigo de barras:</span>
                                            <span className="text-purple-600 font-medium">{selectedVariant.id}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <ScanBarcode className="h-4 w-4 text-gray-500" />
                                            <span>Pz disponible(s):</span>
                                            <span className="text-purple-600 font-medium">{selectedVariant.cantidad}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Controles y variantes */}
                                <div className="border-t border-gray-100 pt-4">
                                    {/* Selector de variantes */}
                                    {variants.length > 1 && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Selecciona una opción:</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {variants.map((variant) => (
                                                    <button
                                                        key={variant.id}
                                                        onClick={() => setSelectedVariant(variant)}
                                                        className={cn(
                                                            "border rounded-lg p-3 text-sm transition-colors",
                                                            selectedVariant?.id === variant.id
                                                                ? "border-purple-600 bg-purple-50 text-purple-700"
                                                                : "border-gray-200 hover:border-gray-300"
                                                        )}
                                                    >
                                                        <div className="font-medium">{variant.unidad}</div>
                                                        <div className="font-bold">${variant.precio.toFixed(2)}</div>
                                                        {variant.factor && variant.factor > 1 && (
                                                            <div className="text-xs text-gray-500">{variant.factor} piezas</div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Controles de cantidad */}
                                    {variants[0].cantidad > 0 ? (<div className="flex items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center">
                                            <span className="text-gray-700 mr-3">Cantidad:</span>
                                            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
                                                <button
                                                    onClick={decreaseLocalQuantity}
                                                    disabled={localQuantity <= 1}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors",
                                                        localQuantity <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
                                                    )}
                                                >
                                                    <span className="text-lg font-medium">−</span>
                                                </button>
                                                <input
                                                    type="number"
                                                    className="w-12 h-8 text-center text-sm font-medium bg-white border-none focus:outline-none rounded-md"
                                                    value={localQuantity}
                                                    min="1"
                                                    onChange={handleLocalQuantityChange}
                                                />
                                                <button
                                                    onClick={increaseLocalQuantity}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                                >
                                                    <span className="text-lg font-medium">+</span>
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            className={cn(
                                                "flex-1 rounded-xl font-medium p-3 text-white transition-colors",
                                                isInCart
                                                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                                    : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                                            )}
                                            onClick={handleCartAction}
                                        >
                                            {isInCart ? "Eliminar del Carrito" : "Añadir al Carrito"}
                                        </button>
                                    </div>) : ("No disponible")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};
export default ProductID;