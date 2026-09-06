import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { validateEnv } from "./config/validateEnv.js";

validateEnv();

const port = Number(process.env.PORT || 5000);

try {
  await connectDatabase();
} catch (error) {
  console.error(`Database connection failed: ${error.message}`);
  process.exit(1);
}

const server = createApp().listen(port, () => console.log(`API listening on http://localhost:${port}`));

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
