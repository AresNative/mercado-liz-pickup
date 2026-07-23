/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from 'vite-plugin-pwa';
import vercel from "vite-plugin-vercel";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno de acuerdo con el modo
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      legacy(),
      vercel(),
      VitePWA({
        workbox: {
          maximumFileSizeToCacheInBytes: 3000000,
        },
        registerType: "autoUpdate",
      }),
    ],
    define: {
      "process.env": env,
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
