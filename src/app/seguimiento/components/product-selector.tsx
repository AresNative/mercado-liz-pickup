// components/product-selector.tsx
import { useState, useEffect } from "react";
import { useProductSearch } from "@/hooks/use-product-search";
import { Producto } from "@/utils/types/page";
import { formatValue } from "@/utils/constants/format-values";
import { Search, X } from "lucide-react";

interface ProductSelectorProps {
    onSelect: (producto: Producto, cantidad: number) => void;
    onCancel: () => void;
    excludeProductId?: string;
    initialCantidad?: number;
}

export const ProductSelector = ({
    onSelect,
    onCancel,
    excludeProductId,
    initialCantidad = 1
}: ProductSelectorProps) => {
    const [query, setQuery] = useState("");
    const [cantidad, setCantidad] = useState(initialCantidad);
    const { results, isLoading, search } = useProductSearch();

    useEffect(() => {
        const delay = setTimeout(() => search(query), 300);
        return () => clearTimeout(delay);
    }, [query, search]);

    const filteredResults = excludeProductId
        ? results.filter(p => p.id !== excludeProductId)
        : results;

    const handleSelect = (prod: Producto) => {
        onSelect(prod, cantidad);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 mt-2">
            <div className="flex items-center gap-2 border-b pb-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                    autoFocus
                    type="text"
                    placeholder="Buscar producto..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 outline-none text-sm bg-white text-black"
                />
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Campo para modificar la cantidad */}
            <div className="flex items-center gap-2 mt-2 px-1">
                <label className="text-sm text-gray-600">Cantidad:</label>
                <input
                    type="number"
                    min="0.001"
                    step="any"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-xs text-gray-500">unidades</span>
            </div>

            <div className="max-h-60 overflow-y-auto mt-2">
                {isLoading && <div className="text-center py-2 text-gray-400">Buscando...</div>}
                {!isLoading && filteredResults.length === 0 && query && (
                    <div className="text-center py-2 text-gray-400">No se encontraron productos</div>
                )}
                {filteredResults.map((prod) => (
                    <button
                        key={prod.id}
                        onClick={() => handleSelect(prod)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-0 flex justify-between items-center"
                    >
                        <div>
                            <div className="font-medium text-sm text-black">{prod.nombre}</div>
                            <div className="text-xs text-gray-500">{prod.categoria} | {prod.unidad}</div>
                        </div>
                        <div className="text-purple-600 font-semibold">
                            {formatValue(prod.precio, "currency")}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};