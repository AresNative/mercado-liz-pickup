import type React from "react"
import { SwitchToggle } from "@/components/switch-mode"
import { IonBackButton, IonBadge, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonPopover } from "@ionic/react"
import { AlignLeft, FileClock, Cog, ShoppingCart, CreditCard } from "lucide-react"
import { useLocation } from 'react-router-dom'

import PriceChecker from "./price-checker"
import { useAppSelector } from "@/hooks/selector"
import { RootState } from "@/hooks/store"

interface HeaderCartProps {
    back?: boolean,
    carr?: boolean
}

const HeaderCart: React.FC<HeaderCartProps> = (prosp) => {
    const cart = useAppSelector((state: RootState) => state.cart);
    const { items } = cart || []; // Si cart es undefined/null, usamos array vacío
    const { back, carr } = prosp
    const location = useLocation()
    return (
        <IonHeader className="bg-white/90 backdrop-blur-sm border dark:border-zinc-700 dark:bg-zinc-950/90 ion-padding-horizontal safe-area-top">
            <div className="h-[60px] md:h-[70px] w-full flex items-center">
                {location.pathname === '/products' && (
                    <img src="/favicon.png" className="size-10 m-auto p-0 hidden md:block" />
                )}
                {back && (
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/products" className="text-purple-800" />
                    </IonButtons>)}
                <ul className="relative container mx-auto flex items-center w-full px-2">

                    {/* Input centrado */}
                    <li className="flex-grow relative z-50 mx-2">
                        <PriceChecker />
                    </li>
                    <li className="flex-shrink-0 important:bg-transparent">
                        {!carr && (<IonItem
                            lines="none"
                            routerLink="/carrito"
                            detail={false}  // <- Esta prop elimina el ícono de flecha
                            className="flex items-center text-purple-800 hover:text-purple-700 relative"
                        >
                            <IonLabel>
                                <ShoppingCart className="h-5 w-5" />
                            </IonLabel>
                            {items.length > 0 && (
                                <IonBadge
                                    color="success"
                                    className="absolute text-white -top-0 right-2 text-xs"
                                >
                                    {items.length}
                                </IonBadge>)}
                        </IonItem>)}
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
                                    <IonItem
                                        routerLink="/loading"
                                        routerDirection="none"
                                        className="flex items-center gap-2"
                                    >
                                        <FileClock className="h-5 w-5 mx-2" />
                                        <span className="text-sm">Pedidos</span>
                                    </IonItem>
                                    <IonItem
                                        routerLink="/carrito"
                                        routerDirection="none"
                                        className="flex items-center gap-2"
                                    >
                                        <Cog className="h-5 w-5 mx-2" />
                                        <span className="text-sm">Configuracion</span>
                                    </IonItem>
                                    <IonItem
                                        lines="none"
                                        routerLink="/carrito"
                                        routerDirection="none"
                                        className="flex items-center gap-2"
                                    >
                                        <CreditCard className="h-5 w-5 mx-2" />
                                        <span className="text-sm">Cartera</span>
                                    </IonItem>
                                    {/*  <IonItem className="container mx-auto flex items-center justify-between">
                                        <span className="flex-shrink-0">Tema:</span>
                                        <section className="flex-grow max-w-xl mx-4 relative">
                                            <SwitchToggle />
                                        </section>
                                    </IonItem> */}
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

