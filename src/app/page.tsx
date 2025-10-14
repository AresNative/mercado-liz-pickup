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
} from "lucide-react";

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
                    <IonTitle
                        size="large"
                        className="text-white text-5xl p-2 font-medium h-full">
                        Liz
                    </IonTitle>
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