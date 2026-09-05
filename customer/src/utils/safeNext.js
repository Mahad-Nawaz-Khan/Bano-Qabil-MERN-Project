// A `next` destination is only ever an internal path. Rejecting "//evil.com" and
// absolute URLs stops a crafted link from bouncing a signed-in user off-site.
export function safeNext(value, fallback = "/") {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}
