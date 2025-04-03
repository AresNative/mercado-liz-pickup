import { IonPage, IonContent, IonButton, IonCol, IonGrid, IonRow, IonItem, IonLabel, IonRadio, IonRadioGroup, IonSegment, IonSegmentButton } from "@ionic/react";
import { CloudDownload, ShieldCheck, Star, Truck } from "lucide-react";
import { useParams } from "react-router";
import HeaderCart from "../components/header";
import { Product, sampleProducts } from "@/utils/data/example-data";
import { useEffect, useState } from "react";

const ProductID: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product>();

    useEffect(() => {
        const fetchProduct = async () => {
            const data: Product | undefined = sampleProducts.find((p) => p.id === id) //await getProductById(id); // Tu función de fetching
            setProduct(sampleProducts.find((p) => p.id === id) || data); // Simulación de búsqueda por ID
        };

        if (id) fetchProduct();
    }, [id]);

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

    return (
        <IonPage>
            <HeaderCart back />

            <IonContent className="ion-padding" fullscreen>
                <IonGrid>
                    <IonRow>
                        <IonCol size="12" sizeMd="6">
                            <img
                                src={product.image || "/placeholder.svg"} // Usar imagen del producto
                                alt={product.title} // Alt dinámico
                                className="w-full h-full bg-slate-100 rounded-lg"
                            />
                            {/* Mostrar descuento si existe */}
                            {product.discount && (
                                <div className="absolute top-2 left-2 bg-purple-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {product.discount}% OFF
                                </div>
                            )}
                        </IonCol>

                        <IonCol size="12" sizeMd="6">
                            <div>
                                <h1 style={{ margin: 0 }}>{product.title}</h1>
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
                                    {product.originalPrice ? (
                                        <>
                                            <h2 className="text-red-500">
                                                ${product.price.toFixed(2)}
                                                <span className="text-gray-400 line-through ml-2">
                                                    ${product.originalPrice.toFixed(2)}
                                                </span>
                                            </h2>
                                        </>
                                    ) : (
                                        <h2>${product.price.toFixed(2)}</h2>
                                    )}
                                </div>

                                <p style={{ color: '#666' }}>
                                    {/* Descripción (agregar campo si es necesario) */}
                                    {product.category}
                                </p>
                            </div>

                            {/* Resto del maquetado se mantiene igual */}
                            <ul className="items-center gap-2 w-full">
                                <li>
                                    <IonRadioGroup value="black">
                                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                                            <div className="flex flex-1 justify-around w-full md:w-auto">
                                                <IonItem lines="none" className="w-full md:w-auto">
                                                    <div className="flex items-center gap-1">
                                                        <IonRadio slot="end" value="black">
                                                            <IonLabel>Caja</IonLabel>
                                                        </IonRadio>
                                                    </div>
                                                </IonItem>

                                                <IonItem lines="none" className="w-full md:w-auto">
                                                    <div className="flex items-center gap-1">
                                                        <IonRadio slot="end" value="white">
                                                            <IonLabel>Pieza/Kg</IonLabel>
                                                        </IonRadio>
                                                    </div>
                                                </IonItem>
                                            </div>
                                        </div>
                                    </IonRadioGroup>
                                </li>
                                <li className="flex items-center gap-2 m-auto">
                                    <span>Cantidad:</span>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <IonButton size="small" className="custom-tertiary">-</IonButton>
                                        <span style={{ margin: '0 8px' }}>1</span>
                                        <IonButton size="small" className="custom-tertiary">+</IonButton>
                                    </div>
                                </li>
                            </ul>

                            <IonButton expand="block" className="custom-tertiary">
                                Añadir al Carrito
                            </IonButton>

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

                            <ul className="list-disc list-inside mt-5">
                                <li>
                                    Cancelación Activa de Ruido
                                </li>
                                <li>
                                    Batería de 30 horas de duración
                                </li>
                                <li>
                                    Diseño sobre la oreja cómodo
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