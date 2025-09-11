import type { ReactNode, FC } from "react";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/axios";

type AuthCtx = {
  token: string | null;
  username: string | null;
  roles: string[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

function normalizeRoles(input: unknown): string[] {
  // Backend bazen "ROLE_ADMIN,ROLE_USER" string; bazen ["ROLE_ADMIN","ROLE_USER"] array dönebilir
  if (Array.isArray(input)) return input.filter(Boolean);
  if (typeof input === "string") {
    return input.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(localStorage.getItem("username"));
  const [roles, setRoles] = useState<string[]>(
    normalizeRoles(localStorage.getItem("roles"))
  );

  const persist = useCallback((t: string | null, u: string | null, rs: string[]) => {
    setToken(t);
    setUsername(u);
    setRoles(rs);
    if (t) localStorage.setItem("token", t); else localStorage.removeItem("token");
    if (u) localStorage.setItem("username", u); else localStorage.removeItem("username");
    if (rs.length) localStorage.setItem("roles", rs.join(",")); else localStorage.removeItem("roles");
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const { data } = await api.post("/auth/login", { username: u, password: p });
    const rs = normalizeRoles(data.roles);
    persist(data.token, data.username ?? u, rs);
  }, [persist]);

  const logout = useCallback(() => {
    persist(null, null, []);
  }, [persist]);

  // Axios interceptor 401/403 yakalayınca global event atıyor; burada dinleyip logout yapalım
  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [logout]);

  const hasRole = useCallback(
    (r: string) => {
      // hem "ADMIN" hem "ROLE_ADMIN" kontrol et
      return roles.includes(r) || roles.includes(`ROLE_${r}`);
    },
    [roles]
  );

  const value = useMemo(
    () => ({ token, username, roles, login, logout, hasRole }),
    [token, username, roles, login, logout, hasRole]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
};
