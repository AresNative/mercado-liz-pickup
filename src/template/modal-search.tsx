// modal-search.tsx
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonContent,
    IonText,
    IonButton,
    IonIcon,
    IonButtons
} from "@ionic/react";
import { close } from "ionicons/icons";
import { useState } from "react";
import SearchBar from "./search-bar";
import SearchResults from "./search-result";

interface ModalSearchProps {
    onDismiss: (data?: string, role?: string) => void;
}

const ModalSearch: React.FC<ModalSearchProps> = ({
    onDismiss
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        setShowResults(term.length > 0);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="bg-purple-600 text-white">
                    {/* Barra de búsqueda */}
                    <SearchBar
                        onSearchChange={handleSearchChange}
                    />
                </IonToolbar>
            </IonHeader>
            <IonButtons slot="start" className="absolute top-4 left-4 z-10">
                <IonButton
                    fill="clear"
                    color="light"
                    onClick={() => onDismiss(undefined, 'cancel')}
                >
                    <IonIcon icon={close} />
                </IonButton>
            </IonButtons>
            <IonContent>

                {/* Resultados de búsqueda */}
                <SearchResults
                    isVisible={true}
                    onClose={()=>setShowResults(false)}
                />

                {/* Mensaje cuando no hay búsqueda */}
                {!searchTerm && (
                    <div className="text-center py-8 px-2 text-gray-500">
                        <p>Ingresa un término de búsqueda para encontrar productos</p>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ModalSearch;