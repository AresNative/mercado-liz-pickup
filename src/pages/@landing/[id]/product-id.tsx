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
            <IonPage>
                <IonContent className="ion-text-center ion-padding">
                    <h1>Producto no encontrado</h1>
                    <IonButton routerLink="/products">Volver a Productos</IonButton>
                </IonContent>
            </IonPage>
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
                                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded">
                                    -{product.discount}%
                                </div>
                            )}
                        </IonCol>

                        <IonCol size="12" sizeMd="6">
                            <div style={{ margin: '16px 0' }}>
                                <h1 style={{ margin: 0 }}>{product.title}</h1>

                                <div className="flex items-center gap-2" style={{ margin: '8px 0' }}>
                                    {/* Sección de reviews (mantenemos estática ya que no está en la interfaz) */}
                                    {[...Array(3)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
                                    ))}
                                    {[...Array(2)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                                    ))}
                                    (2 reseñas)
                                </div>

                                {/* Precio con descuento si aplica */}
                                <div style={{ margin: '8px 0' }}>
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
                            <ul className="items-center gap-2 w-full" style={{ margin: '16px 0' }}>
                                <li>
                                    <IonRadioGroup value="black">
                                        <div className="flex flex-row items-center gap-2">
                                            <span>Comprar por:</span>
                                            <IonItem lines="none" style={{ width: "auto" }}>
                                                <IonRadio slot="end" value="black">
                                                    <IonLabel>Caja</IonLabel>
                                                </IonRadio>
                                            </IonItem>
                                            <IonItem lines="none" style={{ width: "auto" }}>
                                                <IonRadio slot="end" value="white">
                                                    <IonLabel>Pieza/Kg</IonLabel>
                                                </IonRadio>
                                            </IonItem>
                                        </div>
                                    </IonRadioGroup>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span>Cantidad:</span>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <IonButton size="small" color={"tertiary"}>-</IonButton>
                                        <span style={{ margin: '0 8px' }}>1</span>
                                        <IonButton size="small" color={"tertiary"}>+</IonButton>
                                    </div>
                                </li>
                            </ul>

                            <IonButton expand="block" color={"tertiary"} style={{ margin: '16px 0' }}>
                                Añadir al Carrito
                            </IonButton>

                            <IonGrid style={{ margin: '16px 0' }}>
                                <IonRow>
                                    <IonCol className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" /> Envío Gratis
                                    </IonCol>
                                    <IonCol className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" /> Garantía de 1 Año
                                    </IonCol>
                                    <IonCol className="flex items-center gap-2">
                                        <CloudDownload className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" /> Devoluciones Fáciles
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