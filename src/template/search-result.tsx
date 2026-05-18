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
    IonSpinner,
    isPlatform,
    useIonModal,
    IonList,
} from "@ionic/react";
import { Barcode } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const SEARCH_TABLE = "CB AS cb INNER JOIN Art AS art ON cb.Cuenta = art.Articulo INNER JOIN ListaPreciosDUnidad AS lpu ON art.Articulo = lpu.Articulo AND cb.Unidad = lpu.Unidad AND lpu.Lista = '(Precio Lista)' AND lpu.Precio > 0 INNER JOIN ArtUnidad AS au ON art.Articulo = au.Articulo AND lpu.Unidad = au.Unidad INNER JOIN ArtDisponible AS ad ON ad.Almacen = 'ALMMAYO' AND art.Articulo = ad.Articulo AND ad.DispMenosApartado > 0 LEFT JOIN Oferta AS ofr ON ofr.Estatus = 'VIGENTE' AND ofr.Articulo = art.Articulo AND ofr.FechaD < GETDATE() AND ofr.FechaA > GETDATE() LEFT JOIN OfertaD AS ofrd ON ofrd.id = ofr.ID AND ofrd.Articulo = art.Articulo AND ofrd.Unidad = cb.Unidad";

const PAGE_SIZE = 15;
const DEBOUNCE_MS = 300;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mapApiItemToProducto = (item: any): Producto => ({
    id: `${item.Articulo}-${item.Unidad}-${item.Factor}`,
    codigo: item.Codigo ?? "0000",
    articulo: item.Articulo ?? "Cuenta",
    nombre: item.Descripcion1 ?? "Sin nombre",
    categoria: item.Grupo ?? "Sin categoría",
    unidad: item.Unidad ?? "Unidad",
    precio: item.Precio ?? 0,
    cantidad: item.Cantidad ?? 1,
    factor: item.Factor ?? 1,
    impuesto1: item.Impuesto1 ?? 0,
    impuesto2: item.Impuesto2 ?? 0,
    tipoImpuesto1: item.TipoImpuesto1 ?? 0,
    tipoImpuesto2: item.TipoImpuesto2 ?? 0,
    descuento: item.Descuento ?? 0,
});

