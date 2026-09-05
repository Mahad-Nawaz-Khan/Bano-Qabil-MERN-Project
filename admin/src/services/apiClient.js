const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

// The access token lives here and nowhere else: no localStorage, so XSS cannot read it.
let accessToken = null;
let refreshPromise = null;
let sessionEndedHandler = null;

export class ApiError extends Error {
  constructor(message, status, { retryable = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryable = retryable;
  }
}

export const setAccessToken = (token) => { accessToken = token ?? null; };
export const getAccessToken = () => accessToken;
export const onSessionEnded = (handler) => { sessionEndedHandler = handler; };

async function send(path, { body, headers, ...options } = {}, token = accessToken) {
  const isFormData = body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(body === undefined || isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
  });

  if (response.status === 204) return { response, data: {} };
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

// One shared refresh: concurrent 401s wait on the same call instead of stampeding.
function refreshSession() {
  refreshPromise ??= send("/auth/refresh", { method: "POST" }, null)
    .then(({ response, data }) => {
      if (!response.ok) throw new ApiError(data.message || "Session expired", response.status);
      accessToken = data.accessToken;
      return data;
    })
    .catch((error) => {
      accessToken = null;
      throw error;
    })
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function request(path, options = {}) {
  const { retryOnUnauthorized = true, ...rest } = options;
  let { response, data } = await send(path, rest);

  if (response.status === 401 && retryOnUnauthorized && !path.startsWith("/auth/refresh")) {
    try {
      await refreshSession();
    } catch {
      sessionEndedHandler?.();
      throw new ApiError(data.message || "Your session has expired. Please sign in again.", 401);
    }
    ({ response, data } = await send(path, rest));
  }

  if (!response.ok) throw new ApiError(data.message || "The server could not complete this request.", response.status, { retryable: data.retryable === true });
  return data;
}

export const bootstrapSession = () => refreshSession();
