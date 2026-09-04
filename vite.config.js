import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "block-admin-routes",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = (req.url || "").split("?")[0].split("#")[0];
          if (url === "/admin.html") {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/html");
            res.end(`<!DOCTYPE html>
<html>
<head><title>404 Not Found</title></head>
<body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0b2c2d; color: #fff;">
  <h2>404 - Not Found</h2>
  <p>The Admin portal is not accessible from the customer development server.</p>
  <p>To access the Admin portal, use <code>npm run dev:admin</code> and open <a href="http://localhost:5174" style="color: #cdb894;">http://localhost:5174</a>.</p>
</body>
</html>`);
            return;
          }
          // /admin and everything under it belong to the admin app only;
          // on the customer domain they simply go back to the homepage.
          if (url === "/admin" || url.startsWith("/admin/")) {
            res.statusCode = 302;
            res.setHeader("Location", "/");
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
