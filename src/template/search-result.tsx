// search-results.tsx
import ModalProd from "@/app/productos/components/modal-product";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import { useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import { formatValue } from "@/utils/constants/format-values";
import { Producto } from "@/utils/types/page";
import {
    IonItem,
    IonLabel,
    IonNote,
    isPlatform,
    useIonModal,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonList,
} from "@ionic/react";
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
    onClose,
}) => {
    const [getData] = useGetWithFiltersGeneralInIntelisisMutation();
    const searchTerm = useAppSelector(
        (state: RootState) => state.filterData.search?.value || ""
    );
    const [producto, setproducto] = useState<Producto>({} as Producto);

    // Estados para los resultados
    const [suggestions, setSuggestions] = useState<Producto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Paginación
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const resultsRef = useRef<HTMLDivElement | null>(null);

    // 🔒 Bloqueo inmediato para peticiones de "cargar más"
    const loadingLock = useRef(false);

    // 🧾 Identificador para ignorar respuestas obsoletas
    const requestIdRef = useRef(0);

    // Construir objetos Producto desde item API
    const mapApiItemToProducto = (item: any): Producto => ({
        id: item.Articulo + "-" + item.Unidad + "-" + item.Factor,
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

    const fetchPage = useCallback(
        async (pageToFetch: number, append = false, requestId: number) => {
            // Evitar ejecución si la búsqueda está vacía
            if (!searchTerm.trim()) {
                setSuggestions([]);
                return;
            }

            try {
                if (!append) {
                    setIsSearching(true);
                } else {
                    setIsLoadingMore(true);
                }

                // Llamada original SIN MODIFICAR
                const result = await getData({
                    table: `CB AS cb INNER JOIN Art AS art ON cb.Cuenta = art.Articulo INNER JOIN ListaPreciosDUnidad AS lpu ON art.Articulo = lpu.Articulo AND cb.Unidad = lpu.Unidad AND lpu.Lista = '(Precio Lista)' AND lpu.Precio > 0 INNER JOIN ArtUnidad AS au ON art.Articulo = au.Articulo AND lpu.Unidad = au.Unidad INNER JOIN ArtDisponible AS ad On ad.Almacen = 'ALMMAYO' AND art.Articulo = ad.Articulo AND ad.DispMenosApartado > 0 LEFT JOIN Oferta AS ofr On ofr.Estatus = 'VIGENTE' AND ofr.Articulo = art.Articulo AND ofr.FechaD < GETDATE() AND ofr.FechaA > GETDATE()  LEFT JOIN OfertaD AS ofrd On ofrd.id = ofr.ID AND ofrd.Articulo = art.Articulo AND ofrd.Unidad = cb.Unidad`,
                    pageSize: 10,
                    page: pageToFetch,
                    filtros: {
                        FiltrosAnd: [{
                            OperadorLogico: "OR",
                            Filtros: [
                                {
                                    key: "art.Descripcion1",
                                    operator: "LIKE",
                                    value: searchTerm
                                }, {
                                    key: "cb.Codigo",
                                    operator: "LIKE",
                                    value: searchTerm
                                },
                            ]
                        }],
                        Selects: [
                            { key: "cb.Codigo" },
                            { key: "art.Articulo" },
                            { key: "art.Grupo" },
                            { key: "art.Descripcion1" },
                            { key: "art.Impuesto1" },
                            { key: "art.Impuesto2" },
                            { key: "art.TipoImpuesto1" },
                            { key: "art.TipoImpuesto2" },
                            { key: "lpu.Unidad" },
                            { key: "lpu.Precio" },
                            { key: "ofrd.Precio", alias: "Descuento" },
                            { key: "au.Unidad", alias: "UnidadFactor" },
                            { key: "au.Factor" },
                        ],
                        Agregaciones: [
                            {
                                Key: "ad.DispMenosApartado",
                                Operation: "SUM",
                                Alias: "Cantidad",
                            },
                        ],
                        Order: [
                            {
                                Key: "Descripcion1",
                                Direction: "ASC",
                            },
                        ],
                    },
                    signal: undefined,
                });

                // 🚫 Ignorar si la solicitud ya no es la última
                if (requestId !== requestIdRef.current) return;

                if ("data" in result && result.data) {
                    const apiData = result.data as ApiResponse;
                    console.log(apiData);

                    const newItems = apiData.data.map(mapApiItemToProducto);
                    setTotalPages(apiData.totalPages);
                    setPage(apiData.page || pageToFetch);

                    if (append) {
                        setSuggestions((prev) => [...prev, ...newItems]);
                    } else {
                        setSuggestions(newItems);
                    }
                }
            } catch (error) {
                // Solo mostrar error si la solicitud sigue siendo vigente
                if (requestId === requestIdRef.current) {
                    console.error("❌ Error fetching search results:", error);
                    if (!append) setSuggestions([]);
                }
            } finally {
                // Resetear indicadores de carga
                if (requestId === requestIdRef.current) {
                    setIsSearching(false);
                    setIsLoadingMore(false);
                }
                // Liberar el bloqueo de carga si la petición era un append
                if (append) {
                    loadingLock.current = false;
                }
            }
        },
        [getData, searchTerm]
    );

    // Manejador de carga infinita (scroll)
    const handleLoadMore = async (event: any) => {
        // Bloqueo inmediato: si ya hay una petición en curso o no hay más páginas
        if (loadingLock.current || page >= totalPages) {
            event.target.complete();
            return;
        }

        // Activar bloqueo
        loadingLock.current = true;

        const nextPage = page + 1;
        try {
            await fetchPage(nextPage, true, requestIdRef.current);
        } finally {
            // Siempre marcamos como completado el scroll, incluso si falló
            event.target.complete();
            // El bloqueo se libera en el finally de fetchPage (para append)
        }
    };

    // Corrección: pasar las opciones del modal al presentarlo
    const [present, dismiss] = useIonModal(ModalProd, {
        producto,
        onDismiss: () => dismiss(),
    });

    const handleCardClick = (productoSelected: any) => {
        setproducto(productoSelected);
        present(
            isPlatform("desktop")
                ? {
                    initialBreakpoint: 0.95,
                    breakpoints: [0, 0.5, 0.95],
                }
                : undefined
        );
    };

    // Efecto para búsqueda controlada y cancelación de respuestas obsoletas
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSuggestions([]);
            return;
        }

        // Incrementar el id de solicitud para invalidar peticiones anteriores
        const currentRequestId = ++requestIdRef.current;

        // Resetear paginación al escribir una nueva búsqueda
        setPage(1);
        setIsSearching(true);
        // No se resetea totalPages aquí para evitar parpadeos, se actualizará con la respuesta

        fetchPage(1, false, currentRequestId);

        // No es posible abortar la petición, pero sí evitar que modifique estados
        // (el control de requestId lo maneja)
    }, [searchTerm, fetchPage]);

    // Ocultar resultados al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                !target.closest(".search-results") &&
                !target.closest("ion-searchbar")
            ) {
                onClose?.();
            }
        };

        if (isVisible) {
            document.addEventListener("click", handleClickOutside);
        }

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [isVisible, onClose]);

    if (!isVisible) {
        return null;
    }

    return (
        <IonList className="absolute md:top-20 sm:top-10 left-0 right-0 md:w-[70%] md:mx-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 md:max-h-60 overflow-y-auto mt-2">
            <section ref={resultsRef}>
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
                                    {suggestion.categoria} | {suggestion.unidad} de{" "}
                                    {suggestion.factor} Pieza(s)
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {suggestion.codigo}
                                </p>
                            </IonLabel>
                            <IonNote slot="end" className="text-xs">
                                {formatValue(suggestion.precio, "currency")}
                            </IonNote>
                        </IonItem>
                    ))}

                    {/* Infinite scroll: se deshabilita mientras se busca, carga, no hay más páginas o no hay resultados */}
                    <IonInfiniteScroll
                        threshold="100px"
                        disabled={
                            isSearching ||
                            isLoadingMore ||
                            page >= totalPages ||
                            suggestions.length === 0
                        }
                        onIonInfinite={handleLoadMore}
                    >
                        <IonInfiniteScrollContent loadingText="Cargando más..."></IonInfiniteScrollContent>
                    </IonInfiniteScroll>
                </>
            ) : searchTerm.trim() ? (
                <IonItem>
                    <IonLabel>
                        <IonNote className="text-sm">No se encontraron resultados</IonNote>
                    </IonLabel>
                </IonItem>
                ) : null}
            </section>
        </IonList>
    );
};

export default SearchResults;