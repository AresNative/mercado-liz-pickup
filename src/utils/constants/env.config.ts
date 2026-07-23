// config.ts
type EnvConfigType = {
  api: any;
  api_int: any;
  hubs: any;
  mode: string;
  itemsPerPage: number;
  apiMongoDb: any;
};

export const EnvConfig = (): EnvConfigType => {
  const mode = import.meta.env.VITE_PUBLIC_MODE ?? "development";
  const api =
    mode === "production"
      ? (import.meta.env.VITE_APP_API_URL ?? import.meta.env.VITE_TEST_API_URL)
      : import.meta.env.VITE_TEST_API_URL;

  const api_int =
    mode === "production"
      ? (import.meta.env.VITE_PUBLIC_API_URL_INT ?? import.meta.env.VITE_TEST_API_URL)
      : import.meta.env.VITE_TEST_API_URL;

  const hubs =
    mode === "production"
      ? (import.meta.env.VITE_APP_HUB_URL ?? "http://localhost:5000/")
      : "http://localhost:5000/";

  const itemsPerPage = parseInt(import.meta.env.VITE_ITEMS_PER_PAGE || "10", 10); // Fallback a 10 si no está definido
  const apiMongoDb = import.meta.env.VITE_MONGO_API_URL;

  return {
    api,
    api_int,
    hubs,
    mode,
    itemsPerPage,
    apiMongoDb,
  };
};
