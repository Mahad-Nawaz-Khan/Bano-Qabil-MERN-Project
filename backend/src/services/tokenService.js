import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const ISSUER = "ghalib-api";
const AUDIENCE = "ghalib-client";

// Read lazily so a missing .env fails with a clear message instead of at import time.
function secret(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy backend/.env.example to backend/.env and fill it in.`);
  return value;
}

export function signAccessToken(user) {
  return jwt.sign({ role: user.role, emailVerified: user.isEmailVerified }, secret("JWT_ACCESS_SECRET"), {
    subject: String(user._id),
    expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
    algorithm: "HS256",
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, secret("JWT_ACCESS_SECRET"), { algorithms: ["HS256"], issuer: ISSUER, audience: AUDIENCE });
}

export const createOpaqueToken = () => crypto.randomBytes(32).toString("hex");

// Stored tokens are keyed by this digest, so a leaked database dump cannot be replayed.
export const hashToken = (token) => crypto.createHmac("sha256", secret("REFRESH_TOKEN_PEPPER")).update(token).digest("hex");

export const refreshTokenTtlMs = () => Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30) * 24 * 60 * 60 * 1000;
