import helmet from "helmet";
import { AppError } from "../utils/errors.js";

// Dev falls back to the two Vite ports; production with no CLIENT_ORIGIN fails closed.
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"];

export const getAllowedOrigins = () => {
  const configured = (process.env.CLIENT_ORIGIN || "").split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean);
  if (configured.length) return configured;
  return process.env.NODE_ENV === "production" ? [] : DEV_ORIGINS;
};

// crossOriginResourcePolicy is relaxed so GridFS images can load from a separate API host.
export const securityHeaders = helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } });

// Browsers always attach Origin to cross-site state changes, so this blocks CSRF even when
// the refresh cookie has to run as SameSite=None in production. Non-browser clients send
// neither header and are left to the bearer token.
export function requireSameOrigin(req, _res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  const referer = req.get("referer");
  let origin = req.get("origin") || "";
  if (!origin && referer) {
    try {
      origin = new URL(referer).origin;
    } catch {
      return next(new AppError("Request blocked: malformed referer", 403));
    }
  }
  if (!origin) return next();
  if (getAllowedOrigins().includes(origin)) return next();
  next(new AppError("Request blocked: unrecognised origin", 403));
}
