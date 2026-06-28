import { Producto } from "@/utils/types/page";
import { motion } from "framer-motion";
import { Barcode, Hash, Heart, Minus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";
import { cn } from "@/utils/functions/cn";
import { isPlatform, useIonModal } from "@ionic/react";

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
    const [present, dismiss] = useIonModal(ModalProd, {
        producto,
        image,
        handleFavoriteToggle,
        isFavorite,
        onDismiss: () => dismiss(),
    });

    const handleCardClick = () => {
        present(isPlatform('desktop') ? {
                    initialBreakpoint: 0.95,
                    breakpoints: [0, 0.5, 0.95],
                } : undefined);
    };
    async function LoadImage() {
        const response = await getWithFilter({
            table: `imagenes`,
            filtros: {
                Selects: [
                    { key: "imagenes.url" },
                ],
                Filtros: [
                    { Key: "imagenes.id_ref", Operator: "=", Value: producto.articulo },
                ],
                Order: [{ Key: "id", Direction: "DESC" }],
            },
            pageSize: 1,
            page: 1,
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

    // Función para formatear el stock según la unidad
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


    return (
        <motion.article
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={handleCardClick}
            className="flex group relative w-full min-h-60 md:min-w-52 bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden cursor-pointer">

            <section
                className="relative border-r border-gray-200 my-auto overflow-hidden size-64 ">
                <ul className="absolute -top-0 w-[90%] py-2 px-4 flex md:flex-row flex-col justify-between items-center">
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


                {image ?
                    (<img
                        src={image ? image : "/logo.jpg"}
                        alt="Product Image"
                        className="h-52 mx-auto object-cover transition-transform duration-300"
                    />) :
                    (<div className="h-52 flex items-center justify-center">
                        <IconLiz
                            fill="#DBDBDB"

                        />
                    </div>)
                }
            </section>
            <div className="w-full h-56 flex flex-col justify-between">
                <section className="flex justify-between w-full p-4 min-h-24 bg-white">
                    <article>
                        <label className="font-semibold text-sm">{producto.nombre}</label>
                        <p className="text-xs text-gray-500 flex items-center justify-between">{producto.unidad} | {producto.categoria}</p>
                        {/* <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Barcode className="size-3 text-purple-800" />
                            CB: {producto.codigo}
                        </p> */}
                        <p className="text-xs text-gray-500 flex items-center">
                            <Hash className="size-3 text-purple-800" />
                            STOCK: {formatearStock(producto.cantidad, producto.unidad, producto.factor)}
                        </p>
                    </article>
                </section>

                <footer className="mt-auto w-full bg-white border-t border-gray-100">
                    <div className="flex items-center justify-between px-4 py-2 gap-2">

                        {/* ---- PRECIO ---- */}
                        <div className="flex flex-col max-w-[90px] overflow-hidden">
                            {producto.descuento ? (
                                <>
                                    <span className="text-base font-semibold text-purple-600 leading-none truncate">
                                        {formatValue(producto.descuento, "currency")}
                                    </span>
                                    <span className="text-[11px] text-gray-500 line-through truncate leading-none">
                                        {formatValue(producto.precio, "currency")}
                                    </span>
                                </>
                            ) : (
                                <span className="text-base font-semibold text-purple-600 leading-none truncate">
                                    {formatValue(producto.precio, "currency")}
                                </span>
                            )}
                        </div>

                        {/* ---- BOTÓN ADD TO CART ---- */}
                        <div className="flex-shrink-0">
                            <AddToCartButton
                                id={producto.id}
                                cantidad={formatearStock(producto.cantidad, producto.unidad, producto.factor)}
                                producto={producto}
                            />
                        </div>
                    </div>
                </footer>
            </div>
        </motion.article >
    );
}

export default Card;