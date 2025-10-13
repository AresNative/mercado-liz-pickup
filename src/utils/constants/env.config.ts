// config.ts
type EnvConfigType = {
  api: any;
  api_int: any;
  hubs: any;
  mode: string;
  itemsPerPage: number;
};
/* 
 @returns {EnvConfigType} Objeto con configuración de entorno
 @ description Esta función lee las variables de entorno definidas en el archivo .env
 @ y devuelve un objeto con la configuración necesaria para la aplicación.
 @ Si alguna variable no está definida, se asigna un valor por defecto.

! Nota: Asegúrate de definir las variables de entorno en el archivo .env y que conicidan en vite.config.ts
! con las definiciones aquí para evitar errores en tiempo de ejecución.
*/
export const EnvConfig = (): EnvConfigType => {
  const mode = process.env.REACT_PUBLIC_MODE ?? "development";

  const api =
    mode === "production"
      ? process.env.REACT_APP_API_URL ?? "http://localhost:5230/api/"
      : "http://localhost:5230/api/";

  const api_int = process.env.REACT_PUBLIC_API_URL_INT;

  const hubs =
    mode === "production"
      ? process.env.REACT_APP_HUB_URL ?? "http://localhost:5230/"
      : "http://localhost:5230/";

  const itemsPerPage = parseInt(process.env.ITEMS_PER_PAGE || "10", 10); // Fallback a 10 si no está definido

  return {
    api,
    api_int,
    hubs,
    mode,
    itemsPerPage,
  };
};
