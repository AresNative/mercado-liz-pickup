import { IonPage, IonContent, IonButton, IonCol, IonGrid, IonRow, IonItem, IonLabel, IonRadio, IonRadioGroup, IonSegment, IonSegmentButton, IonSpinner } from "@ionic/react";
import { CloudDownload, ScanBarcode, ShieldAlert, ShieldCheck, Star, Truck } from "lucide-react";
import { useParams } from "react-router";
import HeaderCart from "../components/header";
import { Product } from "@/utils/data/example-data";
import { useEffect, useState } from "react";
import { useGetArticulosQuery } from "@/hooks/reducers/api";
import { mapApiProductToAppProduct } from "../utils/fromat-data";
import { useAppDispatch, useAppSelector } from "@/hooks/selector";
import { addToCart, removeFromCart } from "@/hooks/slices/cart";

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
    const cartItems = useAppSelector((state) => state.cart.items);
    const cartItem = cartItems.find((item) => item.id === id);
    const quantityInCart = cartItem?.quantity || 0;

    const [product, setProduct] = useState<Product | null>(null);
    const precio = useAppSelector((state) => state.app.sucursal.precio);
    const { data, isFetching, error } = useGetArticulosQuery({
        page: 1,
        filtro: id,
        listaPrecio: precio
    })

    useEffect(() => {
        if (data) {
            const mappedProducts = data.data.map(mapApiProductToAppProduct);
            setProduct(mappedProducts.find((item: Product) => item.id === id) || null);
        }
    }, [data, id]);


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
    if (!product) {
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


    const handleAddToCart = () => {
        dispatch(addToCart({ ...product, quantity: 1 }));
    };

    const increaseQuantity = () => {
        dispatch(addToCart({ ...product, quantity: 1 }));
    };

    const decreaseQuantity = () => {
        if (quantityInCart === 1) {
            dispatch(removeFromCart(product.id));
        } else {
            dispatch(addToCart({ ...product, quantity: -1 }));
        }
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuantity = Math.max(0, parseInt(e.target.value) || 0); // Forzar mínimo 0
        if (!isNaN(newQuantity)) {
            if (newQuantity <= 0) {
                dispatch(removeFromCart(product.id));
            } else {
                const delta = newQuantity - quantityInCart;
                dispatch(addToCart({ ...product, quantity: delta }));
            }
        }
    };
    return (
        <IonPage>
            <HeaderCart back />

            <IonContent className="ion-padding" fullscreen>
                <IonGrid>
                    <IonRow>
                        {product.image && (
                            <IonCol size="12" sizeMd="6">
                                <img
                                    src={product.image || "/placeholder.svg"} // Usar imagen del producto
                                    alt={product.nombre} // Alt dinámico
                                    className="w-full h-full bg-slate-100 rounded-lg"
                                />
                                {/* Mostrar descuento si existe */}
                                {product.descuento && (
                                    <div className="absolute top-2 left-2 bg-purple-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {product.descuento}% OFF
                                    </div>
                                )}
                            </IonCol>
                        )}

                        <IonCol>
                            <div>
                                <h1 style={{ margin: 0 }}>{product.nombre}</h1>
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
                                    {product.precioRegular ? (
                                        <>
                                            <h2 className="text-red-500">
                                                ${product.precio.toFixed(2)}
                                                <span className="text-gray-400 line-through ml-2">
                                                    ${product.precioRegular.toFixed(2)}
                                                </span>
                                            </h2>
                                        </>
                                    ) : (
                                        <h2>${product.precio.toFixed(2)}</h2>
                                    )}
                                </div>

                                <p style={{ color: '#666' }}>
                                    {/* Descripción (agregar campo si es necesario) */}
                                    {product.categoria}
                                </p>
                            </div>

                            {/* Resto del maquetado se mantiene igual */}
                            <ul className="items-center gap-2 w-full">
                                {product.unidad === "Caja" && (
                                    <li className="items-center">
                                        La caja contiene - {product.factor} pieza(s)
                                    </li>
                                )}
                                <li className="flex items-center gap-4">
                                    <span>Cantidad:</span>
                                    <div className="flex items-center gap-2">
                                        {quantityInCart === 0 ? (
                                            <>
                                                <IonButton
                                                    size="small"
                                                    onClick={decreaseQuantity}
                                                    className="custom-tertiary"
                                                    disabled={quantityInCart <= 1}
                                                >
                                                    -
                                                </IonButton>
                                                <span className="w-8 text-center">{quantityInCart}</span>
                                                <IonButton
                                                    size="small"
                                                    className="custom-tertiary"
                                                    onClick={increaseQuantity}
                                                >
                                                    +
                                                </IonButton>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <IonButton
                                                    size="small"
                                                    onClick={decreaseQuantity}
                                                    className="custom-tertiary"
                                                    disabled={quantityInCart <= 1}
                                                >
                                                    -
                                                </IonButton>
                                                <input
                                                    type="number"
                                                    className="text-sm w-10 text-center bg-white rounded-lg border p-1"
                                                    value={quantityInCart}
                                                    min="0"
                                                    onChange={handleQuantityChange}
                                                    onBlur={(e) => {
                                                        const value = parseInt(e.target.value);
                                                        if (isNaN(value) || value < 1) {
                                                            dispatch(removeFromCart(product.id));
                                                        }
                                                    }}
                                                />
                                                <IonButton
                                                    size="small"
                                                    className="custom-tertiary"
                                                    onClick={increaseQuantity}
                                                >
                                                    +
                                                </IonButton>
                                            </div>
                                        )}
                                    </div>
                                </li>
                                <li>
                                    <IonButton
                                        expand="block"
                                        className={quantityInCart === 0 ? "custom-tertiary" : "custom-danger"} // Añade clase diferente para eliminar
                                        onClick={
                                            quantityInCart === 0
                                                ? handleAddToCart
                                                : () => dispatch(removeFromCart(product.id)) // Elimina completamente el artículo
                                        }
                                    >
                                        {quantityInCart === 0
                                            ? "Añadir al Carrito"
                                            : "Eliminar del Carrito"}
                                    </IonButton>
                                </li>
                            </ul>

                            <IonGrid>
                                <IonRow className="gap-y-4 md:gap-y-0 p-2 md:p-0">
                                    <IonCol
                                        size="12"
                                        size-sm="4"
                                        className="flex items-center gap-2 md:gap-3 flex-grow"
                                    >
                                        <Truck className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                                        <span className="text-sm md:text-base whitespace-nowrap">Envío Gratis</span>
                                    </IonCol>

                                    <IonCol
                                        size="12"
                                        size-sm="4"
                                        className="flex items-center gap-2 md:gap-3 flex-grow"
                                    >
                                        <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                                        <span className="text-sm md:text-base whitespace-nowrap">Garantía de 1 Año</span>
                                    </IonCol>

                                    <IonCol
                                        size="12"
                                        size-sm="4"
                                        className="flex items-center gap-2 md:gap-3 flex-grow"
                                    >
                                        <CloudDownload className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                                        <span className="text-sm md:text-base whitespace-nowrap">Devoluciones Fáciles</span>
                                    </IonCol>
                                </IonRow>
                            </IonGrid>

                            <IonSegment value="details">
                                <IonSegmentButton value="details">
                                    <IonLabel>Detalles</IonLabel>
                                </IonSegmentButton>
                                <IonSegmentButton value="specifications">
                                    <IonLabel>Especificaciones</IonLabel>
                                </IonSegmentButton>
                                <IonSegmentButton value="reviews">
                                    <IonLabel>Reseñas</IonLabel>
                                </IonSegmentButton>
                            </IonSegment>

                            <ul className="mt-5">
                                <li className="flex items-center text-sm gap-1">
                                    <ScanBarcode className="h-4 w-4 fill-[#8B5CF6]" />
                                    Codigo de barras:
                                    <span className="text-[#8B5CF6]">{product.id}</span>
                                </li>
                            </ul>

                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};
export default ProductID;