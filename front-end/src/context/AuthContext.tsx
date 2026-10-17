"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
} from "@/api/auth";
import { registerUnauthorizedHandler, setToken, getToken } from "@/api/client";
import type { LoginPayload, User } from "@/types";

interface AuthContextValue {
  /** Utilisateur courant, ou null si non authentifié. */
  user: User | null;
  /** True tant que l'utilisateur initial n'a pas été chargé. */
  loading: boolean;
  /** True si l'utilisateur est authentifié. */
  isAuthenticated: boolean;
  /** Connecte l'utilisateur et stocke le jeton. */
  login: (payload: LoginPayload) => Promise<User>;
  /** Déconnecte l'utilisateur (supprime le jeton localement). */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Déconnexion locale (sans appel serveur) : réinitialise l'état.
  const clearLocalSession = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Au montage, si un jeton existe, on tente de recharger l'utilisateur
  // via GET /api/auth/me. Si le jeton est invalide (401), l'intercepteur
  // supprime le jeton et on reste déconnecté.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        // L'intercepteur 401 a déjà nettoyé le jeton. On reste déconnecté.
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Enregistre le gestionnaire de 401 : déconnecte et redirige vers /login.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearLocalSession();
      // Redirection côté navigateur (le jeton est expiré/invalide).
      if (typeof window !== "undefined") {
        const current = window.location.pathname;
        if (current !== "/login") {
          window.location.assign("/login");
        }
      }
    });
    return () => {
      registerUnauthorizedHandler(() => {});
    };
  }, [clearLocalSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user: me } = await apiLogin(payload);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook d'accès au contexte d'authentification. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  }
  return ctx;
}
