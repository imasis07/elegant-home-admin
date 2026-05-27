import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, user, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Checking session...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/login?error=unauthorized" replace />;
  return <>{children}</>;
}

export function RequireAal2({ children }: { children: React.ReactNode }) {
  const { loading, user, isAdmin, needsMfa } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Checking security level...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/login?error=unauthorized" replace />;
  if (needsMfa) return <Navigate to="/mfa" replace />;
  return <>{children}</>;
}

