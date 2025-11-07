import { Producto } from "@/utils/types/page";
import { motion } from "framer-motion";
import { Barcode, Hash, Heart, Minus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";
import { cn } from "@/utils/functions/cn";
import { useIonModal } from "@ionic/react";

import { formatValue } from "@/utils/constants/format-values";
import { IconLiz } from "@/app/productos/components/ionc-liz";

import ModalProd from "@/app/productos/components/modal-product";
import AddToCartButton from "@/app/productos/components/product-add-cart";
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
        image,
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
                        "Key": "nombre",
                        "Value": producto.nombre,
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
    useEffect(() => {
        const favorites = getLocalStorageItem("favoritos") || [];
        const JSONfavorites = typeof favorites === "string" ? JSON.parse(favorites) : favorites;
        setIsFavorite(JSONfavorites.some((fav: any) => fav === producto.id));
        LoadImage();
    }, [producto.id]);

    return (
        <motion.article
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={handleCardClick}
            className="flex group relative w-full min-h-60 md:min-w-52 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden cursor-pointer">

            <section
                className="relative border-r border-gray-200 my-auto overflow-hidden size-64 h-full">
                <ul className="p-1 flex justify-between items-center">
                    <li className="flex flex-col gap-1">
                        {discountPercentage > 0 && (
                            <div className="w-full text-center border-2 border-red-600 text-red-600 text-xs font-semibold px-2 py-1 rounded-md">
                                -{discountPercentage}%
                            </div>
                        )}
                        {isLowStock && (
                            <div className="w-full text-center border-2 border-yellow-600 text-yellow-600 text-xs font-semibold px-2 py-1 rounded-md">
                                última(s) {producto.cantidad}
                            </div>
                        )}
                        {isOutOfStock && (
                            <div className="w-full text-center border-2 border-gray-600 text-gray-600  text-xs font-semibold px-2 py-1 rounded-md">
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


                {image ?
                    (<img
                        src={image ? image : "/logo.jpg"}
                        alt="Product Image"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />) :
                    (<IconLiz
                        fill="#DBDBDB"
                    />)
                }
            </section>
            <div className="w-full h-56 flex flex-col justify-between">
                <section className="flex justify-between w-full p-4 min-h-24 bg-white">
                    <article>
                        <label className="font-semibold text-sm">{producto.nombre}</label>
                        <p className="text-xs text-gray-500 flex items-center justify-between">{producto.unidad} | {producto.categoria}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Barcode className="size-3 text-purple-800" />
                            CB: {producto.id}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center">
                            <Hash className="size-3 text-purple-800" />
                            STOCK: {producto.cantidad}
                        </p>
                    </article>
                </section>

                <footer className="mt-auto">
                    <ul className="w-full px-4 pb-2 mt-auto bg-white flex items-center justify-between">
                        <li className="flex flex-col">
                            {producto.descuento ? (
                                <>
                                    <span className="text-lg font-semibold text-purple-600">
                                        {formatValue(producto.descuento, "currency")}
                                    </span>
                                    <span className="text-xs text-gray-500 line-through">
                                        {formatValue(producto.precio, "currency")}
                                    </span>
                                </>
                            ) : (
                                <span className="text-lg font-semibold text-purple-600">
                                    {formatValue(producto.precio, "currency")}
                                </span>
                            )}
                        </li>
                        <li>
                            <AddToCartButton id={producto.id} cantidad={producto.cantidad} producto={producto} />
                        </li>
                    </ul>
                </footer>
            </div>
        </motion.article >
    );
}

export default Card;