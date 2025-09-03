import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ role }: { role?: string }) {
  const { token, hasRole } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (role && !hasRole(role)) return <Navigate to="/login" replace />;
  return <Outlet />;
}
