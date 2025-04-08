

import type React from "react"
import { useState } from "react"
import { IonContent, IonPage } from "@ionic/react"
import { Store, Warehouse } from "lucide-react"
import PromoBanner from "./components/banner-offers"
import CategorySlider from "./components/categories"
import HeaderCart from "./components/header"
import ProductGrid from "./components/product/product-grid"
import { branches } from "./utils/branches"

const Page: React.FC = () => {
    // Array of branches with names and icons

    // State to store the selected branch
    const [selectedBranch, setSelectedBranch] = useState<(typeof branches)[0] | null>(null)

    // Function to handle branch selection
    const handleSelectBranch = (branch: (typeof branches)[0]) => {
        setSelectedBranch(branch)
    }

    // Function to change branch
    const changeBranch = () => {
        setSelectedBranch(null)
    }

    return (
        <IonPage>
            <HeaderCart />
            <IonContent fullscreen>
                <div className="bg-purple-100 p-3 flex items-center justify-between">
                    {selectedBranch && (
                        <div className="flex items-center">
                            <selectedBranch.icon className="h-5 w-5 text-purple-700 mr-2" />
                            <span className="text-sm font-medium text-purple-800">Sucursal: {selectedBranch.name}</span>
                        </div>)}
                    <button onClick={changeBranch} className="text-xs text-purple-700 underline">
                        Cambiar
                    </button>
                </div>

                <CategorySlider />

                <PromoBanner />{/* Componente ocultable */}

                <ProductGrid />
            </IonContent>
        </IonPage >
    )
}

export default Page;

