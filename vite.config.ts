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
      "/api": {
        target: "https://barleyssal.duckdns.org",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