const buildFiltros = (term: string) => ({
    FiltrosAnd: [{
        OperadorLogico: "OR",
        Filtros: [
            { key: "art.Descripcion1", operator: "LIKE", value: term },
            { key: "cb.Codigo", operator: "LIKE", value: term },
        ],
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
        { Key: "ad.DispMenosApartado", Operation: "SUM", Alias: "Cantidad" },
    ],
    Order: [{ Key: "Descripcion1", Direction: "ASC" }],
});

// ─── Component ────────────────────────────────────────────────────────────────

const SearchResults: React.FC<SearchResultsProps> = ({
    isVisible = false,
    onClose,
}) => {
    const [getData] = useGetWithFiltersGeneralInIntelisisMutation();
    const searchTerm = useAppSelector(
        (state: RootState) => state.filterData.search?.value ?? ""
    );

    const [producto, setProducto] = useState<Producto>({} as Producto);
    const [suggestions, setSuggestions] = useState<Producto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

    // ── Refs ──────────────────────────────────────────────────────────────────
    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Stable snapshots readable inside IntersectionObserver callbacks
    // without needing to re-subscribe the observer on every render.
    const activeTermRef = useRef("");
    const pageRef = useRef(1);
    const totalPagesRef = useRef(1);
    const isSearchingRef = useRef(false);
    // Sentinel element observed at the bottom of the list.
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    // The observer instance — disconnected/reconnected when hasMore changes.
    const observerRef = useRef<IntersectionObserver | null>(null);

    // ── Debounce ──────────────────────────────────────────────────────────────

    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(
            () => setDebouncedTerm(searchTerm),
            DEBOUNCE_MS,
        );
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [searchTerm]);

    // ── Core fetch ────────────────────────────────────────────────────────────

    const fetchPage = useCallback(
        async (termToSearch: string, pageToFetch: number) => {
            // Cancel any previous in-flight request
            abortControllerRef.current?.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;

            isSearchingRef.current = true;
            setIsSearching(true);
            setError(null);

            try {
                const result = await getData({
                    table: SEARCH_TABLE,
                    pageSize: PAGE_SIZE,
                    page: pageToFetch,
                    filtros: buildFiltros(termToSearch),
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                if ("data" in result && result.data) {
                    const apiData = result.data as ApiResponse;
                    const newItems = apiData.data.map(mapApiItemToProducto);

                    totalPagesRef.current = apiData.totalPages;
                    setTotalPages(apiData.totalPages);

                    setSuggestions(prev =>
                        pageToFetch === 1 ? newItems : [...prev, ...newItems]
                    );
                }
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error("Error fetching search results:", err);
                if (pageToFetch === 1) {
                    setError("Error al cargar resultados. Intente de nuevo.");
                    setSuggestions([]);
                }
            } finally {
                if (abortControllerRef.current === controller) {
                    abortControllerRef.current = null;
                    isSearchingRef.current = false;
                    setIsSearching(false);
                }
            }
        },
        [getData],
    );

    // ── Reset + first page when term changes ──────────────────────────────────

    useEffect(() => {
        const term = debouncedTerm.trim();

        if (!term) {
            abortControllerRef.current?.abort();
            setSuggestions([]);
            setError(null);
            setPage(1);
            pageRef.current = 1;
            setTotalPages(1);
            totalPagesRef.current = 1;
            activeTermRef.current = "";
            return;
        }

        activeTermRef.current = term;
        pageRef.current = 1;
        totalPagesRef.current = 1;
        setPage(1);
        setTotalPages(1);
        setSuggestions([]);
        setError(null);

        fetchPage(term, 1);
    }, [debouncedTerm, fetchPage]);

    // ── Load next pages (triggered by IntersectionObserver via setPage) ───────

    useEffect(() => {
        if (page > 1 && activeTermRef.current) {
            fetchPage(activeTermRef.current, page);
        }
    }, [page, fetchPage]);

    // ── IntersectionObserver — works inside any scroll container ──────────────
    //
    // IonInfiniteScroll observes the document scroll (ion-content), so it
    // never fires when the list is inside a fixed-height overflow:auto div
    // (the case on web/desktop). IntersectionObserver targets the scroll
    // container directly via `root`, so it works everywhere.

    useEffect(() => {
        // Disconnect any existing observer before recreating
        observerRef.current?.disconnect();

        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const hasMore = pageRef.current < totalPagesRef.current;
        if (!hasMore) return;

        // `root: null` observes relative to the viewport.
        // Because the sentinel is *inside* the scrollable IonList container
        // the browser reports it as invisible until the user scrolls to it,
        // regardless of whether the overflow is on a div or the document.
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (
                    entry.isIntersecting &&
                    !isSearchingRef.current &&
                    pageRef.current < totalPagesRef.current
                ) {
                    const nextPage = pageRef.current + 1;
                    pageRef.current = nextPage;
                    setPage(nextPage);
                }
            },
            {
                // Observe relative to the nearest scrollable ancestor
                // (the IonList with overflow-y:auto).
                root: sentinel.closest(".search-results") as Element,
                rootMargin: "0px 0px 120px 0px",
                threshold: 0,
            },
        );

        observerRef.current.observe(sentinel);

        return () => observerRef.current?.disconnect();
        // Re-run whenever results or totalPages change so the observer
        // is re-attached after each successful fetch.
    }, [suggestions, totalPages]);

    // ── Cleanup observer on unmount ───────────────────────────────────────────

    useEffect(() => {
        return () => {
            observerRef.current?.disconnect();
            abortControllerRef.current?.abort();
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    // ── Modal ─────────────────────────────────────────────────────────────────

    const [present, dismiss] = useIonModal(ModalProd, {
        producto,
        onDismiss: () => dismiss(),
    });

    const handleCardClick = useCallback(
        (productoSelected: Producto) => {
            setProducto(productoSelected);
            present(
                isPlatform("desktop")
                    ? { initialBreakpoint: 0.95, breakpoints: [0, 0.5, 0.95] }
                    : undefined
            );
        },
        [present],
    );

    // ── Close on outside click ────────────────────────────────────────────────

    useEffect(() => {
        if (!isVisible) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                !target.closest(".search-results") &&
                !target.closest("ion-searchbar")
            ) {
                onClose?.();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isVisible, onClose]);

    // ── Render ────────────────────────────────────────────────────────────────

    if (!isVisible) return null;

    const hasMore = page < totalPages;
    const showSkeleton = isSearching && suggestions.length === 0 && !error;
    const showEmpty = !isSearching && !error && suggestions.length === 0 && !!debouncedTerm.trim();

    return (
        <IonList className="search-results absolute md:top-20 sm:top-10 left-0 right-0 md:w-[70%] md:mx-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 md:h-3/5 overflow-y-auto mt-2">
            {showSkeleton ? (
                <IonItem>
                    <IonLabel><IonNote>Buscando...</IonNote></IonLabel>
                </IonItem>
            ) : error ? (
                <IonItem>
                    <IonLabel>
                        <IonNote className="text-red-500">{error}</IonNote>
                    </IonLabel>
                </IonItem>
            ) : suggestions.length > 0 ? (
                <>
                    {suggestions.map((suggestion) => (
                        <IonItem
                            key={suggestion.id + suggestion.precio + suggestion.factor} // ID compuesto para evitar colisiones
                            button
                            onClick={() => handleCardClick(suggestion)}
                            className="cursor-pointer hover:bg-gray-50 py-2"
                            detail={false}
                        >
                            <IonNote className="px-4 flex flex-col">
                                <h3 className="font-medium text-black text-sm">{suggestion.nombre}</h3>
                                <p className="text-gray-400 text-xs mt-1">
                                    {suggestion.categoria} | {suggestion.unidad} de {suggestion.factor} Pieza(s)
                                </p>
                                <p className="text-purple-600 mt-1 flex gap-1 items-center">
                                    <Barcode className="size-4" />
                                    {suggestion.codigo}
                                </p>
                            </IonNote>
                            <IonNote slot="end" className="text-lg text-purple-800">
                                {formatValue(suggestion.precio, "currency")}
                            </IonNote>
                        </IonItem>
                    ))}

                    {/* Sentinel: IntersectionObserver watches this element.
                        When it enters the viewport (user scrolled to the bottom)
                        the next page is fetched — works in any scroll container. */}
                    <div ref={sentinelRef} className="flex justify-center py-2">
                        {isSearching && hasMore && (
                            <IonSpinner name="dots" />
                        )}
                    </div>
                </>
            ) : showEmpty ? (
                <IonItem>
                    <IonLabel><IonNote>No se encontraron resultados</IonNote></IonLabel>
                </IonItem>
            ) : null}
        </IonList>
    );
};

export default SearchResults;