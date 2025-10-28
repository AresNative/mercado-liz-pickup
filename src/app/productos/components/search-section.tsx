import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import { formatValue } from "@/utils/constants/format-values";
import { cn } from "@/utils/functions/cn";
import { Producto } from "@/utils/types/page";
import { IonItem, IonLabel, IonNote, IonSearchbar } from "@ionic/react";
import { useEffect, useRef, useState } from "react";

// Tipo para la respuesta de la API
interface ApiResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

interface SearchSectionProps {
    mobileScreen?: boolean;
    isScrolled?: boolean;
    onScroll?: (isScrolled: boolean) => void;
    onSearchSelect?: (producto: Producto) => void;
    onSearchChange?: (searchTerm: string) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
    mobileScreen,
    isScrolled,
    onSearchSelect,
    onSearchChange
}) => {
    const [getData] = useGetWithFiltersGeneralInIntelisisMutation();
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Estados para la búsqueda
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<Producto[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Manejar cambio en el término de búsqueda
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        onSearchChange?.(value);

        if (value.trim() === "") {
            setShowSuggestions(false);
            setSuggestions([]);
        }
    };

    // Limpiar búsqueda
    const handleClearSearch = () => {
        setSearchTerm("");
        setShowSuggestions(false);
        setSuggestions([]);
        onSearchChange?.("");
    };

    // Manejar clic en una sugerencia
    const handleSuggestionClick = (suggestion: Producto) => {
        setSearchTerm(suggestion.nombre);
        setShowSuggestions(false);
        onSearchSelect?.(suggestion);
    };

    // Manejar foco en el searchbar
    const handleSearchFocus = () => {
        if (searchTerm.trim() && suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    // Efecto para búsqueda con debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchTerm.trim() === "") {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        setShowSuggestions(true);

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                // Buscar sugerencias
                const result = await getData({
                    table: `
                    CB AS cb
                        INNER JOIN Art AS art
                            ON cb.Cuenta = art.Articulo
                        INNER JOIN ListaPreciosDUnidad AS lpu
                            ON art.Articulo = lpu.Articulo
                            AND cb.Unidad = lpu.Unidad
                            AND lpu.Lista = '(Precio Lista)'
                        INNER JOIN ArtUnidad AS au
                            ON art.Articulo = au.Articulo
                            AND lpu.Unidad = au.Unidad
                        INNER JOIN ArtDisponible AS ad On Almacen = 'ALMMAYO' and art.Articulo = ad.Articulo
                        LEFT JOIN Oferta AS ofr On ofr.Articulo = art.Articulo and ofr.FechaD < GETDATE() and ofr.FechaA > GETDATE() 
                        LEFT JOIN OfertaD AS ofrd On ofrd.Articulo = art.Articulo and ofrd.Unidad = cb.Unidad
                    `,
                    pageSize: 5,
                    page: 1,
                    filtros: {
                        "Filtros": [
                            {
                                "key": "art.Descripcion1",
                                "value": searchTerm,
                                "operator": "like"
                            }
                        ],
                        "Selects": [
                            { "key": "cb.Codigo" },
                            { "key": "cb.Cuenta" },
                            { "key": "art.Grupo" },
                            { "key": "art.Descripcion1" },
                            { "key": "lpu.Unidad" },
                            { "key": "lpu.Precio" },
                            { "key": "ofrd.Precio", "alias": "Descuento" },
                            { "key": "au.Unidad", "alias": "UnidadFactor" },
                            { "key": "au.Factor" }
                        ],
                        "Agregaciones": [
                            {
                                "Key": "ad.DispMenosApartado",
                                "Operation": "SUM",
                                "Alias": "Cantidad"
                            }
                        ],
                        "Order": [
                            {
                                "Key": "art.Descripcion1",
                                "Direction": "ASC"
                            }
                        ]
                    },
                    signal: undefined,
                });

                if ('data' in result && result.data) {
                    const apiData = result.data as ApiResponse;
                    const suggestedItems: Producto[] = apiData.data.map((item: any) => ({
                        id: item.Codigo || `item-${Date.now()}-${Math.random()}`,
                        nombre: item.Descripcion1 || "Sin nombre",
                        categoria: item.Grupo || "Sin categoría",
                        unidad: item.Unidad || "Unidad",
                        precio: item.Precio || 0,
                        cantidad: item.Factor || 1,
                        descuento: item.Descuento || 0,
                    }));
                    setSuggestions(suggestedItems);
                }
            } catch (error) {
                console.error("❌ Error fetching suggestions:", error);
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 300); // Debounce de 300ms

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, getData]);

    // Ocultar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.search-section')) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // No renderizar si es mobile y no hay scroll
    if (mobileScreen) {
        return null;
    }

    return (
        <>
            <section className="search-section relative z-50 w-full">
                <div className="w-[70%] mt-4 mx-auto relative">
                    <IonSearchbar
                        className={cn("w-full", isScrolled && "custom-search-barr ")}
                        color={"light"}
                        value={searchTerm}
                        onIonInput={(e) => handleSearchChange(e.detail.value!)}
                        onIonClear={handleClearSearch}
                        onIonFocus={handleSearchFocus}
                        placeholder="Buscar productos..."
                        enterkeyhint="search"
                    />


                </div>
            </section>
            {/* Panel de sugerencias */}
            {showSuggestions && (
                <div className="sticky inset-0 top-2 w-[70%]  mx-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {isSearching ? (
                        <IonItem>
                            <IonLabel>
                                <IonNote>Buscando...</IonNote>
                            </IonLabel>
                        </IonItem>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((suggestion) => (
                            <IonItem
                                key={suggestion.id}
                                button
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="cursor-pointer hover:bg-gray-50"
                                detail={false}
                            >
                                <IonLabel className="px-4">
                                    <h3 className="font-medium text-sm">{suggestion.nombre}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{suggestion.categoria}</p>
                                </IonLabel>
                                <IonNote slot="end" className="text-xs">
                                    {formatValue(suggestion.precio, "currency")}
                                </IonNote>
                            </IonItem>
                        ))
                    ) : searchTerm.trim() ? (
                        <IonItem>
                            <IonLabel>
                                <IonNote className="text-sm">No se encontraron sugerencias</IonNote>
                            </IonLabel>
                        </IonItem>
                    ) : null}
                </div>
            )}
        </>
    );
}

export default SearchSection;