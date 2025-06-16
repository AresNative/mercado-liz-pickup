import type React from "react";
import useDebounce from "@/hooks/use-debounce";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonItem, IonLabel, IonList, IonSpinner } from "@ionic/react";
import { useGetArticulosQuery } from "@/hooks/reducers/api_int";
import { Search } from "lucide-react";
import { Product } from "@/utils/data/example-data";
import { useAppSelector } from "@/hooks/selector";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        className={`w-full px-3 py-2 border text-gray-500 dark:text-gray-100 border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-900 ${className}`}
        {...props}
    />
);

const PAGE_SIZE = 5;

function PriceChecker() {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);
    const [page, setPage] = useState(1);
    const [isFocused, setIsFocused] = useState(false);
    const [productos, setProductos] = useState<Product[]>([]);

    const precio =
        getLocalStorageItem("sucursal")?.precio ??
        useAppSelector((state) => state.app.sucursal.precio);

    // Crear objeto de parámetros para evitar re-renders innecesarios
    const params = useMemo(
        () => ({
            page,
            pageSize: PAGE_SIZE,
            listaPrecio: precio,
            filtro: debouncedQuery,
        }),
        [page, PAGE_SIZE, precio, debouncedQuery]
    );

    const { data, isFetching, error } = useGetArticulosQuery(params);

    // Mapeo de datos cuando cambia la respuesta
    useEffect(() => {
        if (data?.data) {
            const mapped = data.data.map((item: any) => ({
                id: item.Codigo,
                nombre: item.Nombre,
                precio: item.PrecioRegular,
                categoria: item.Grupo,
                unidad: item.Unidad,
                image: item.Imagen
            }));
            setProductos(page === 1 ? mapped : [...productos, ...mapped]);
        }
    }, [data]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setPage(1);
    };

    const container = {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: { height: { duration: 0.4 }, staggerChildren: 0.1 },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: { height: { duration: 0.3 }, opacity: { duration: 0.2 } },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
    };

    return (
        <div className="mx-auto inset-0 z-20">
            <div className="relative flex max-h-3/4 flex-col justify-start items-center">
                <div className="bg-background w-full sticky">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Buscar productos..."
                            value={query}
                            onChange={handleInputChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="pl-3 pr-9 text-sm rounded-lg bg-white"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
                            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-sm absolute top-10 inset-0 mx-auto z-10 mt-2">
                    <AnimatePresence>
                        {isFocused && (
                            <motion.div
                                className="w-full max-h-[500px] overflow-y-auto border rounded-md shadow-sm overflow-hidden dark:border-gray-800 bg-white dark:bg-gray-900"
                                variants={container}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                            >
                                <motion.ul>
                                    {isFetching ? (
                                        <IonItem className="w-full flex items-center gap-2 justify-center p-4">
                                            <div className="text-center">
                                                <IonSpinner name="crescent" className="h-12 w-12 text-purple-600" />
                                                <p className="mt-4 text-gray-600">Cargando productos...</p>
                                            </div>
                                        </IonItem>
                                    ) : error ? (
                                        <IonItem className="text-red-500 p-4">
                                            {"Error al cargar productos"}
                                        </IonItem>
                                    ) : (
                                        productos.map((product, key) => (
                                            <motion.li
                                                key={key}
                                                className="px-3 py-2 flex items-center justify-between cursor-pointer rounded-md"
                                                variants={item}
                                                layout
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <IonList className="flex items-center gap-2 justify-between flex-1">
                                                    <IonItem
                                                        className="w-full flex items-center gap-2"
                                                        routerLink={`/products/${product.nombre}`}
                                                    >
                                                        {product.image && (
                                                            <img
                                                                src={product.image}
                                                                alt={product.nombre}
                                                                className="h-8 w-8 rounded-md object-cover md:block hidden"
                                                            />
                                                        )}
                                                        <section className="flex flex-col">
                                                            <IonLabel className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {product.nombre}
                                                            </IonLabel>
                                                            <span className="text-xs text-gray-400">{product.unidad}</span>
                                                        </section>
                                                    </IonItem>
                                                </IonList>
                                            </motion.li>
                                        ))
                                    )}
                                </motion.ul>

                                <div className="bottom-0 mt-2 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Resultados: {productos.length}</span>
                                        <span>ESC para cancelar</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default PriceChecker;
