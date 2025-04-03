import { IonPage, IonHeader, IonTitle, IonContent, IonButton, IonBackButton, IonButtons, IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonList, IonRadio, IonRadioGroup, IonRow, IonSegment, IonSegmentButton, IonText, IonToolbar } from "@ionic/react";
import { Star } from "lucide-react";
import { useParams } from "react-router";

const ProductID: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    if (!id) {
        return (
            <IonPage>
                <IonContent className="ion-text-center ion-padding">
                    <h1>Product Not Found</h1>
                    <IonButton routerLink="/products">Back to Products</IonButton>
                </IonContent>
            </IonPage>
        );
    }
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/products" />
                    </IonButtons>
                    <IonTitle>Wireless Bluetooth Headphones</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <IonGrid>
                    <IonRow>
                        <IonCol size="12" sizeMd="6">
                            <img
                                src="/placeholder.svg"
                                alt="Headphones"
                                style={{
                                    width: '100%',
                                    height: '400px',
                                    objectFit: 'cover',
                                    borderRadius: '8px'
                                }}
                            />
                        </IonCol>

                        <IonCol size="12" sizeMd="6">
                            <div style={{ margin: '16px 0' }}>
                                <IonText color="primary">
                                    <h1 style={{ margin: 0 }}>Wireless Bluetooth Headphones</h1>
                                </IonText>

                                <div style={{ margin: '8px 0' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            color="warning"
                                            style={{ marginRight: '2px' }}
                                        />
                                    ))}
                                    <IonText color="medium"> (2 reviews)</IonText>
                                </div>

                                <IonText color="dark">
                                    <h2 style={{ margin: '8px 0' }}>$99.99</h2>
                                </IonText>

                                <IonText>
                                    <p style={{ color: '#666' }}>
                                        High-quality sound with noise cancellation technology
                                    </p>
                                </IonText>
                            </div>

                            <div style={{ margin: '16px 0' }}>
                                <IonText><h3>Color</h3></IonText>
                                <IonRadioGroup value="black">
                                    <IonItem>
                                        <IonLabel>Black</IonLabel>
                                        <IonRadio value="black" />
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>White</IonLabel>
                                        <IonRadio value="white" />
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>Blue</IonLabel>
                                        <IonRadio value="blue" />
                                    </IonItem>
                                </IonRadioGroup>
                            </div>

                            <div style={{ margin: '16px 0' }}>
                                <IonText><h3>Quantity</h3></IonText>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <IonButton>-</IonButton>
                                    <span style={{ margin: '0 8px' }}>1</span>
                                    <IonButton>+</IonButton>
                                </div>
                            </div>

                            <IonButton expand="block" style={{ margin: '16px 0' }}>
                                Add to Cart
                            </IonButton>

                            <IonGrid style={{ margin: '16px 0' }}>
                                <IonRow>
                                    <IonCol>
                                        Free Shipping
                                    </IonCol>
                                    <IonCol>
                                        1 Year Warranty
                                    </IonCol>
                                    <IonCol>
                                        Easy Returns
                                    </IonCol>
                                </IonRow>
                            </IonGrid>

                            <IonSegment value="details">
                                <IonSegmentButton value="details">
                                    <IonLabel>Details</IonLabel>
                                </IonSegmentButton>
                                <IonSegmentButton value="specifications">
                                    <IonLabel>Specs</IonLabel>
                                </IonSegmentButton>
                                <IonSegmentButton value="reviews">
                                    <IonLabel>Reviews</IonLabel>
                                </IonSegmentButton>
                            </IonSegment>

                            <IonList style={{ marginTop: '16px' }}>
                                <IonItem>
                                    <IonText>Active Noise Cancellation</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonText>30-hour battery life</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonText>Comfortable over-ear design</IonText>
                                </IonItem>
                            </IonList>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};
export default ProductID;