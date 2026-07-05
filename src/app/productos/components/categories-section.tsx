import { ReactNode, useEffect, useRef } from "react";

interface CategoryRowProps<T> {
    title: string;
    items: T[];
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    renderItem: (item: T, index: number) => ReactNode;
}

/**
 * Fila de artículos de UNA categoría con scroll horizontal e "infinite
 * scroll" propio: un elemento "sentinel" invisible al final de la fila se
 * observa con IntersectionObserver usando el propio contenedor horizontal
 * como `root`. Cuando el sentinel entra en el área observada (o ya está
 * visible porque la fila no alcanza a llenar el ancho disponible) se pide
 * la siguiente página SOLO de esa categoría.
 */
export function CategoryRow<T>({
    title,
    items,
    hasMore,
    isLoading,
    onLoadMore,
    renderItem,
}: CategoryRowProps<T>) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = scrollRef.current;
        const sentinel = sentinelRef.current;
        if (!root || !sentinel || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !isLoading && hasMore) {
                    onLoadMore();
                }
            },
            {
                root,
                // Precarga 200px antes de que el sentinel llegue al borde
                // derecho visible del scroll horizontal.
                rootMargin: "0px 200px 0px 0px",
                threshold: 0,
            }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
        // Se vuelve a evaluar cada vez que cambian los items, isLoading o
        // hasMore: al recrear el observer, IntersectionObserver dispara un
        // chequeo inicial del estado actual del sentinel. Esto hace que,
        // si la fila todavía no alcanza a desbordar el ancho visible tras
        // cargar una página, se siga pidiendo la siguiente automáticamente
        // hasta llenar el espacio o agotar hasMore.
    }, [items.length, isLoading, hasMore, onLoadMore]);

    if (items.length === 0 && !isLoading) return null;

    return (
        <section className="mb-7 w-full min-w-0">
            <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {title}
                </h2>
            </div>
            <div
                ref={scrollRef}
                className="flex flex-nowrap gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory scroll-smooth w-full min-w-0"
                style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="shrink-0 w-36 sm:w-44 md:w-48 snap-start"
                        style={{ flex: "0 0 auto" }}
                    >
                        {renderItem(item, index)}
                    </div>
                ))}

                {/* Sentinel: dispara la carga de la siguiente página cuando
                    entra en el área observada del scroll horizontal. */}
                {hasMore && (
                    <div
                        ref={sentinelRef}
                        className="shrink-0 w-8 h-1"
                        style={{ flex: "0 0 auto" }}
                        aria-hidden="true"
                    />
                )}

                {isLoading && (
                    <div
                        className="shrink-0 w-24 flex items-center justify-center text-xs text-gray-400"
                        style={{ flex: "0 0 auto" }}
                    >
                        Cargando…
                    </div>
                )}
            </div>
        </section>
    );
}

export default CategoryRow;