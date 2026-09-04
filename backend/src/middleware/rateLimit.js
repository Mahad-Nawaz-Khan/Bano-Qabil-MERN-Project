import rateLimit from "express-rate-limit";

const base = { standardHeaders: "draft-8", legacyHeaders: false };

export const globalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { message: "Too many requests. Please slow down and try again shortly." },
});

// Only the credential endpoints: /refresh and /me stay on the global limit so a few open
// tabs cannot lock a user out of their own session.
export const credentialLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 10,
  message: { message: "Too many attempts. Please wait a minute and try again." },
});
