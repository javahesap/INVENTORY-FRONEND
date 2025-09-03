import React, { createContext, useContext, useMemo, useState } from "react";
import api from "../api/axios";

type AuthCtx = {
  token: string | null;
  username: string | null;
  roles: string[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
};

const Ctx = createContext<AuthCtx>(null as any);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(localStorage.getItem("username"));
  const [roles, setRoles] = useState<string[]>(
    (localStorage.getItem("roles") || "").split(",").filter(Boolean)
  );

  const login = async (u: string, p: string) => {
    const { data } = await api.post("/auth/login", { username: u, password: p });
    setToken(data.token);
    setUsername(data.username);
    setRoles((data.roles || "").split(","));
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("roles", data.roles || "");
  };

  const logout = () => {
    setToken(null); setUsername(null); setRoles([]);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("roles");
  };

  const hasRole = (r: string) => roles.includes(r) || roles.includes(`ROLE_${r}`);

  const value = useMemo(() => ({ token, username, roles, login, logout, hasRole }), [token, username, roles]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
};

export const useAuth = () => useContext(Ctx);
