import type React from "react"
import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { useHistory } from "react-router-dom"
import { IonContent, IonPage } from "@ionic/react"
import PromoBanner from "./components/banner-offers"
import CategorySlider from "./components/categories"
import HeaderCart from "./components/header"
import ProductGrid from "./components/product/product-grid"
import { branches } from "./utils/branches"
import { useAppSelector } from "@/hooks/selector"
import { clearAll, setSucursal } from "@/hooks/slices/app"

const Page: React.FC = () => {
    const dispatch = useDispatch()
    const history = useHistory()
    const sucursal = useAppSelector((state: any) => state.app.sucursal)

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
    const changeBranch = () => {
        dispatch(clearAll()) // Limpiar Redux
        history.push('/layout') // Redirigir a selección
    }

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
                <PromoBanner />
                <ProductGrid />
            </IonContent>
        </IonPage>
    )
}

export default Page