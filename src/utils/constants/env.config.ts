// config.ts
type EnvConfigType = {
  api: any;
  api_int: any;
  hubs: any;
  mode: string;
  itemsPerPage: number;
};

export const EnvConfig = (): EnvConfigType => {
  const mode = process.env.REACT_PUBLIC_MODE ?? "development";
  const api =
    mode === "production"
      ? (process.env.REACT_APP_API_URL ?? process.env.REACT_TEST_API_URL)
      : process.env.REACT_TEST_API_URL;

  const api_int =
    mode === "production"
      ? (process.env.REACT_PUBLIC_API_URL_INT ?? process.env.REACT_TEST_API_URL)
      : process.env.REACT_TEST_API_URL;

  const hubs =
    mode === "production"
      ? (process.env.REACT_APP_HUB_URL ?? "http://localhost:5000/")
      : "http://localhost:5000/";

  const itemsPerPage = parseInt(process.env.ITEMS_PER_PAGE || "10", 10); // Fallback a 10 si no está definido

  return {
    api,
    api_int,
    hubs,
    mode,
    itemsPerPage,
  };
};
