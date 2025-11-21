import { PageProps } from "@/utils/types/page";
import { IonButton, IonContent, IonFab, IonFabButton, IonHeader, IonToolbar } from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";
import { useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import Card from "./components/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/functions/cn";
import { useHistory } from "react-router";
import { formatValue } from '@/utils/constants/format-values';


/* 
 @example: https://v0.app/chat/supermarket-app-design-vZOCJkxnwdg
 * Al dar click en "Agendar" redireccionar a 'checkout'
 * En 'checkout' maquetar calendario, formulario y "metodo de pago"
 ! si "metodo de pago" es nulo se tomara como "cobro en efectivo"
 * aun asi añadir opcion "cobro en efectivo"
*/
const Carrito: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    const cart = useAppSelector((state: RootState) => state.cart);
    const { items = [] } = cart || {}; // Mejor manejo del estado inicial
    const history = useHistory();
    const total = items.reduce((sum, item) => {
        return sum + ((item.descuento ? item.descuento : item.precio) * item.quantity);
    }, 0)
    const serv = total * 0.05; //->calculo del 5% de servicio
    const totalConServicio = total + serv; //-> total mas servicio
    return (
        <IonContent
            role="feed"
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 20;
                onScroll?.(isScrolled);
            }}>
            <IonHeader
                collapse="condense"
                className="custom-toolbar h-fit absolute -top-0"
            >
                <IonToolbar>
                    <a className='decoration-none cursor-pointer' href='/productos'>
                        <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                    </a>
                </IonToolbar>
            </IonHeader>
            <section className="flex flex-col mt-4 relative md:flex-row-reverse px-4 max-w-6xl w-full h-fit mx-auto mb-20 md:mb-0 gap-2">
                <article className={cn(onScroll ? "backdrop-blur-sm bg-white/70" : " bg-white", "sticky top-2 mb-5 z-50 h-fit w-full md:w-2/3 border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md justify-between")}>
                    <label className="text-lg font-bold">Resumen del pedido</label>
                    <div className="mt-10">
                        <p className="flex justify-between"><span className="text-gray-500">Subtotal</span> {total > 0 && (formatValue(total, "currency"))}</p>
                        <p className="flex justify-between"><span className="text-gray-500">Tarifa de servicio</span>{formatValue(serv, "currency")}</p>
                        <section className="mx-auto border-t border-gray-200">
                            <p className="flex mt-5 justify-between font-semibold"><span>Total</span> {formatValue(totalConServicio, "currency")}</p>
                        </section>
                        <IonButton
                            disabled={items.length === 0}
                            expand="block"
                            shape="round"
                            size="default"
                            className="custom-tertiary mt-5"
                            onClick={() => history.push("/checkout")}
                        >
                            Agendar
                        </IonButton>
                    </div>
                </article>

                <ul className="flex flex-col gap-4 w-full">
                    {items.map((row: any, key: any) => <Card key={key} producto={row} />)}
                </ul>
            </section>
            <IonFab vertical="bottom" horizontal="start" slot="fixed">
                <IonFabButton className="custom-tertiary md:mb-0 mb-12" size="small">
                    <ChevronDown />
                </IonFabButton>
            </IonFab>
        </IonContent>
    );
}

export default Carrito;