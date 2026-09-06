// Validates that all required environment variables are present at startup.
// Called before createApp() so the process exits immediately with a clear message
// instead of crashing on the first request that touches a missing variable.

const REQUIRED = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "REFRESH_TOKEN_PEPPER",
];

// These are required only in production — without them features degrade silently.
const REQUIRED_IN_PRODUCTION = [
  "CLIENT_ORIGIN",
  "APP_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (process.env.NODE_ENV === "production") {
    missing.push(...REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]));
  }

  if (missing.length) {
    console.error(`\nMissing required environment variable${missing.length > 1 ? "s" : ""}:`);
    for (const key of missing) console.error(`  - ${key}`);
    console.error(`\nCopy backend/.env.example to backend/.env and fill in the values.\n`);
    process.exit(1);
  }

  // Warnings for optional-but-important vars
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[startup] SMTP_USER/SMTP_PASS not set — emails will not be sent.");
  }
  if (process.env.NODE_ENV === "production" && !process.env.TRUST_PROXY) {
    console.warn("[startup] TRUST_PROXY not set — rate limiting may not work behind a reverse proxy.");
  }
}
