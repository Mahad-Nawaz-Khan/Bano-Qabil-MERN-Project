import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authApi } from "../services/authApi.js";
import { bootstrapSession, onSessionEnded, setAccessToken } from "../services/apiClient.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const bootstrapped = useRef(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    onSessionEnded(clearSession);
  }, [clearSession]);

  useEffect(() => {
    // StrictMode invokes this twice; the ref plus the client's single-flight refresh
    // keep it to one network call.
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    bootstrapSession()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsInitializing(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => null);
    clearSession();
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
    await authApi.logoutAll().catch(() => null);
    clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const data = await authApi.getMe();
    setUser(data.data);
    return data.data;
  }, []);

  const value = useMemo(() => ({
    user,
    isInitializing,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    isVerified: Boolean(user?.isEmailVerified),
    login,
    register,
    logout,
    logoutAll,
    refreshUser,
    updateProfile: async (payload) => {
      const data = await authApi.updateMe(payload);
      setUser(data.data);
      return data.data;
    },
  }), [user, isInitializing, login, register, logout, logoutAll, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
