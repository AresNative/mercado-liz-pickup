

import type React from "react"
import { useState } from "react"
import { IonContent, IonPage, IonFooter, IonToolbar } from "@ionic/react"
import { Store, Warehouse, MapPin, Building, Info, Phone, Mail, Clock } from "lucide-react"
import PromoBanner from "./@landing/components/banner-offers"
import CategorySlider from "./@landing/components/categories"
import HeaderCart from "./@landing/components/header"
import ProductGrid from "./@landing/components/product/product-grid"

const Layout: React.FC = () => {
  // Array of branches with names and icons
  const branches = [
    { id: 1, name: "Mayoreo", icon: Warehouse, address: "Av. Principal #123" },
    { id: 2, name: "Liz", icon: Store, address: "Calle Comercial #456" },
    { id: 3, name: "Palmas", icon: Building, address: "Blvd. Las Palmas #789" },
    { id: 4, name: "Testerazo", icon: MapPin, address: "Plaza Central #101" },
  ]

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
      {selectedBranch ? (
        // Show main app content when branch is selected
        <>
          <HeaderCart />
          <IonContent fullscreen>
            <div className="bg-purple-100 p-3 flex items-center justify-between">
              <div className="flex items-center">
                <selectedBranch.icon className="h-5 w-5 text-purple-700 mr-2" />
                <span className="text-sm font-medium text-purple-800">Sucursal: {selectedBranch.name}</span>
              </div>
              <button onClick={changeBranch} className="text-xs text-purple-700 underline">
                Cambiar
              </button>
            </div>

            <CategorySlider />
            <PromoBanner />
            <ProductGrid />
          </IonContent>
        </>
      ) : (
        <>
          <IonContent fullscreen className="bg-gray-50 dark:bg-gray-900">
            <h1 className="text-xl font-bold mt-6 mb-4 text-center text-purple-700 dark:text-purple-400">
              Selecciona tu sucursal
            </h1>
            <ul className="list-inside flex flex-col gap-3 mx-4 mb-4">
              {branches.map((branch) => (
                <li
                  key={branch.id}
                  onClick={() => handleSelectBranch(branch)}
                  className="bg-white dark:bg-gray-800 cursor-pointer rounded-xl shadow-lg overflow-hidden border-l-4 border-[#A855F7] active:bg-gray-50 dark:active:bg-gray-700"
                >
                  <div className="flex items-center p-4">
                    <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-full mr-4">
                      <branch.icon className="h-6 w-6 text-[#A855F7] dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 dark:text-white">{branch.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{branch.address}</p>
                    </div>
                    <div className="text-[#A855F7] dark:text-purple-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mx-4 mb-6 bg-[#f2f2f7] dark:bg-gray-800 p-4">
              <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                Selecciona la sucursal más cercana para ver productos disponibles
              </p>
            </div>
          </IonContent>
          {/* App Information Footer */}
          <IonFooter>
            <IonToolbar className="bg-white dark:bg-gray-800 px-4 py-3">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center">
                  <Info className="h-4 w-4 mr-1" /> Información de la App
                </h3>

                <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-2 text-purple-600 dark:text-purple-400" />
                    <span>Horario de atención: Lun-Dom 8:00 AM - 10:00 PM</span>
                  </div>

                  <div className="flex items-center">
                    <Phone className="h-3.5 w-3.5 mr-2 text-purple-600 dark:text-purple-400" />
                    <span>Servicio al cliente: 800-123-4567</span>
                  </div>

                  <div className="flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-2 text-purple-600 dark:text-purple-400" />
                    <span>contacto@mitienda.com</span>
                  </div>

                  <p className="text-center mt-2 text-gray-500 dark:text-gray-400">Versión 1.2.0 • © 2023 Mi Tienda App</p>
                </div>
              </div>
            </IonToolbar>
          </IonFooter>
        </>
      )}

    </IonPage>
  )
}

export default Layout

