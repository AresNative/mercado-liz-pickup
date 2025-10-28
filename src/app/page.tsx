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

// Tipo para la respuesta de la API
interface ApiResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

const Landing: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    const [getData, { isLoading }] = useGetWithFiltersGeneralInIntelisisMutation();
    const [products, setproducts] = useState<Producto[]>([])

    useEffect(() => {
        LoadOffers()
    }, [getData])

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
                    LEFT JOIN Oferta AS ofr On ofr.Articulo = art.Articulo and ofr.FechaD < GETDATE()
                    and ofr.FechaA > GETDATE()
                    LEFT JOIN OfertaD AS ofrd On ofrd.Articulo = art.Articulo and ofrd.Unidad = cb.Unidad
                `,
                pageSize: 10,
                page: 1,
                filtros: {
                    "Filtros": [
                        { "key": "ofrd.Precio", "Operator": ">", "Value": "0" }
                    ],
                    "Selects": [
                        { "key": "cb.Codigo" },
                        { "key": "cb.Cuenta" },
                        { "key": "art.Grupo" },
                        { "key": "art.Descripcion1" },
                        { "key": "lpu.Unidad" },
                        { "key": "lpu.Precio" },
                        { "key": "ofrd.Precio", "alias": "Descuento" },
                        { "key": "au.Unidad", "alias": "UnidadFactor" },
                        { "key": "au.Factor" }
                    ],
                    "Agregaciones": [
                        {
                            "Key": "ad.DispMenosApartado",
                            "Operation": "SUM",
                            "Alias": "Cantidad"
                        }
                    ],
                    "Order": [
                        {
                            "Key": "cb.Codigo",
                            "Direction": "DESC"
                        }
                    ]
                },
                signal: undefined,
            });
            if ('data' in result && result.data) {
                const apiData: ApiResponse = result.data;

                if (apiData.data && apiData.data.length > 0) {
                    // Mapear los datos de la API al formato de Producto
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
            return { data: [] }
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
                className="custom-toolbar z-50 -top-16"
            >
                <IonToolbar>

                    <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                </IonToolbar>
            </IonHeader>
            {/* Hero Section */}
            <header className="text-purple-800 dark:text-purple-200 bg-no-repeat bg-center relative">
                <section className="max-w-6xl py-5 md:py-10 px-4 mx-auto flex flex-col gap-6">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">Compra tus productos frescos online</h1>
                    <p className="text-xl text-gray-400 md:text-2xl mb-8 max-w-3xl">
                        Selecciona tus productos favoritos, elige tu horario de recogida y recoge tu pedido sin esperas.
                    </p>
                    <ul className="flex flex-col sm:flex-row relative gap-4 z-10 items-center text-center ">
                        <a href="https://mercadosliz.com" className="bg-white cursor-pointer text-purple-500 hover:bg-purple-200 px-4 py-3 rounded-md font-semibold transition-all duration-300 transform hover:scale-105">
                            Conocer más
                        </a>
                        <a href="/productos" className="flex gap-2 bg-purple-500 cursor-pointer text-white hover:bg-purple-200 hover:text-purple-500 px-4 py-2 rounded-md font-semibold transition-all duration-300">
                            Explorar Productos <MoveRight />
                        </a>
                    </ul>
                </section>
            </header>
            <article className="py-16 px-4 max-w-6xl mx-auto">
                <label className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">Productos más vendidos</h2>
                    <p className="text-gray-600 dark:text-gray-100 max-w-2xl mx-auto">
                        Explora nuestra selección de productos más populares, cuidadosamente elegidos por nuestros clientes.
                    </p>
                </label>
                <BentoGrid cols={2}>
                    <BentoItem
                        title="Frutas frescas"
                        description="Disfruta de una variedad de frutas frescas y jugosas, perfectas para cualquier ocasión."
                        icon={<Apple className="size-6 text-red-600" />}
                        className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                    />
                    <BentoItem
                        title="Verduras orgánicas"
                        description="Nuestras verduras orgánicas son cultivadas sin pesticidas, garantizando frescura y sabor."
                        icon={<Wheat className="size-6 text-green-600" />}
                        className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                    />
                    <BentoItem
                        title="Lácteos naturales"
                        description="Encuentra una selección de productos lácteos naturales, desde leche hasta yogures y quesos."
                        icon={<Milk className="size-6 text-blue-600" />}
                        className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                    />
                    <BentoItem
                        title="Panadería artesanal"
                        description="Deléitate con nuestro pan artesanal, horneado diariamente para garantizar frescura."
                        icon={<Croissant className="size-6 text-yellow-600" />}
                        className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
                    />
                </BentoGrid>
            </article>
            <ul className="px-4 flex flex-col gap-2 max-w-6xl mx-auto relative">
                <li className="flex justify-between items-center">
                    <label className="font-semibold text-3xl text-center">Ofertas</label>
                    <a className="flex items-center underline right-0 mt-5 text-purple-800 cursor-pointer hover:text-purple-950"> Explorar <ArrowRightIcon className="ml-1 h-4 w-4" /></a>
                </li>
                {/* Listado de porductos mas vendidos */}
                <li className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide">
                    {products && products.map((producto, index) => (
                        <Card
                            key={`${producto.id}-${index}`}
                            producto={producto}
                        />
                    ))}
                </li>
            </ul>
            {/* Benefits Section */}
            <section className="pt-16 px-4 max-w-6xl mx-auto mb-36">
                <label className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">Beneficios Clave</h2>
                    <p className="text-gray-600 dark:text-gray-100 max-w-2xl mx-auto">
                        Descubre cómo nuestro sistema puede transformar tu estilo de vida y optimizar tus operaciones diarias.
                    </p>
                </label>
                <BentoGrid cols={2}>
                    <BentoItem
                        title="Eficiencia de Compras"
                        description="Ahorra tiempo realizando todas tus compras en un solo lugar con nuestra plataforma fácil de usar."
                        icon={<Zap className="size-6 text-blue-600" />}
                        className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                    />

                    <BentoItem
                        title="Tiempo Real"
                        description="Monitorea el estado de tus pedidos y recibe actualizaciones instantáneas sobre su progreso."
                        icon={<Clock className="size-6 text-purple-600" />}
                        className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800"
                    />
                    <BentoItem
                        title="Seguridad de Datos"
                        description="Tus datos están protegidos con las últimas tecnologías de seguridad y encriptación."
                        icon={<Lock className="size-6 text-indigo-600" />}
                        className="bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800"
                    />
                    <BentoItem
                        title="Ahorro de Costos"
                        description="Disfruta de precios competitivos y ofertas exclusivas que te ayudarán a ahorrar en cada compra."
                        icon={<DollarSign className="size-6 text-green-600" />}
                        className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                    />
                </BentoGrid>
            </section >
            <Footer />
        </IonContent>
    );
}

export default Landing;