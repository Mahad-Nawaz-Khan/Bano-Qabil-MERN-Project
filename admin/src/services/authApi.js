import { request } from "./apiClient.js";

export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, retryOnUnauthorized: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, retryOnUnauthorized: false }),
  logout: () => request("/auth/logout", { method: "POST", retryOnUnauthorized: false }),
  logoutAll: () => request("/auth/logout-all", { method: "POST" }),
  getMe: () => request("/auth/me"),
  updateMe: (payload) => request("/auth/me", { method: "PATCH", body: payload }),
  changePassword: (payload) => request("/auth/change-password", { method: "POST", body: payload }),
  verifyEmail: (token) => request("/auth/verify-email", { method: "POST", body: { token }, retryOnUnauthorized: false }),
  resendVerification: (payload) => request("/auth/resend-verification", { method: "POST", body: payload }),
  forgotPassword: (payload) => request("/auth/forgot-password", { method: "POST", body: payload, retryOnUnauthorized: false }),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: payload, retryOnUnauthorized: false }),
};
