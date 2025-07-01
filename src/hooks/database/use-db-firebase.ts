import { database } from "@/firebase-config";
import {
  ref,
  set,
  update,
  remove,
  onValue,
  off,
  DataSnapshot,
} from "firebase/database";

// Escribir datos (dinámico)
export const writeData = (path: string, data: object) => {
  const dbRef = ref(database, path);
  return set(dbRef, data)
    .then(() => console.log("Datos guardados correctamente"))
    .catch((error) => console.error("Error al guardar:", error));
};

// Actualizar datos (dinámico)
export const updateData = (path: string, updates: object) => {
  const dbRef = ref(database, path);
  return update(dbRef, updates)
    .then(() => console.log("Datos actualizados correctamente"))
    .catch((error) => console.error("Error al actualizar:", error));
};

// Eliminar datos (dinámico)
export const deleteData = (path: string) => {
  const dbRef = ref(database, path);
  return remove(dbRef)
    .then(() => console.log("Datos eliminados correctamente"))
    .catch((error) => console.error("Error al eliminar:", error));
};

// Leer datos en tiempo real (dinámico)
type CallbackFunction = (data: any) => void;

export const listenRealTimeData = (
  path: string,
  callback: CallbackFunction
) => {
  const dbRef = ref(database, path);

  const snapshotHandler = (snapshot: DataSnapshot) => {
    try {
      const data = snapshot.val();
      callback(data);
    } catch (error) {
      console.error("Error al procesar datos:", error);
    }
  };

  // Registrar listener
  onValue(dbRef, snapshotHandler);

  // Devolver función para desregistrar
  return () => off(dbRef, "value", snapshotHandler);
};

// Ejemplo de uso en componente React:
/*
import { useEffect, useState } from "react";
import { listenRealTimeData } from "./tu-archivo";

const UserComponent = ({ userId }: { userId: string }) => {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Escuchar cambios en tiempo real
    const unsubscribe = listenRealTimeData(
      `users/${userId}`,
      (data) => setUserData(data)
    );

    // Limpieza al desmontar
    return () => unsubscribe();
  }, [userId]);

  return (
    <div>
      {userData ? (
        <>
          <h2>{userData.name}</h2>
          <p>Email: {userData.email}</p>
        </>
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
};
*/
