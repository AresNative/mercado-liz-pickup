// config.ts
type EnvConfigType = {
  api: string;
  mode: string;
  itemsPerPage: number;
};

export const EnvConfig = (): EnvConfigType => {
  const mode = process.env.NEXT_PUBLIC_MODE || "development";
  const api =
    mode === "production"
      ? process.env.NEXT_PUBLIC_API_URL ||
        "https://api.mercadosliz.com:8080/api/v1/"
      : process.env.NEXT_TEST_API_URL || "http://localhost:5000/api/v1/";

  const itemsPerPage = parseInt(process.env.ITEMS_PER_PAGE || "10", 10); // Fallback a 10 si no está definido

  return {
    api,
    mode,
    itemsPerPage,
  };
};
