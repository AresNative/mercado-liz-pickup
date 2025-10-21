// app/page.jsx
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Footer from "@/template/footer";
import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonTitle, IonToolbar } from "@ionic/react";
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
} from "lucide-react";
import Card from "./productos/components/card";
import { IconLiz } from "./productos/components/ionc-liz";

const Landing: React.FC<PageProps> = ({ onScroll }: PageProps) => {
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
                <section className="max-w-6xl py-16 px-4 mx-auto flex flex-col gap-6">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">Compra tus productos frescos online</h1>
                    <p className="text-xl text-gray-400 md:text-2xl mb-8 max-w-3xl">
                        Selecciona tus productos favoritos, elige tu horario de recogida y recoge tu pedido sin esperas.
                    </p>
                    <ul className="flex flex-col sm:flex-row relative gap-4 z-10 items-center text-center ">
                        <button className="bg-white cursor-pointer text-purple-500 hover:bg-purple-200 px-4 py-3 rounded-md font-semibold transition-all duration-300 transform hover:scale-105">
                            Explorar Productos
                        </button>
                        <a href="https://mercadosliz.com" className="bg-purple-500 cursor-pointer text-white hover:bg-purple-200 hover:text-purple-500 px-4 py-2 rounded-md font-semibold transition-all duration-300">
                            Conocer más
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
            <ul className="py-16 px-4 max-w-6xl mx-auto relative">
                {/* Listado de porductos mas vendidos */}
                <li className="flex gap-3 overflow-x-scroll scrollbar-hide max-w-6xl mx-auto md:px-0 lg:px-0 px-6 pb-4">
                    {Array.from({ length: 23 }).map((_, index) => (
                        <Card
                            key={index}
                            producto={{
                                id: 'string',
                                nombre: "test",
                                categoria: "test",
                                unidad: "test",
                                precio: 1.50,
                                cantidad: 20,
                                descuento: 10,
                            }} />
                    ))}
                </li>
                <a className="flex items-center underline absolute right-0 mt-5 text-purple-800 cursor-pointer hover:text-purple-950"> Explorar <ArrowRightIcon className="ml-1 h-4 w-4" /></a>
            </ul>
            {/* Benefits Section */}
            <section className="py-16 px-4 max-w-6xl mx-auto mb-36">
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