// components/product-selector.tsx
import { useState, useEffect } from "react";
import { useProductSearch } from "@/hooks/use-product-search";
import { Producto } from "@/utils/types/page";
import { formatValue } from "@/utils/constants/format-values";
import { Search, X, ChevronLeft } from "lucide-react";

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
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [cantidad, setCantidad] = useState(initialCantidad);
    const { results, isLoading, search } = useProductSearch();

    // Búsqueda con debounce
    useEffect(() => {
        const delay = setTimeout(() => search(query), 300);
        return () => clearTimeout(delay);
    }, [query, search]);

    // Filtrar producto excluido
    const filteredResults = excludeProductId
        ? results.filter(p => p.id !== excludeProductId)
        : results;

    // Determinar step según la unidad del producto seleccionado
    const getStep = (producto: Producto | null) => {
        if (!producto) return 1;
        const unit = producto.unidad?.toLowerCase() || "";
        return (unit.includes("kg") || unit.includes("kilogramo")) ? 0.25 : 1;
    };

    // Formatear stock para mostrar (similar a card.tsx)
    const formatStock = (producto: Producto) => {
        const cantidad = producto.cantidad || 0;
        const quantity = producto.quantity || 0;
        const unidad = producto.unidad;
        const factor = producto.factor || 1;

        if (/kilo|kg/i.test(unidad)) {
            return (cantidad / factor).toFixed(2);
        } else {
            return unidad !== 'Pieza'
                ? Math.trunc(cantidad / factor)
                : Math.trunc(cantidad);
        }
    };

    // Manejar selección de producto de la lista
    const handleProductClick = (prod: Producto) => {
        setSelectedProduct(prod);
        // Inicializar cantidad con el valor por defecto (1 o el step mínimo)
        const step = getStep(prod);
        const initialQty = Math.min(initialCantidad, prod.cantidad);
        setCantidad(step === 0.25 ? parseFloat(initialQty.toFixed(2)) : Math.floor(initialQty));
    };

    // Manejar cambio de cantidad con validación de step y stock
    const handleCantidadChange = (value: number) => {
        if (!selectedProduct) return;
        const step = getStep(selectedProduct);
        let newVal = value;
        // Redondear al step más cercano
        newVal = Math.round(newVal / step) * step;
        // Limitar entre 0 y stock disponible
        newVal = Math.min(Math.max(0, newVal), selectedProduct.cantidad);
        // Para evitar -0
        if (newVal < 0) newVal = 0;
        setCantidad(step === 0.25 ? parseFloat(newVal.toFixed(2)) : Math.floor(newVal));
    };

    // Confirmar selección
    const confirmSelection = () => {
        if (selectedProduct && cantidad > 0) {
            onSelect(selectedProduct, cantidad);
        }
    };

    // Volver a la lista de resultados
    const backToList = () => {
        setSelectedProduct(null);
        setCantidad(initialCantidad);
    };

    const step = getStep(selectedProduct);
    const maxStock = selectedProduct?.cantidad || 0;
    const displayStock = selectedProduct ? formatStock(selectedProduct) : "";

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 mt-2">
            {/* Cabecera: búsqueda o título de confirmación */}
            {!selectedProduct ? (
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
            ) : (
                <div className="flex items-center gap-2 border-b pb-2">
                    <button onClick={backToList} className="text-gray-500 hover:text-gray-700">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-700">Confirmar cantidad</span>
                </div>
            )}

            {/* Contenido: lista de resultados o panel de confirmación */}
            {!selectedProduct ? (
                <div className="max-h-60 overflow-y-auto mt-2">
                    {isLoading && <div className="text-center py-2 text-gray-400">Buscando...</div>}
                    {!isLoading && filteredResults.length === 0 && query && (
                        <div className="text-center py-2 text-gray-400">No se encontraron productos</div>
                    )}
                    {filteredResults.map((prod) => (
                        <button
                            key={prod.id}
                            onClick={() => handleProductClick(prod)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-0 flex justify-between items-center"
                        >
                            <div>
                                <div className="font-medium text-sm text-black">{prod.nombre}</div>
                                <div className="text-xs text-gray-500">
                                    {prod.categoria} | {prod.unidad}
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                    Stock: {formatStock(prod)} {prod.unidad}
                                </div>
                            </div>
                            <div className="text-purple-600 font-semibold">
                                {formatValue(prod.precio, "currency")}
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="mt-3">
                    <div className="mb-3">
                        <div className="font-medium text-black">{selectedProduct.nombre}</div>
                        <div className="text-xs text-gray-500">
                            {selectedProduct.categoria} | {selectedProduct.unidad}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                            Stock disponible: {displayStock} {selectedProduct.unidad}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                        <label className="text-sm text-gray-600">Cantidad:</label>
                        <input
                            type="number"
                            min={step}
                            max={displayStock}
                            step={step}
                            value={cantidad}
                            onChange={(e) => handleCantidadChange(parseFloat(e.target.value))}
                            className="w-28 px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                        <span className="text-xs text-gray-500">{selectedProduct.unidad}</span>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={confirmSelection}
                            disabled={cantidad <= 0 || cantidad > maxStock}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${cantidad > 0 && cantidad <= maxStock
                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            Confirmar {cantidad > 0 ? `(${cantidad} ${selectedProduct.unidad})` : ""}
                        </button>
                        <button
                            onClick={backToList}
                            className="flex-1 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Volver
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};