import type React from "react"
import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { useHistory } from "react-router-dom"
import { IonContent, IonPage } from "@ionic/react"
import PromoBanner, { PromoItem } from "./components/banner-offers"
import CategorySlider from "./components/categories"
import HeaderCart from "./components/header"
import ProductGrid from "./components/product/product-grid"
import { branches } from "./utils/branches"
import { useAppSelector } from "@/hooks/selector"
import { clearAll } from "@/hooks/slices/app"
import { clearCart } from "@/hooks/slices/cart"
import { getLocalStorageItem, removeFromLocalStorage } from "@/utils/functions/local-storage"

const Page: React.FC = () => {
    const dispatch = useDispatch()
    const history = useHistory()
    const sucursal = getLocalStorageItem("sucursal") ?? useAppSelector((state: any) => state.app.sucursal)

    // Estado local sincronizado con Redux
    const [selectedBranch, setSelectedBranch] = useState<(typeof branches)[0] | null>(
        () => branches.find(b => b.id === sucursal?.id) || null
    )

    // Sincronizar cuando cambie la sucursal en Redux
    useEffect(() => {
        if (sucursal) {
            const branch = branches.find(b => b.id === sucursal.id)
            setSelectedBranch(branch || null)
        }
    }, [sucursal])

    // Cambiar sucursal
    const changeBranch = async () => {
        await removeFromLocalStorage("sucursal") // Limpiar localStorage
        dispatch(clearAll()) // Limpiar Redux
        dispatch(clearCart()) // Limpiar Redux
        history.push('/layout') // Redirigir a selección
    }

    const promoItems: PromoItem[] = [
        {
            id: "default",
            type: "default",
            title: "Ofertas Especiales",
            description: "Ten el 20% de descuento en tu primer pedido!",
            buttonText: "Compra Ahora",
            discount: "20%",
            bgColor: "bg-gradient-to-r from-[#A855F7] to-[#37065f]",
            textColor: "text-white",
            buttonColor: "bg-white",
            buttonTextColor: "text-[#A855F7]",
        },
        {
            id: "app-info",
            type: "app",
            title: "Nueva Funcionalidad",
            description: "Ahora puedes hacer seguimiento de tus pedidos en tiempo real",
            buttonText: "Explorar",
            image: "/placeholder.svg?height=100&width=100",
            bgColor: "bg-gradient-to-r from-[#3B82F6] to-[#1E3A8A]",
            textColor: "text-white",
            buttonColor: "bg-white",
            buttonTextColor: "text-[#3B82F6]",
        },
        {
            id: "product",
            type: "product",
            title: "Producto Destacado",
            description: "Nuestro producto más vendido con un 15% de descuento",
            buttonText: "Ver Detalles",
            discount: "15%",
            image: "/placeholder.svg?height=100&width=100",
            bgColor: "bg-gradient-to-r from-[#10B981] to-[#065F46]",
            textColor: "text-white",
            buttonColor: "bg-white",
            buttonTextColor: "text-[#10B981]",
        },
        {
            id: "combo",
            type: "combo",
            title: "Combo Especial",
            description: "Lleva 3 productos y paga solo 2",
            buttonText: "Ver Combo",
            discount: "3x2",
            bgColor: "bg-gradient-to-r from-[#F59E0B] to-[#B45309]",
            textColor: "text-white",
            buttonColor: "bg-white",
            buttonTextColor: "text-[#F59E0B]",
        },
    ]
    return (
        <IonPage>
            <HeaderCart />
            <IonContent fullscreen>
                <div className="bg-purple-100 p-3 flex items-center justify-between">
                    {selectedBranch && (
                        <div className="flex items-center">
                            <selectedBranch.icon className="h-5 w-5 text-purple-700 mr-2" />
                            <span className="text-sm font-medium text-purple-800">
                                Sucursal: {selectedBranch.name}
                            </span>
                        </div>
                    )}
                    <button onClick={changeBranch} className="text-xs text-purple-700 underline">
                        Cambiar
                    </button>
                </div>

                <CategorySlider />
                <PromoBanner items={promoItems} autoPlay={true} interval={3000} showControls={true} showIndicators={true} />
                <ProductGrid />
            </IonContent>
        </IonPage>
    )
}

export default Page