import type React from "react"
import { SwitchToggle } from "@/components/switch-mode"
import { IonBackButton, IonButtons, IonContent, IonHeader, IonItem, IonList, IonPopover } from "@ionic/react"
import { AlignLeft } from "lucide-react"
import PriceChecker from "./price-checker"

interface HeaderCartProps {
    back?: boolean
}

const HeaderCart: React.FC<HeaderCartProps> = (prosp) => {
    const { back } = prosp

    return (
        <IonHeader className="bg-white/90 backdrop-blur-sm border dark:border-zinc-700 dark:bg-zinc-950/90 ion-padding-horizontal safe-area-top">
            <div className="h-[60px] md:h-[70px] w-full flex items-center">
                {back && (
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/products" className="text-purple-800" />
                    </IonButtons>)}
                <ul className="relative container mx-auto flex items-center w-full px-2">

                    {/* Input centrado */}
                    <li className="flex-grow relative z-50 mx-2">
                        <PriceChecker />
                    </li>

                    {/* Switch a la derecha */}
                    <li className="flex-shrink-0">
                        <button
                            id="trigger-button"
                            className="bg-purple-800 text-white rounded-md min-h-[40px] min-w-[40px] flex items-center justify-center"
                        >
                            <AlignLeft className="h-5 w-5" />
                        </button>
                        <IonPopover trigger="trigger-button">
                            <IonContent>
                                <IonList>
                                    <IonItem href="/products" className="flex items-center gap-2">
                                        <span className="text-sm">Mi carrito</span>
                                    </IonItem>
                                    <IonItem className="container mx-auto flex items-center justify-between">
                                        <span className="flex-shrink-0">Tema:</span>
                                        <section className="flex-grow max-w-xl mx-4 relative">
                                            <SwitchToggle />
                                        </section>
                                    </IonItem>
                                </IonList>
                            </IonContent>
                        </IonPopover>
                    </li>
                </ul>
            </div>
        </IonHeader>
    )
}

export default HeaderCart

