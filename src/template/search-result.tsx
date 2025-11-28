// search-results.tsx
import ModalProd from "@/app/productos/components/modal-product";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import { useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import { formatValue } from "@/utils/constants/format-values";
import { Producto } from "@/utils/types/page";
import { IonItem, IonLabel, IonNote, useIonModal } from "@ionic/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchResultsProps {
    isVisible?: boolean;
    onClose?: () => void;
}

interface ApiResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

const SearchResults: React.FC<SearchResultsProps> = ({
    isVisible = false,
    onClose
}) => {
    const [getData] = useGetWithFiltersGeneralInIntelisisMutation();
    const searchTerm = useAppSelector((state: RootState) => state.filterData.search?.value || "");
    const [producto, setproducto] = useState<Producto>({} as Producto);
    // Estados para los resultados
    const [suggestions, setSuggestions] = useState<Producto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Paginación
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const resultsRef = useRef<HTMLDivElement | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Construir objetos Producto desde item API
    const mapApiItemToProducto = (item: any): Producto => ({
        id: item.Codigo + "-" + item.Unidad,
        codigo: item.Codigo || "0000",
        articulo: item.Articulo || "Cuenta",
        nombre: item.Descripcion1 || "Sin nombre",
        categoria: item.Grupo || "Sin categoría",
        unidad: item.Unidad || "Unidad",
        precio: item.Precio || 0,
        cantidad: item.Cantidad || 1,
        factor: item.Factor || 1,
        impuesto1: item.Impuesto1 || 0,
        impuesto2: item.Impuesto2 || 0,
        tipoImpuesto1: item.TipoImpuesto1 || 0,
        tipoImpuesto2: item.TipoImpuesto2 || 0,
        descuento: item.Descuento || 0,
    });

    const fetchPage = useCallback(async (pageToFetch: number, append = false) => {
        try {
            if (!searchTerm.trim()) {
                setSuggestions([]);
                return;
            }

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
                        AND lpu.Precio > 0
                   INNER JOIN ArtUnidad AS au
                        ON art.Articulo = au.Articulo
                        AND lpu.Unidad = au.Unidad
                    INNER JOIN ArtDisponible AS ad On Almacen = 'ALMMAYO' AND art.Articulo = ad.Articulo AND ad.DispMenosApartado > 0
                    LEFT JOIN (
                                    SELECT *,
                                        ROW_NUMBER() OVER (PARTITION BY Articulo, Unidad ORDER BY id DESC) AS rn
                                    FROM OfertaD
                                ) AS ofrd On ofrd.Articulo = art.Articulo AND ofrd.Unidad = cb.Unidad AND ofrd.rn = 1
                    LEFT JOIN Oferta AS ofr On ofr.Articulo = art.Articulo AND ofr.FechaD < GETDATE() AND ofr.FechaA > GETDATE()

                    WHERE (art.Descripcion1 LIKE '%${searchTerm}%' OR cb.Codigo LIKE '%${searchTerm}%')
                    `,
                pageSize: 5,
                page: pageToFetch,
                filtros: {
                    "Filtros": [],
                    "Selects": [
                        { "key": "cb.Codigo" },
                        { "key": "art.Articulo" },
                        { "key": "art.Grupo" },
                        { "key": "art.Descripcion1" },
                        { "key": "art.Impuesto1" },
                        { "key": "art.Impuesto2" },
                        { "key": "art.TipoImpuesto1" },
                        { "key": "art.TipoImpuesto2" },
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
                }
            }
        } catch (error) {
            console.error("❌ Error fetching search results:", error);
            if (!append) setSuggestions([]);
        } finally {
            setIsSearching(false);
            setIsLoadingMore(false);
        }
    }, [getData, searchTerm]);
    // Corrección: pasar las opciones del modal al presentarlo
    const [present, dismiss] = useIonModal(ModalProd, {
        producto,
        onDismiss: () => dismiss(),
    });

    const handleCardClick = (productoSelected: any) => {
        setproducto(productoSelected);
        present({
            initialBreakpoint: 0.95,
            breakpoints: [0, 0.5, 0.95],
        });
    };
    // Efecto para búsqueda con debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchTerm.trim() === "") {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);

        searchTimeoutRef.current = setTimeout(async () => {
            await fetchPage(1, false);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, fetchPage]);

    // Manejar scroll para infinite scroll
    const handleResultsScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
        const target = e.currentTarget;
        const threshold = 120;
        if (
            target.scrollHeight - target.scrollTop - target.clientHeight <= threshold &&
            !isSearching &&
            !isLoadingMore &&
            page < totalPages
        ) {
            const nextPage = page + 1;
            fetchPage(nextPage, true);
        }
    };
    // Ocultar resultados al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.search-results') && !target.closest('ion-searchbar')) {
                onClose?.();
            }
        };

        if (isVisible) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isVisible, onClose]);

    if (!isVisible) {
        return null;
    }

    return (
        <div
            ref={resultsRef}
            onScroll={handleResultsScroll}
            className="absolute md:top-20 sm:top-10 left-0 right-0 md:w-[70%] md:mx-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 md:max-h-60 overflow-y-auto mt-2"
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
                            onClick={() => handleCardClick(suggestion)}
                            className="cursor-pointer hover:bg-gray-50"
                            detail={false}
                        >
                            <IonLabel className="px-4">
                                <h3 className="font-medium text-sm">{suggestion.nombre}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {suggestion.categoria} | {suggestion.unidad} de {suggestion.factor} Pieza(s)
                                </p>
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
                        <IonNote className="text-sm">No se encontraron resultados</IonNote>
                    </IonLabel>
                </IonItem>
            ) : null}
        </div>
    );
};

export default SearchResults;