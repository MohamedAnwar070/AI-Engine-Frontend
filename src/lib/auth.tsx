import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type AuthLoginRequest, type User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermissions: (required: string[]) => boolean;
  login: (payload: AuthLoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => api.getAuthToken());

  const healthQuery = useQuery({
    queryKey: ["auth", "health-mode"],
    queryFn: () => api.healthCheck(),
    retry: false,
  });

  const authEnabled = healthQuery.data?.auth_enabled ?? true;

  const meQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => api.getCurrentUser(),
    enabled: authEnabled && !!token,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError && token) {
      api.setAuthToken(null);
      setToken(null);
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
    }
  }, [meQuery.isError, token, queryClient]);

  const user = meQuery.data ?? null;

  const hasPermissions = useCallback(
    (required: string[]) => {
      if (required.length === 0) return true;
      if (!authEnabled) return true;
      const granted = new Set(user?.permissions ?? []);
      return required.every((permission) => granted.has(permission));
    },
    [authEnabled, user],
  );

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading: healthQuery.isLoading || meQuery.isLoading,
    isAuthenticated: authEnabled ? Boolean(user) : true,
    hasPermissions,
    login: async (payload) => {
      const response = await api.login(payload);
      api.setAuthToken(response.access_token);
      setToken(response.access_token);
      queryClient.setQueryData(["auth", "me", response.access_token], response.user);
    },
    logout: () => {
      api.setAuthToken(null);
      setToken(null);
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
    },
  }), [authEnabled, healthQuery.isLoading, hasPermissions, meQuery.isLoading, queryClient, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
