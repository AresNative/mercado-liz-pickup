import { Producto } from "@/utils/types/page";
import { motion } from "framer-motion";
import AddToCartButton from "./product-add-cart";
import ModalProd from "./modal-product";
import { Barcode, Hash, Heart, ReceiptText } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";
import { cn } from "@/utils/functions/cn";
import { useIonModal } from "@ionic/react";
import { IconLiz } from "./ionc-liz";
import { formatValue } from "@/utils/constants/format-values";
import { useGetWithFiltersGeneralMutation } from "@/hooks/reducers/api";
import { EnvConfig } from "@/utils/constants/env.config";

interface ProductCardProps {
    producto: Producto;
}
const { hubs: apiUrl } = EnvConfig();

const Card: React.FC<ProductCardProps> = ({ producto }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [image, setImage] = useState("");
    const [getWithFilter] = useGetWithFiltersGeneralMutation();
    const isLowStock = producto.cantidad > 0 && producto.cantidad <= 10;
    const isOutOfStock = producto.cantidad <= 0;

    // Price calculations
    const { discountPercentage } = useMemo(() => {
        const percentage = producto.descuento
            ? ((producto.precio - producto.descuento) / producto.precio) * 100
            : 0;
        let roundedDiscount = Math.round(percentage);
        return { discountPercentage: roundedDiscount };
    }, [producto.precio, producto.precioRegular, producto.descuento]);

    const handleFavoriteToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // Prevenir que se abra el modal
        const favorites = getLocalStorageItem("favoritos") || [];
        const JSONfavorites = typeof favorites === "string" ? JSON.parse(favorites) : favorites;

        let updatedFavorites;

        if (isFavorite) {
            updatedFavorites = JSONfavorites.filter((fav: any) => fav.id !== producto.id);
        } else {
            updatedFavorites = [...JSONfavorites, producto];
        }

        setLocalStorageItem("favoritos", JSON.stringify(updatedFavorites));
        setIsFavorite(!isFavorite);
    }, [isFavorite, producto]);

    async function LoadImage() {
        const response = await getWithFilter({
            table: `imagenes
                    left join articulos on articulos.id = imagenes.id_ref`,
            pageSize: 10,
            page: 1,
            tag: 'Productos',
            filtros: {
                "Filtros": [
                    {
                        "Key": "articulo",
                        "Value": producto.articulo,
                        "Operator": "="
                    },
                    {
                        "Key": "tabla",
                        "Value": "articulos",
                        "Operator": "="
                    }
                ],
                "Selects": [
                    { key: "articulos.id" },
                    { key: "articulos.nombre" },
                    { key: "articulos.descripcion" },
                    { key: "articulos.precio" },
                    { key: "imagenes.url" }
                ]
            }
        }).unwrap();

        if (response && response.data) {
            response.data.map((item: any) => {
                setImage(apiUrl.slice(0, -1) + item.url);
            });
        }
    }
    // Corrección: pasar las opciones del modal al presentarlo
    const [present, dismiss] = useIonModal(ModalProd, {
        producto,
        image,
        handleFavoriteToggle,
        isFavorite,
        onDismiss: () => dismiss(),
    });

    const handleCardClick = () => {
        present({
            initialBreakpoint: 0.95,
            breakpoints: [0, 0.5, 0.95],
        });
    };

    useEffect(() => {
        const favorites = getLocalStorageItem("favoritos") || [];
        const JSONfavorites = typeof favorites === "string" ? JSON.parse(favorites) : favorites;
        setIsFavorite(JSONfavorites.some((fav: any) => fav.id === producto.id));
        LoadImage();
    }, [producto.id]);

    // card.tsx - REEMPLAZAR la función formatearStock actual
    const formatearStock = (cantidad: number, unidad: string, factor: number = 1) => {
        // Para unidades como Kilogramo, mostrar con decimales
        if (/kilo|kg/i.test(unidad)) {
            return unidad !== 'Pieza'
                ? (factor ? (cantidad / factor).toFixed(2) : cantidad.toFixed(2))
                : cantidad.toFixed(0);
        } else {
            return unidad !== 'Pieza'
                ? (factor ? Math.trunc(cantidad / factor) : Math.trunc(cantidad))
                : Math.trunc(cantidad);
        }
    };
    const stok = formatearStock(producto.cantidad, producto.unidad, producto.factor);
    const stokNumeric = Number(stok);
    if (!isNaN(stokNumeric) && stokNumeric <= 0 && !isOutOfStock) {
        return null; // No renderizar la tarjeta si el stock es 0 o menos
    }
    return (
        <motion.article
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={handleCardClick}
            className="group relative min-w-52 bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer">

            <section
                className="relative border-b border-gray-200 overflow-hidden">
                {image ?
                    (<img
                        src={image ? image : "/logo.jpg"}
                        alt="Product Image"
                        className=" h-52 mx-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    />) :
                    (<IconLiz fill="#DBDBDB" />)}

                {/* ---- BOTÓN ADD TO CART ---- */}
                <div className="absolute bottom-2 right-2">
                    <AddToCartButton
                        id={producto.id}
                        cantidad={formatearStock(producto.cantidad, producto.unidad, producto.factor)}
                        producto={producto}
                    />
                </div>
            </section>

            <section className="p-4 min-h-24 bg-white">
                <label className="font-semibold text-sm">{producto.nombre}</label>

                <ul className="absolute w-[90%] mx-auto top-2 flex justify-between items-center">
                    <li className="flex flex-col gap-1">
                        {discountPercentage > 0 && (
                            <div className="w-full text-center border-2 bg-red-100 border-red-600 text-red-600  text-xs font-semibold px-2 py-1 rounded-md">
                                -{discountPercentage}%
                            </div>
                        )}
                        {isLowStock && (
                            <div className="w-full text-center border-2 bg-yellow-100 border-yellow-600 text-yellow-600 text-xs font-semibold px-2 py-1 rounded-md">
                                última(s) {producto.cantidad}
                            </div>
                        )}
                        {isOutOfStock && (
                            <div className="w-full text-center border-2 bg-gray-100 border-gray-600 text-gray-600  text-xs font-semibold px-2 py-1 rounded-md">
                                agotado
                            </div>
                        )}
                    </li>
                    <button
                        onClick={handleFavoriteToggle}
                        className="top-2 right-10 p-1.5 bg-white/80 rounded-full backdrop-blur-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                    >
                        <Heart
                            className={cn(
                                "w-6 h-6 transition-colors",
                                isFavorite
                                    ? "fill-red-400 text-red-500"
                                    : "text-gray-400 hover:text-red-400"
                            )}
                        />
                    </button>
                </ul>


                <p className="text-xs text-gray-500 flex items-center justify-between">{producto.unidad} | {producto.categoria}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Barcode className="size-3 text-purple-800" />
                    CB: {producto.codigo}
                </p>
                <p className="text-xs text-gray-500 flex items-center">
                    <Hash className="size-3 text-purple-800" />
                    STOK: {formatearStock(producto.cantidad, producto.unidad, producto.factor)}
                </p>

                {producto.unidad !== 'Pieza' && producto.unidad !== 'Kilogramo' && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <ReceiptText className="size-3 text-purple-800" />
                        FACTOR: {producto.factor} (Piezas)
                    </p>
                )}
            </section>

            <footer className="mt-auto w-full bg-white border-t border-gray-100">
                <div className="flex flex-col justify-between px-4 py-4 gap-2">
                    {/* ---- PRECIO ---- */}
                    <div className="flex flex-col overflow-hidden">
                        {producto.descuento ? (
                            <>
                                <span className="text-lg font-semibold text-purple-600 leading-none truncate">
                                    {formatValue(producto.descuento, "currency")}
                                </span>
                                <span className="text-[11px] text-gray-500 line-through truncate leading-none">
                                    {formatValue(producto.precio, "currency")}
                                </span>
                            </>
                        ) : (
                            <span className="text-lg font-semibold text-purple-600 leading-none truncate">
                                {formatValue(producto.precio, "currency")}
                            </span>
                        )}
                    </div>
                </div>
            </footer>

        </motion.article >
    );
};

export default Card;