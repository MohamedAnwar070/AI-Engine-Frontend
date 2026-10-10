import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/lib/auth";

export function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: Array<"admin" | "editor" | "viewer"> }) {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
