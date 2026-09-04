import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";
import { hashPassword } from "../services/authService.js";

const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

try {
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");

  await connectDatabase();
  const existing = await User.findOne({ email });
  await User.updateOne(
    { email },
    {
      $set: { name: name || "Administrator", role: "admin", isEmailVerified: true, passwordHash: await hashPassword(password) },
      $unset: { lockUntil: "", failedLoginAttempts: "" },
    },
    { upsert: true, runValidators: true },
  );
  console.log(`${existing ? "Updated" : "Created"} admin account: ${email}`);
} catch (error) {
  console.error(`Admin seed failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
