// app/page.jsx
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Footer from "@/template/footer";
import { PageProps, Producto } from "@/utils/types/page";
import { IonButton, IonContent, IonHeader, IonToolbar, isPlatform } from "@ionic/react";
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
    Star,
    Truck,
    Shield,
    Sparkles,
    ShoppingCart,
    Calendar,
    MapPin,
} from "lucide-react";
import Card from "./productos/components/card";
import { IconLiz } from "./productos/components/ionc-liz";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import { useEffect, useState } from "react";
import { cn } from "@/utils/functions/cn";
import { Sucursales } from "@/utils/data/sucursales";
import { setLocalStorageItem } from "@/utils/functions/local-storage";
import { setSucursal } from "@/hooks/slices/app";
import { useHistory } from "react-router";
import { useAppDispatch } from "@/hooks/selector";

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

    const dispatch = useAppDispatch()
    const history = useHistory()

    useEffect(() => {
        LoadOffers();
    }, [getData]);

    async function LoadOffers() {
        try {
            const result = await getData({
                //INNER JOIN CB AS cb ON art.Articulo = cb.Cuenta AND cb.Unidad = art.Unidad 
                table: `art INNER JOIN ListaPreciosDUnidad AS lpu ON art.Articulo = lpu.Articulo AND art.Unidad = lpu.Unidad AND lpu.Lista = '(Precio Lista)' AND lpu.Precio > 0 INNER JOIN ArtUnidad AS au ON art.Articulo = au.Articulo AND lpu.Unidad = au.Unidad INNER JOIN ArtDisponible AS ad on art.Articulo = ad.Articulo AND ad.DispMenosApartado > 0 AND ad.Almacen = 'ALMMAYO' AND (ad.DispMenosApartado / au.Factor) > 0 INNER JOIN Oferta AS ofr ON ofr.Estatus = 'VIGENTE' AND ofr.FechaD <= GETDATE() AND ofr.FechaA >= GETDATE() INNER JOIN OfertaD AS ofrd ON ofr.ID = ofrd.ID AND  ofrd.Articulo = art.Articulo AND ofrd.Unidad = art.Unidad  AND ofrd.Sucursal = '4'  AND ofrd.Precio > 0`,
                pageSize: 10,
                page: 1,
                filtros: {
                    Filtros: [],
                    Selects: [
                        { Key: "art.Articulo" },
                        { Key: "art.Grupo" },
                        { Key: "art.Descripcion1" },
                        { Key: "lpu.Unidad" },
                        { Key: "art.Impuesto1" },
                        { Key: "art.Impuesto2" },
                        { Key: "art.TipoImpuesto1" },
                        { Key: "art.TipoImpuesto2" },
                        { Key: "lpu.Precio" },
                        { Key: "ofrd.Precio", alias: "Descuento" },
                        { Key: "ofrd.Porcentaje" },
                        { Key: "art.Unidad", alias: "UnidadFactor" },
                        { Key: "art.Factor" },
                    ],
                    Agregaciones: [
                        {
                            Key: "ad.DispMenosApartado",
                            Operation: "SUM",
                            Alias: "Cantidad",
                        },
                    ],
                    Order: [{ Key: "Descripcion1", Direction: "DESC" }],
                },
                signal: undefined,
            });

            if ("data" in result && result.data) {
                const apiData: ApiResponse = result.data;

                if (apiData.data && apiData.data.length > 0) {
                    const mappedItems: Producto[] = apiData.data.map((item: any) => ({
                        id: item.Articulo + "-" + item.Unidad + "-" + item.Factor,
                        /* codigo: item.Codigo || "0000", */
                        articulo: item.Articulo || "Articulo",
                        nombre: item.Descripcion1 || "Sin nombre",
                        categoria: item.Grupo || "Sin categoría",
                        unidad: item.Unidad || "Unidad",
                        precio: item.Precio || 0,
                        cantidad: item.Cantidad || 1,
                        factor: item.Factor || 1,
                        impuesto1: item.Impuesto1 || 0,
                        impuesto2: item.Impuesto2 || 0,
                        tipoImpuesto1: item.TipoImpuesto1 || 0,
                        tipoImpuesto2: item.TipoImpuesto2 || 0,
                        descuento: item.Descuento || 0,
                    }));

                    setproducts(mappedItems);
                }
            }
        } catch {
            return { data: [] };
        }
    }

    // Datos de características principales
    const features = [
        {
            icon: <ShoppingCart className="size-6" />,
            title: "Compra Rápida",
            description: "Encuentra y compra en menos de 5 minutos"
        },
        {
            icon: <Truck className="size-6" />,
            title: "Recoge Sin Filas",
            description: "Tu pedido listo para llevar al instante"
        },
        {
            icon: <DollarSign className="size-6" />,
            title: "Mejor Precio",
            description: "Ofertas exclusivas y precios competitivos"
        },
        {
            icon: <Shield className="size-6" />,
            title: "Pago Seguro",
            description: "Transacciones 100% protegidas"
        }
    ];
    const handleSelectBranch = async (branch: (typeof Sucursales)[0]) => {
        let branchData = {
            id: branch.id,
            name: branch.name,
            address: branch.address,
            precio: branch.precio
        };
        await setLocalStorageItem("sucursal", branchData);
        dispatch(setSucursal(branchData));
        history.push("/productos");
    };

    return (
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 20;
                onScroll?.(isScrolled);
            }}
        >

            {/* HERO PRINCIPAL MEJORADO */}
            <section className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white py-10 ">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <div className="flex justify-center">
                        <div className="bg-white/10 my-6 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-sm">
                            <Sparkles className="size-4" />
                            <span>+2,000 productos frescos disponibles</span>
                        </div>
                    </div>

                    <span className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                        Tu mercado
                        <span className="block text-yellow-300">fresco y rápido</span>
                    </span>

                    <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
                        Productos seleccionados, ofertas activas y recogida sin filas.
                        <span className="font-semibold"> Fácil, rápido y al instante.</span>
                    </p>

                    {/* Características rápidas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 max-w-2xl mx-auto">
                        {features.map((feature, index) => (
                            <div key={index} className="text-center">
                                <div className="rounded-full p-3 inline-flex mb-2">
                                    {feature.icon}
                                </div>
                                <p className="text-sm font-medium">{feature.title}</p>
                            </div>
                        ))}
                    </div>

                    {/* CTA Principal Mejorado */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <IonButton
                            fill="clear"
                            expand="full"
                            routerLink="/productos"
                            routerDirection="none"
                            className="group bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold px-8 py-1 rounded-2xl text-lg shadow-2xl shadow-yellow-500/25 transition-all hover:scale-105  min-w-[200px] justify-center"
                        >
                            <section className="group flex items-center gap-2 transition-all">
                                <ShoppingCart className="size-5" />
                                Comprar Ahora
                                <MoveRight className="size-5 group-hover:translate-x-1 transition-transform" />
                            </section>
                        </IonButton>

                        <IonButton
                            fill="clear"
                            routerLink="/ofertas"
                            routerDirection="none"
                            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-1 rounded-2xl backdrop-blur-sm transition-all border border-white/20 hover:border-white/30 flex items-center gap-2"
                        >
                            <Star className="size-5" />
                            Ver Ofertas
                        </IonButton>
                    </div>
                </div>
            </section>

            {/* SELECCIÓN DE SUCURSAL MEJORADA */}
            <section className="max-w-6xl mx-auto px-4 my-10">
                <div className="text-center mb-8">
                    <span className="font-bold text-2xl md:text-3xl dark:text-white mb-3">
                        🏪 Elige Tu Sucursal
                    </span>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Selecciona donde quieres recoger tu pedido.
                        <span className="font-semibold text-green-600"> ¡Recogida sin filas garantizada!</span>
                    </p>
                </div>

                <div id="sucursales" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Sucursales.map((sucursal) => (
                        <button
                            key={sucursal.id}
                            onClick={() => handleSelectBranch(sucursal)}
                            disabled={sucursal.status !== "active"}
                            className={cn(`
                                    relative p-4 rounded-xl border-2 transition-all duration-300
                                    group cursor-pointer
                                `,
                                sucursal.status === "active"
                                    ? `
                                    border-green-300 dark:border-green-700
                                    bg-green-50 dark:bg-green-900/20
                                    hover:bg-green-100 dark:hover:bg-green-900/30
                                    hover:shadow-lg hover:scale-105
                                    ring-2 ring-green-200 dark:ring-green-800
                                `
                                    : `
                                    border-gray-200 dark:border-gray-700
                                    bg-gray-50 dark:bg-gray-800/50
                                    opacity-80 grayscale
                                    cursor-not-allowed
                                `
                            )}
                        >
                            {/* Badge de estado */}
                            <div className={cn(
                                "absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-semibold",
                                sucursal.status === "active"
                                    ? "bg-green-500 text-white shadow-lg"
                                    : "bg-gray-500 text-white"
                            )}>
                                {sucursal.badge}
                            </div>

                            {/* Contenido de la sucursal */}
                            <div className="text-center">
                                {/* Icono */}
                                <div className={cn(
                                    "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center",
                                    sucursal.status === "active"
                                        ? "bg-green-100 dark:bg-green-800"
                                        : "bg-gray-100 dark:bg-gray-700"
                                )}>
                                    {sucursal.status === "active" ? (
                                        <MapPin className={cn(
                                            "size-6",
                                            sucursal.status === "active"
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-gray-400"
                                        )} />
                                    ) : (
                                        <Clock className="size-5 text-gray-400" />
                                    )}
                                </div>

                                {/* Nombre */}
                                <h4 className={cn(
                                    "font-bold text-lg mb-2",
                                    sucursal.status === "active"
                                        ? "text-gray-800 dark:text-white"
                                        : "text-gray-500 dark:text-gray-400"
                                )}>
                                    {sucursal.name}
                                </h4>

                                {/* Descripción */}
                                <p className={cn(
                                    "text-sm mb-3",
                                    sucursal.status === "active"
                                        ? "text-green-600 dark:text-green-400 font-semibold"
                                        : "text-gray-400 dark:text-gray-500"
                                )}>
                                    {sucursal.description}
                                </p>

                                {/* Características */}
                                <ul className="space-y-1 mb-4">
                                    {sucursal.features.map((feature, idx) => (
                                        <li key={idx} className={cn(
                                            "text-xs",
                                            sucursal.status === "active"
                                                ? "text-gray-600 dark:text-gray-300"
                                                : "text-gray-400 dark:text-gray-500"
                                        )}>
                                            • {feature}
                                        </li>
                                    ))}
                                </ul>

                                {/* Radio Button solo para activa */}
                                {sucursal.status === "active" && (
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <input
                                            type="radio"
                                            name="sucursal"
                                            value={sucursal.id}
                                            defaultChecked
                                            className="w-4 h-4 text-green-600 accent-green-600 cursor-pointer"
                                        />
                                        <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                                            Seleccionada
                                        </span>
                                    </div>
                                )}

                                {/* Mensaje para próximamente */}
                                {sucursal.status === "coming" && (
                                    <div className="mt-2">
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                            Estamos trabajando para llegar pronto
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Efecto hover solo para activa */}
                            {sucursal.status === "active" && (
                                <div className="absolute inset-0 rounded-xl border-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Información adicional */}
                <div className="text-center mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                        <Sparkles className="size-5" />
                        <span className="font-semibold">Expansión en Progreso</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Estamos expandiéndonos para servirte mejor. Próximamente en más ubicaciones.
                    </p>
                </div>
            </section>

            {/* OFERTAS DESTACADAS */}
            <section id="ofertas" className="bg-gray-50 dark:bg-gray-900 py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center flex flex-col gap-2 mb-12">
                        <div className="inline-flex w-fit mx-auto items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                            <Star className="size-4" />
                            OFERTAS LIMITADAS
                        </div>
                        <span className="text-3xl md:text-4xl font-bold dark:text-white mb-4">
                            Descuentos Especiales
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
                            Productos seleccionados con descuentos exclusivos.
                            <span className="font-semibold text-red-500"> ¡Solo por tiempo limitado!</span>
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                                    <div className="bg-gray-300 dark:bg-gray-700 h-40 rounded-xl mb-4"></div>
                                    <div className="bg-gray-300 dark:bg-gray-700 h-4 rounded mb-2"></div>
                                    <div className="bg-gray-300 dark:bg-gray-700 h-4 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {products.slice(0, 4).map((producto, index) => (
                                    <Card
                                        key={`${producto.id}-${index}`}
                                        producto={producto}
                                    />
                                ))}
                            </div>

                            {products.length > 4 && (
                                <div className="text-center">
                                    <a
                                        href="/ofertas"
                                        className="inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 hover:shadow-lg"
                                    >
                                        <ShoppingCart className="size-5" />
                                        Ver Todas las Ofertas
                                        <MoveRight className="size-5" />
                                    </a>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* CATEGORÍAS DESTACADAS */}
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <span className="text-3xl md:text-4xl font-bold dark:text-white mb-4">
                        Explora por Categoría
                    </span>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Encuentra fácilmente lo que necesitas
                    </p>
                </div>

                <BentoGrid cols={2}>
                    <BentoItem
                        title="Frutas Frescas"
                        description="Jugosas y recién seleccionadas, perfectas para cada día."
                        icon={<Apple className="size-6 text-red-600" />}
                        className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 hover:shadow-lg transition-all cursor-pointer group"
                    />
                    <BentoItem
                        title="Verduras Orgánicas"
                        description="Cultivo limpio y natural, sin pesticidas."
                        icon={<Wheat className="size-6 text-green-600" />}
                        className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 hover:shadow-lg transition-all cursor-pointer group"
                    />
                    <BentoItem
                        title="Lácteos Naturales"
                        description="Frescos, nutritivos y de productores confiables."
                        icon={<Milk className="size-6 text-blue-600" />}
                        className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all cursor-pointer group"
                    />
                    <BentoItem
                        title="Panadería Artesanal"
                        description="Horneado diario, irresistible y recién hecho."
                        icon={<Croissant className="size-6 text-yellow-600" />}
                        className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all cursor-pointer group"
                    />
                </BentoGrid>
            </section>

            {/* CÓMO FUNCIONA - SIMPLIFICADO */}
            <section className="bg-purple-50 dark:bg-purple-900/20 py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <span className="text-3xl md:text-4xl font-bold dark:text-white mb-4">
                            Compra en 3 Pasos
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 text-lg">
                            Así de fácil es hacer tu pedido
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "1",
                                title: "Elige Productos",
                                description: "Selecciona entre +2,000 productos frescos",
                                icon: <ShoppingCart className="size-8" />
                            },
                            {
                                step: "2",
                                title: "Programa Recogida",
                                description: "Elige fecha y hora para recoger sin filas",
                                icon: <Calendar className="size-8" />
                            },
                            {
                                step: "3",
                                title: "Paga y Recoge",
                                description: "Pago seguro y recoge tu pedido al instante",
                                icon: <Truck className="size-8" />
                            }
                        ].map((item, index) => (
                            <div key={index} className="text-center bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-purple-100 dark:bg-purple-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-purple-600 dark:text-purple-400 font-bold text-xl">
                                        {item.step}
                                    </span>
                                </div>
                                <span className="font-bold text-lg mb-2 dark:text-white">{item.title}</span>
                                <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* BANNER FINAL DE CONVERSIÓN */}
            <section className="max-w-6xl mx-auto my-16 px-4">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12 px-8 rounded-3xl shadow-2xl text-center">
                    <span className="text-3xl md:text-4xl font-bold mb-4">
                        ¿Listo para comenzar?
                    </span>
                    <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto">
                        Únete a miles de clientes que ya compran de forma rápida y segura
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a
                            href="/productos"
                            className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 text-lg min-w-[200px] justify-center"
                        >
                            <ShoppingCart className="size-5" />
                            Comenzar a Comprar
                        </a>
                        {/* 
                        <div className="flex items-center gap-4 text-white/80">
                            <div className="flex items-center gap-1">
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            </div>
                            <span className="text-sm">4.9/5 (2,500+ reseñas)</span>
                        </div> */}
                    </div>
                </div>
            </section>

            <section className="md:mb-0 mb-12"><Footer /></section>
        </IonContent>
    );
};

export default Landing;