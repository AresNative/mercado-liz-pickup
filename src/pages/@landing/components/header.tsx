import { SwitchToggle } from "@/components/switch-mode"
import { IonContent, IonHeader, IonItem, IonList, IonPopover, IonRouterLink } from "@ionic/react"
import { AlignLeft } from "lucide-react"
import PriceChecker from "./price-checker"

const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
    return (
        <input
            className={`bg-white w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-900 dark:text-gray-100 ${className}`}
            {...props}
        />
    )
}

const HeaderCart: React.FC = () => {
    return (
        <IonHeader className="bg-white dark:bg-zinc-950 flex items-center p-2 border-b border-gray-200 dark:border-gray-700">
            <nav className="container mx-auto flex items-center justify-between">
                {/* Logo a la izquierda */}
                <div className="flex-shrink-0">
                    <IonRouterLink href="/" className="flex items-center">
                        <div className="h-8 w-8 rounded-br-lg rounded-tl-lg bg-[#7C3AED] text-white flex items-center justify-center text-lg font-bold">
                            <span className='pl-2 pt-4'>ML</span>
                        </div>
                    </IonRouterLink>
                </div>

                {/* Input centrado */}
                <div className="flex-grow relative">
                    <PriceChecker />
                </div>

                {/* Switch a la derecha */}
                <div className="flex-shrink-0">
                    <button id="trigger-button" className="bg-[#7C3AED] rounded-md p-1"><AlignLeft /></button>
                    <IonPopover trigger="trigger-button">
                        <IonContent>
                            <IonList>
                                <IonItem href="/products" className="flex items-center gap-2">
                                    <span className="text-sm">Mi carrito</span>
                                </IonItem>
                                <IonItem>
                                </IonItem>
                                <IonItem>
                                </IonItem>
                                <IonItem>
                                </IonItem>
                                <IonItem className="container mx-auto flex items-center justify-between">
                                    <span className="flex-shrink-0">Tema:</span>
                                    <section className="flex-grow max-w-xl mx-4 relative"><SwitchToggle /></section>
                                </IonItem>
                            </IonList>
                        </IonContent>
                    </IonPopover>
                </div>
            </nav>
        </IonHeader>
    )
}

export default HeaderCart