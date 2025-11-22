// app/page.jsx
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Footer from "@/template/footer";
import { PageProps, Producto } from "@/utils/types/page";
import { IonContent, IonHeader, IonToolbar } from "@ionic/react";
import {
    Lock,
    Zap,
    Clock,
    DollarSign,
    ArrowRightIcon,
    Milk,
    Apple,
    Croissant,
    Wheat,
    MoveRight,
} from "lucide-react";
import Card from "./productos/components/card";
import { IconLiz } from "./productos/components/ionc-liz";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import { useEffect, useState } from "react";
import { cn } from "@/utils/functions/cn";

interface ApiResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

const Landing: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    const [getData, { isLoading }] = useGetWithFiltersGeneralInIntelisisMutation();
    const [products, setproducts] = useState<Producto[]>([]);

    useEffect(() => {
        LoadOffers();
    }, [getData]);

    async function LoadOffers() {
        try {
            const result = await getData({
                table: `
                CB AS cb
                    INNER JOIN Art AS art
                        ON cb.Cuenta = art.Articulo
                    INNER JOIN ListaPreciosDUnidad AS lpu
                        ON art.Articulo = lpu.Articulo
                        AND cb.Unidad = lpu.Unidad
                        AND lpu.Lista = '(Precio Lista)'
                    INNER JOIN ArtUnidad AS au
                        ON art.Articulo = au.Articulo
                        AND lpu.Unidad = au.Unidad
                    INNER JOIN ArtDisponible AS ad On Almacen = 'ALMMAYO' and art.Articulo = ad.Articulo
                    INNER JOIN (
                                    SELECT *,
                                        ROW_NUMBER() OVER (PARTITION BY Articulo, Unidad ORDER BY id DESC) AS rn
                                    FROM OfertaD
                                ) AS ofrd On ofrd.Articulo = art.Articulo and ofrd.Unidad = cb.Unidad AND ofrd.rn = 1
                    LEFT JOIN Oferta AS ofr On ofr.Articulo = art.Articulo and ofr.FechaD < GETDATE() and ofr.FechaA > GETDATE()
                `,
                pageSize: 10,
                page: 1,
                filtros: {
                    Filtros: [{ key: "ofrd.Precio", Operator: ">", Value: "0" }],
                    Selects: [
                        { key: "cb.Codigo" },
                        { key: "cb.Cuenta" },
                        { key: "art.Grupo" },
                        { key: "art.Descripcion1" },
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
                    Order: [{ Key: "cb.Codigo", Direction: "DESC" }],
                },
                signal: undefined,
            });

            if ("data" in result && result.data) {
                const apiData: ApiResponse = result.data;

                if (apiData.data && apiData.data.length > 0) {
                    const mappedItems: Producto[] = apiData.data.map((item: any) => ({
                        id: item.Codigo || `item-${Date.now()}-${Math.random()}`,
                        nombre: item.Descripcion1 || "Sin nombre",
                        categoria: item.Grupo || "Sin categoría",
                        unidad: item.Unidad || "Unidad",
                        precio: item.Precio || 0,
                        cantidad: item.Factor || 1,
                        descuento: item.Descuento || 0,
                    }));

                    setproducts(mappedItems);
                }
            }
        } catch {
            return { data: [] };
        }
    }

    return (
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 20;
                onScroll?.(isScrolled);
            }}
        >
            <IonHeader
                collapse="condense"
                className="custom-toolbar h-fit absolute -top-0"
            >
                <IonToolbar>
                    <a className="cursor-pointer" href="/productos">
                        <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                    </a>
                </IonToolbar>
            </IonHeader>
            {/* SELECCIÓN DE SUCURSAL */}
            <section className="max-w-6xl mx-auto px-4 mb-10">
                <h3 className="font-bold text-center mb-6 dark:text-white">
                    Selecciona tu sucursal
                </h3>

                <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
                    Elige tu sucursal preferida para ver productos con disponibilidad real.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { id: "mayoreo", name: "Mayoreo" },
                        { id: "guadalupe", name: "Valle de Guadalupe" },
                        { id: "palmas", name: "Palmas" },
                        { id: "testerazo", name: "Testerazo" },
                    ].map((s, index) => (
                        <label
                            key={s.id}
                            className={cn(`
                                    flex items-center gap-3 p-4 rounded-xl
                                    border 
                                `,
                                index === 0 && `
                                    border-purple-300 dark:border-purple-700
                                    bg-white dark:bg-purple-950
                                    hover:bg-purple-50
                                    dark:hover:bg-purple-900
                                    transition-all
                                    shadow-sm
                                    hover:shadow-md
                                     cursor-pointer
                                `)}
                        >
                            <input
                                type="radio"
                                name="sucursal"
                                value={s.id}
                                defaultChecked={index === 0}  // SOLO LA PRIMERA ACTIVADA
                                disabled={index !== 0} // SOLO LA PRIMERA HABILITADA
                                className="w-5 h-5 text-purple-600 accent-purple-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <span className={cn(index === 0 ? "font-semibold " : "disabled:font-light", "text-gray-700 dark:text-gray-200")}>
                                {s.name}
                            </span>
                        </label>
                    ))}
                </div>
            </section>

            {/* HERO NUEVO */}
            <header className="relative text-purple-800 dark:text-purple-200 bg-gradient-to-b my-12">
                <section className="max-w-6xl py-10 md:py-20 px-4 mx-auto flex flex-col gap-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                        Compra fresco, rápido y al mejor precio
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-300 max-w-2xl">
                        Productos seleccionados, ofertas activas y recogida sin filas.
                        Fácil, rápido y al instante.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <a
                            href="/productos"
                            className="flex gap-3 items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-4 rounded-xl text-lg shadow-md shadow-purple-300/30 transition-all hover:scale-105"
                        >
                            Explorar Productos
                            <MoveRight />
                        </a>

                        <a
                            href="https://mercadosliz.com"
                            className="bg-white dark:bg-purple-950 border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-100 px-6 py-4 rounded-xl font-semibold transition-all"
                        >
                            Conocer más
                        </a>
                    </div>
                </section>
            </header>

            {/* MÁS VENDIDOS */}
            <article className="py-16 px-4 max-w-6xl mx-auto">
                <label className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold dark:text-white">
                        Productos más vendidos 🔥
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mt-2">
                        Esta semana nuestros clientes están eligiendo estos productos.
                        ¡No te quedes sin los tuyos!
                    </p>

                    <a
                        href="/productos"
                        className="inline-flex gap-2 items-center mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all hover:scale-105"
                    >
                        Ver todo el catálogo <MoveRight />
                    </a>
                </label>

                <BentoGrid cols={2}>
                    <BentoItem
                        title="Frutas frescas"
                        description="Jugosas y recién seleccionadas, perfectas para cada día."
                        icon={<Apple className="size-6 text-red-600" />}
                        className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                    />
                    <BentoItem
                        title="Verduras orgánicas"
                        description="Cultivo limpio y natural, sin pesticidas."
                        icon={<Wheat className="size-6 text-green-600" />}
                        className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                    />
                    <BentoItem
                        title="Lácteos naturales"
                        description="Frescos, nutritivos y de productores confiables."
                        icon={<Milk className="size-6 text-blue-600" />}
                        className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                    />
                    <BentoItem
                        title="Panadería artesanal"
                        description="Horneado diario, irresistible y recién hecho."
                        icon={<Croissant className="size-6 text-yellow-600" />}
                        className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
                    />
                </BentoGrid>
            </article>

            {/* OFERTAS */}
            <ul className="px-4 flex flex-col gap-2 max-w-6xl mx-auto relative">
                <li className="flex justify-between items-center">
                    <label className="font-semibold text-3xl text-center">
                        Ofertas
                    </label>

                    <a
                        href="/productos"
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition"
                    >
                        Ver todas las ofertas
                        <ArrowRightIcon className="h-4 w-4" />
                    </a>
                </li>

                <li className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide">
                    {products &&
                        products.map((producto, index) => (
                            <Card
                                key={`${producto.id}-${index}`}
                                producto={producto}
                            />
                        ))}
                </li>
            </ul>

            {/* BENEFICIOS */}
            <section className="pt-16 px-4 max-w-6xl mx-auto mb-36">
                <label className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold dark:text-white">
                        Beneficios Clave
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Descubre cómo hacer tus compras más fácil, rápido y económico.
                    </p>
                </label>

                <BentoGrid cols={2}>
                    <BentoItem
                        title="Eficiencia de Compras"
                        description="Haz todo tu pedido en un solo lugar."
                        icon={<Zap className="size-6 text-blue-600" />}
                        className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                    />
                    <BentoItem
                        title="Tiempo Real"
                        description="Actualizaciones instantáneas del estado de tu pedido."
                        icon={<Clock className="size-6 text-purple-600" />}
                        className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800"
                    />
                    <BentoItem
                        title="Seguridad de Datos"
                        description="Protección avanzada para tu información."
                        icon={<Lock className="size-6 text-indigo-600" />}
                        className="bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800"
                    />
                    <BentoItem
                        title="Ahorro de Costos"
                        description="Ofertas exclusivas y precios competitivos."
                        icon={<DollarSign className="size-6 text-green-600" />}
                        className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                    />
                </BentoGrid>
            </section>

            {/* BANNER DE CONVERSIÓN EXTRA */}
            <section className="max-w-6xl mx-auto my-24 px-4">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white py-10 px-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-3xl font-bold">
                            ¿Listo para hacer tu pedido?
                        </h3>
                        <p className="text-white/90 mt-2 text-lg">
                            Explora más de 2,000 productos disponibles hoy mismo.
                        </p>
                    </div>

                    <a
                        href="/productos"
                        className="bg-white text-purple-600 px-6 py-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                    >
                        Comprar ahora
                        <MoveRight />
                    </a>
                </div>
            </section>

            <Footer />
        </IonContent>
    );
};

export default Landing;
