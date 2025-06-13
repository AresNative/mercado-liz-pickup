// config.ts
type EnvConfigType = {
  api: string;
  api_int: string;
  mode: string;
  itemsPerPage: number;
};

export const EnvConfig = (): EnvConfigType => {
  const mode = process.env.REACT_PUBLIC_MODE || "development"; // Fallback a development si no está definido
  const api =
    mode === "production"
      ? process.env.REACT_PUBLIC_API_URL ||
        "https://api.mercadosliz.com:8080/api/"
      : process.env.REACT_TEST_API_URL || "http://localhost:5000/api/";

  const api_int =
    process.env.REACT_PUBLIC_API_URL_INT || "http://localhost:5000/api/";

  const itemsPerPage = parseInt(process.env.ITEMS_PER_PAGE || "10", 10); // Fallback a 10 si no está definido

  return {
    api,
    api_int,
    mode,
    itemsPerPage,
  };
};
