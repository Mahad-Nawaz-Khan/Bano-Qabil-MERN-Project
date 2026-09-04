import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

process.env.NODE_ENV = "development";
process.env.TRUST_PROXY = "0";
const app = createApp();
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const call = async (path, options = {}) => {
  const res = await fetch(base + path, options);
  let body = null;
  try { body = await res.json(); } catch { /* empty body */ }
  return { status: res.status, body, headers: res.headers };
};

const checks = [];
const check = async (label, fn) => {
  try { await fn(); checks.push(`  PASS  ${label}`); }
  catch (error) { checks.push(`  FAIL  ${label} -> ${error.message}`); process.exitCode = 1; }
};

await check("TRUST_PROXY=0 is preserved", async () => {
  assert.equal(app.get("trust proxy"), 0);
});

await check("health is public", async () => {
  const { status, body } = await call("/api/health");
  assert.equal(status, 200);
  assert.equal(body.ok, true);
});

await check("unknown route is 404 with a message", async () => {
  const { status, body } = await call("/api/nope");
  assert.equal(status, 404);
  assert.match(body.message, /Route not found/);
});

await check("helmet headers present", async () => {
  const { headers } = await call("/api/health");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("cross-origin-resource-policy"), "cross-origin");
});

await check("rate limit headers use draft-8", async () => {
  const { headers } = await call("/api/health");
  assert.ok(headers.get("ratelimit"), "missing RateLimit header");
});

await check("cart requires a token", async () => {
  const { status } = await call("/api/cart");
  assert.equal(status, 401);
});

await check("orders require a token", async () => {
  const { status } = await call("/api/orders");
  assert.equal(status, 401);
});

await check("menu mutations require a token", async () => {
  const { status } = await call("/api/menu-items", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "x" }),
  });
  assert.equal(status, 401);
});

await check("cross-origin state change is blocked", async () => {
  const { status, body } = await call("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://evil.test" },
    body: JSON.stringify({ email: "a@b.co", password: "password1" }),
  });
  assert.equal(status, 403);
  assert.match(body.message, /unrecognised origin/);
});

await check("allowlisted origin passes the CSRF check", async () => {
  const { status } = await call("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:5173" },
    body: JSON.stringify({ name: "A", email: "bad", password: "short" }),
  });
  assert.equal(status, 400);
});

await check("register rejects a bad payload with a readable message", async () => {
  const { status, body } = await call("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Ali Raza", email: "not-an-email", password: "password1" }),
  });
  assert.equal(status, 400);
  assert.match(body.message, /valid email/i);
});

await check("register rejects a password with no digit", async () => {
  const { status, body } = await call("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Ali Raza", email: "ali@test.co", password: "passwordonly" }),
  });
  assert.equal(status, 400);
  assert.match(body.message, /letter and a number/i);
});

await check("refresh with no cookie is 401", async () => {
  const { status } = await call("/api/auth/refresh", { method: "POST" });
  assert.equal(status, 401);
});

await check("email is normalised before validation", async () => {
  const { status, body } = await call("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "A", email: "  Foo@Bar.CO ", password: "password1" }),
  });
  assert.equal(status, 400);
  assert.doesNotMatch(body.message, /valid email/i);
});

await check("includeInactive=true requires authentication (401)", async () => {
  const { status } = await call("/api/menu-items?includeInactive=true");
  assert.equal(status, 401);
});

await check("verify-email rejects missing or invalid body token", async () => {
  const { status, body } = await call("/api/auth/verify-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: "not-a-valid-opaque-hex-token" }),
  });
  assert.equal(status, 400);
  assert.match(body.message, /link is not valid|invalid/i);
});

await check("resend-verification requires authentication", async () => {
  const { status } = await call("/api/auth/resend-verification", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(status, 401);
});

console.log(checks.join("\n"));
server.close();
