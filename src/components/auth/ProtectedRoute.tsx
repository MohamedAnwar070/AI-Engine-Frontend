import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/lib/auth";

interface ProtectedRouteProps {
  children: JSX.Element;
  /** Every listed permission must be granted to the signed-in user. */
  permissions?: string[];
}

export function ProtectedRoute({ children, permissions = [] }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, hasPermissions } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!hasPermissions(permissions)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
