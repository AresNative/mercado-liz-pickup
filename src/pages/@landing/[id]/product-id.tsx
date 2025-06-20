import { IonPage, IonContent, IonButton, IonCol, IonGrid, IonRow, IonItem, IonLabel, IonRadio, IonRadioGroup, IonSegment, IonSegmentButton, IonSpinner } from "@ionic/react";
import { ScanBarcode, ShieldAlert, ShieldCheck, Star, Truck } from "lucide-react";
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
    const [localQuantity, setLocalQuantity] = useState(1); // Estado local para cantidad
    const [isInCart, setIsInCart] = useState(false); // Estado para rastrear si el producto está en el carrito

    // Modificar useEffect para cargar todas las variantes
    useEffect(() => {
        if (data) {
            const mappedProducts = data.data.map(mapApiProductToAppProduct);
            setVariants(mappedProducts);
            setSelectedVariant(mappedProducts[0] || null);
        }
    }, [data, id]);

    // Actualizar estado local cuando cambia el carrito o la variante
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

    // Mostrar pantalla de carga mientras se obtienen datos
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

    // Controladores para modificar la cantidad local
    const increaseLocalQuantity = () => {
        setLocalQuantity(prev => prev + 1);
    };

    const decreaseLocalQuantity = () => {
        setLocalQuantity(prev => Math.max(1, prev - 1));
    };

    const handleLocalQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
        setLocalQuantity(newQuantity);
    };

    // Acción al presionar el botón principal
    const handleCartAction = () => {
        if (isInCart) {
            dispatch(removeFromCart(selectedVariant.id));
        } else {
            dispatch(addToCart({ ...selectedVariant, quantity: localQuantity }));
        }
    };

    return (
        <IonPage>
            <HeaderCart back />

            <IonContent className="ion-padding" fullscreen>
                <IonGrid>
                    <IonRow>
                        {selectedVariant.image && (
                            <IonCol size="12" sizeMd="6">
                                <img
                                    src={selectedVariant.image || "/placeholder.svg"} // Usar imagen del selectedVarianto
                                    alt={selectedVariant.nombre} // Alt dinámico
                                    className="w-full h-full bg-slate-100 rounded-lg"
                                />
                                {/* Mostrar descuento si existe */}
                                {selectedVariant.descuento && (
                                    <div className="absolute top-2 left-2 bg-purple-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {selectedVariant.descuento}% OFF
                                    </div>
                                )}
                            </IonCol>
                        )}

                        <IonCol>
                            <div>
                                <h1 style={{ margin: 0 }}>{selectedVariant.nombre}</h1>
                                <div className="flex items-center gap-2">
                                    {/* Sección de reviews (mantenemos estática ya que no está en la interfaz) */}
                                    {[...Array(3)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                                    ))}
                                    {[...Array(2)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                                    ))}
                                    (2 reseñas)
                                </div>

                                {/* Precio con descuento si aplica */}
                                <div>
                                    {selectedVariant.precioRegular ? (
                                        <>
                                            <h2 className="text-red-500">
                                                ${selectedVariant.precioRegular.toFixed(2)}
                                                <span className="text-gray-400 line-through ml-2">
                                                    ${selectedVariant.precio.toFixed(2)}
                                                </span>
                                            </h2>
                                        </>
                                    ) : (
                                        <h2>${selectedVariant.precio.toFixed(2)}</h2>
                                    )}
                                </div>

                                <p style={{ color: '#666' }}>
                                    {/* Descripción (agregar campo si es necesario) */}
                                    {selectedVariant.categoria}
                                </p>
                            </div>
                            <nav className={cn(!selectedVariant.image && "md:flex")}>
                                <ul className="items-center gap-2 w-full">
                                    {selectedVariant.unidad === "Caja" && (
                                        <li className="items-center">
                                            La caja contiene - {selectedVariant.factor} pieza(s)
                                        </li>
                                    )}
                                    <li className="flex items-center gap-4">
                                        <span>Cantidad:</span>
                                        <div className="flex items-center gap-2">
                                            <IonButton
                                                size="small"
                                                onClick={decreaseLocalQuantity}
                                                className="custom-tertiary"
                                                disabled={localQuantity <= 1}
                                            >
                                                -
                                            </IonButton>
                                            <input
                                                type="number"
                                                className="text-sm w-10 text-center bg-white rounded-lg border p-1"
                                                value={localQuantity}
                                                min="1"
                                                onChange={handleLocalQuantityChange}
                                            />
                                            <IonButton
                                                size="small"
                                                className="custom-tertiary"
                                                onClick={increaseLocalQuantity}
                                            >
                                                +
                                            </IonButton>
                                        </div>

                                    </li>
                                    <li className="flex items-center text-sm gap-1">
                                        <ScanBarcode className="h-4 w-4 fill-[#8B5CF6]" />
                                        Codigo de barras:
                                        <span className="text-[#8B5CF6]">{selectedVariant.id}</span>
                                    </li>
                                </ul>
                                <ul className={cn(!selectedVariant.image && "md:-mt-20", "items-center gap-2 w-full")}>
                                    <li>
                                        {variants.length > 1 && (
                                            <IonSegment
                                                value={selectedVariant?.id}
                                                onIonChange={(e) => {
                                                    const selected = variants.find(v => v.id === e.detail.value);
                                                    setSelectedVariant(selected || null);
                                                }}
                                                className="my-4"
                                            >
                                                {variants.map((variant) => (
                                                    <IonSegmentButton
                                                        key={variant.id}
                                                        value={variant.id}
                                                        className="text-sm"
                                                    >
                                                        <IonLabel>
                                                            {variant.unidad} - ${variant.precio.toFixed(2)}
                                                            {variant.factor && variant.factor > 1 && ` (${variant.factor} pzs)`}
                                                        </IonLabel>
                                                    </IonSegmentButton>
                                                ))}
                                            </IonSegment>
                                        )}
                                        <IonButton
                                            expand="block"
                                            className={isInCart ? "custom-danger" : "custom-tertiary"}
                                            onClick={handleCartAction}
                                        >
                                            {isInCart ? "Eliminar del Carrito" : "Añadir al Carrito"}
                                        </IonButton>
                                    </li>
                                </ul>
                            </nav>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};
export default ProductID;