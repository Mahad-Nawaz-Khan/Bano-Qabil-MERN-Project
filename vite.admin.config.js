import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    open: "/admin.html",
    proxy: { "/api": "http://localhost:5000" },
  },
  build: {
    outDir: "dist-admin",
    rollupOptions: { input: "admin.html" },
  },
});
