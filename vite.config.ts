import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    proxy: {
      "/api/chart": { target: "http://localhost:4000", changeOrigin: true },

      "/api/market": { target: "http://localhost:4000", changeOrigin: true },

      "/api/v1": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
});
