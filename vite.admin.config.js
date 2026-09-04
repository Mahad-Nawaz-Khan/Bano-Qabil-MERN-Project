import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "admin-entry-rewrite",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = (req.originalUrl || req.url || "").split("?")[0];
          // Redirect legacy /admin.html to clean root /
          if (rawUrl === "/admin.html") {
            const query = (req.originalUrl || req.url || "").includes("?")
              ? "?" + (req.originalUrl || req.url).split("?")[1]
              : "";
            res.writeHead(302, { Location: "/" + query });
            res.end();
            return;
          }
          // Rewrite root, /admin, or /index.html to serve admin.html internally
          const path = (req.url || "").split("?")[0];
          if (path === "/" || path === "/admin" || path === "/admin/" || path === "/index.html") {
            const query = (req.url || "").includes("?") ? "?" + (req.url || "").split("?")[1] : "";
            req.url = "/admin.html" + query;
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5174,
    strictPort: true,
    open: "/",
    proxy: { "/api": "http://localhost:5000" },
  },
  build: {
    outDir: "dist-admin",
    rollupOptions: { input: "admin.html" },
  },
});
