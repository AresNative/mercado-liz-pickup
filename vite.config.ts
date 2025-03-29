/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno de acuerdo con el modo
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), legacy()],
    define: {
      "process.env": {
        REACT_APP_API_URL: env.REACT_APP_API_URL,
        REACT_TEST_API_URL: env.REACT_TEST_API_URL,
        REACT_PUBLIC_MODE: env.REACT_PUBLIC_MODE,
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
