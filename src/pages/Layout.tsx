import type React from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { IonContent, IonPage, IonFooter, IonToolbar } from "@ionic/react";
import { Info, Phone, Mail, Clock, MapPin } from "lucide-react";
import { branches } from "./@landing/utils/branches";
import { setSucursal } from "@/hooks/slices/app";

const Layout: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  // Función para seleccionar sucursal y navegar
  const handleSelectBranch = (branch: (typeof branches)[0]) => {
    let branchData = {
      id: branch.id,
      name: branch.name,
      address: branch.address,
    };

    dispatch(setSucursal(branchData));
    history.push("/products");
  };

  return (
    <IonPage>
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <img src="/logo.jpg" className="m-auto w-1/2 lg:w-1/5" />
        <ul className="list-inside flex flex-col sm:flex-row md:flex-nowrap flex-wrap gap-2 md:gap-4 lg:gap-6 mx-2 sm:mx-4 md:mx-6 lg:mx-8 mb-3 sm:mb-4 md:mb-6 items-stretch justify-center">
          {branches.map((branch, key) => (
            <li
              key={key}
              onClick={() => handleSelectBranch(branch)}
              className="bg-white dark:bg-gray-800 cursor-pointer rounded-xl shadow-lg overflow-hidden border-l-4 border-[#A855F7] active:bg-gray-50 dark:active:bg-gray-700"
            >
              <div className="flex items-center p-2">
                <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-full mr-4">
                  <branch.icon className="h-6 w-6 text-[#A855F7] dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 dark:text-white">{branch.name}</h3>
                  <p className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin />
                    {branch.address}</p>
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
      </IonContent>
    </IonPage>
  );
};

export default Layout;