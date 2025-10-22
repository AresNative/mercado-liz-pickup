import { Producto } from "@/utils/types/page";
import { motion } from "framer-motion";
import AddToCartButton from "./product-add-cart";
import { Barcode, Hash, Heart } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";
import { cn } from "@/utils/functions/cn";
import { useIonModal } from "@ionic/react";

import ModalProd from "./modal-product";
import { IconLiz } from "./ionc-liz";

interface ProductCardProps {
    producto: Producto;
}

const Card: React.FC<ProductCardProps> = ({ producto }) => {
    const [isFavorite, setIsFavorite] = useState(false);

    const isLowStock = producto.cantidad > 0 && producto.cantidad <= 10;
    const isOutOfStock = producto.cantidad <= 0;

    // Price calculations
    const { discountPercentage } = useMemo(() => {
        const discountPercentage = producto.descuento && producto.descuento / producto.precio || 0;

        return { discountPercentage };
    }, [producto.precio, producto.precioRegular, producto.descuento]);

    const handleFavoriteToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // Prevenir que se abra el modal
        const favorites = getLocalStorageItem("favoritos") || [];
        const JSONfavorites = typeof favorites === "string" ? JSON.parse(favorites) : favorites;

        let updatedFavorites;

        if (isFavorite) {
            updatedFavorites = JSONfavorites.filter((fav: any) => fav !== producto.id);
        } else {
            updatedFavorites = [...JSONfavorites, producto.id];
        }

        console.log("Favoritos actualizados:", updatedFavorites);
        setLocalStorageItem("favoritos", JSON.stringify(updatedFavorites));
        setIsFavorite(!isFavorite);
    }, [isFavorite, producto.id]);

    // Corrección: pasar las opciones del modal al presentarlo
    const [present] = useIonModal(ModalProd, {
        producto,
        handleFavoriteToggle,
        isFavorite,
        onDismiss: (data: string, role: string) => console.log('Modal dismissed:', data, role),
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
        setIsFavorite(JSONfavorites.some((fav: any) => fav === producto.id));
    }, [producto.id]);

    return (
        <motion.article
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={handleCardClick}
            className="group relative md:min-w-40 md:min-h-40 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer">

            <section
                className="relative border-b border-gray-200 overflow-hidden">
                {producto.image ?
                    (<img
                        src="/logo.jpg"
                        alt="Product Image"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />) :
                    (<IconLiz fill="#DBDBDB" />)}
            </section>

            <section className="p-4 min-h-24 bg-white">
                <label className="text-lg font-semibold">{producto.nombre}</label>

                <ul className="absolute w-[90%] mx-auto top-2 flex justify-between items-center">
                    <li className="flex flex-col gap-1">
                        {discountPercentage > 0 && (
                            <div className="w-full text-center bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                -{discountPercentage}%
                            </div>
                        )}
                        {isLowStock && (
                            <div className="w-full text-center bg-yellow-400 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                Últimas {producto.cantidad}
                            </div>
                        )}
                        {isOutOfStock && (
                            <div className="w-full text-center bg-gray-400 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                Agotado
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
                    CB: {producto.id}
                </p>
                <p className="text-xs text-gray-500 flex items-center">
                    <Hash className="size-3 text-purple-800" />
                    STOCK: {producto.cantidad}
                </p>
            </section>

            <footer className="mt-auto">
                <ul className="w-full px-4 pb-2 mt-auto bg-white flex items-center justify-between">
                    <li>
                        <span className="text-lg font-semibold text-purple-600">${producto.precio.toFixed(2)}</span>
                    </li>
                    <li>
                        <AddToCartButton id={producto.id} cantidad={producto.cantidad} producto={producto} />
                    </li>
                </ul>
            </footer>
        </motion.article >
    );
}

export default Card;