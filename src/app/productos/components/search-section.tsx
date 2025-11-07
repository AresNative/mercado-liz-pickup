import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import { formatValue } from "@/utils/constants/format-values";
import { cn } from "@/utils/functions/cn";
import { Producto } from "@/utils/types/page";
import { IonItem, IonLabel, IonNote, IonSearchbar } from "@ionic/react";
import { useCallback, useEffect, useRef, useState } from "react";

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

    // Paginación / infinite scroll
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const suggestionsRef = useRef<HTMLDivElement | null>(null);

    // Construir objetos Producto desde item API
    const mapApiItemToProducto = (item: any): Producto => ({
        id: item.Codigo || `item-${Date.now()}-${Math.random()}`,
        nombre: item.Descripcion1 || "Sin nombre",
        categoria: item.Grupo || "Sin categoría",
        unidad: item.Unidad || "Unidad",
        precio: item.Precio || 0,
        cantidad: item.Cantidad || 1,
        factor: item.Factor || 1,
        descuento: item.Descuento || 0,
    });

    const fetchPage = useCallback(async (pageToFetch: number, append = false) => {
        try {
            if (!searchTerm.trim()) return;
            if (!append) {
                setIsSearching(true);
            } else {
                setIsLoadingMore(true);
            }

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
                        INNER JOIN (
                                    SELECT *,
                                        ROW_NUMBER() OVER (PARTITION BY Articulo, Unidad ORDER BY id DESC) AS rn
                                    FROM OfertaD
                                ) AS ofrd On ofrd.Articulo = art.Articulo and ofrd.Unidad = cb.Unidad AND ofrd.rn = 1
                        LEFT JOIN Oferta AS ofr On ofr.Articulo = art.Articulo and ofr.FechaD < GETDATE() and ofr.FechaA > GETDATE()
                    `,
                pageSize: 5,
                page: pageToFetch,
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
                const newItems = apiData.data.map(mapApiItemToProducto);
                setTotalPages(apiData.totalPages || 1);
                setPage(apiData.page || pageToFetch);

                if (append) {
                    setSuggestions(prev => [...prev, ...newItems]);
                } else {
                    setSuggestions(newItems);
                    setShowSuggestions(true);
                }
            }
        } catch (error) {
            console.error("❌ Error fetching suggestions:", error);
            if (!append) setSuggestions([]);
        } finally {
            setIsSearching(false);
            setIsLoadingMore(false);
        }
    }, [getData, searchTerm]);

    // Manejar cambio en el término de búsqueda
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        onSearchChange?.(value);

        // reset pagination on new search input
        setPage(1);
        setTotalPages(1);
        setIsLoadingMore(false);

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
        setPage(1);
        setTotalPages(1);
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

    // Efecto para búsqueda con debounce (pagina 1)
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
            await fetchPage(1, false);
        }, 300); // Debounce de 300ms

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, fetchPage]);

    // Manejar scroll en el panel de sugerencias para infinite scroll
    const handleSuggestionsScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
        const target = e.currentTarget;
        const threshold = 120; // px desde el bottom para disparar la carga
        if (
            target.scrollHeight - target.scrollTop - target.clientHeight <= threshold &&
            !isSearching &&
            !isLoadingMore &&
            page < totalPages
        ) {
            // cargar siguiente página
            const nextPage = page + 1;
            fetchPage(nextPage, true);
        }
    };

    // Ocultar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.search-section') && !target.closest('.suggestions-panel')) {
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
            <section className="relative w-[76%] mx-auto">
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
            </section>
            {/* Panel de sugerencias */}
            {showSuggestions && (
                <div
                    ref={suggestionsRef}
                    onScroll={handleSuggestionsScroll}
                    className="suggestions-panel relative w-[70%] mx-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                    {isSearching && suggestions.length === 0 ? (
                        <IonItem>
                            <IonLabel>
                                <IonNote>Buscando...</IonNote>
                            </IonLabel>
                        </IonItem>
                    ) : suggestions.length > 0 ? (
                        <>
                            {suggestions.map((suggestion) => (
                                <IonItem
                                    key={suggestion.id}
                                    button
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="cursor-pointer hover:bg-gray-50"
                                    detail={false}
                                >
                                    <IonLabel className="px-4">
                                        <h3 className="font-medium text-sm">{suggestion.nombre}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{suggestion.categoria} | {suggestion.unidad} de {suggestion.factor} Pieza(s)</p>
                                    </IonLabel>
                                    <IonNote slot="end" className="text-xs">
                                        {formatValue(suggestion.precio, "currency")}
                                    </IonNote>
                                </IonItem>
                            ))}
                            {isLoadingMore && (
                                <IonItem>
                                    <IonLabel>
                                        <IonNote>Cargando más...</IonNote>
                                    </IonLabel>
                                </IonItem>
                            )}
                        </>
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