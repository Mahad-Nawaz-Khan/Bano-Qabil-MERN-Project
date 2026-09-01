import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDatabase } from "./config/db.js";
import { menuRouter } from "./routes/menuRoutes.js";
import { assetRouter } from "./routes/assetRoutes.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : true }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/assets", assetRouter);
// Authentication deliberately isn't added: login/signup belongs to another team member.
// Add their middleware to mutation routes once it is ready.
app.use("/api", menuRouter);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
  if (error.code === 11000) return res.status(409).json({ message: "A record with that value already exists" });
  res.status(error.status || 500).json({ message: error.message || "Internal server error" });
});
connectDatabase().then(() => app.listen(port, () => console.log(`Menu API listening on http://localhost:${port}`))).catch((error) => {
  console.error(`Database connection failed: ${error.message}`);
  process.exit(1);
});
