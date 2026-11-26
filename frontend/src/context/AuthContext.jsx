import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true while we check a saved token on first load
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  // On first load: if a token is saved, ask the server who it belongs to.
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    authService
      .getMe()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  // The Axios interceptor fires this when the server says the token is invalid.
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authService.registerStudent(formData);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
