import path from "path"
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  root: "web",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./web/src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5890,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
  test: {
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
