import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { ApiError, type ApiErrorDetail } from "@/types";

/** Clé de stockage du jeton dans le navigateur. */
export const TOKEN_STORAGE_KEY = "pgpt_token";

/**
 * URL de base de l'API. Provient de NEXT_PUBLIC_API_URL.
 * Valeur par défaut conforme au contrat (port 4000, préfixe /api).
 * Peut être relative ("/api") pour passer par la passerelle de prévisualisation.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/**
 * Port de transformation pour la passerelle de prévisualisation.
 * Si défini (via NEXT_PUBLIC_API_TRANSFORM_PORT), chaque requête reçoit
 * le paramètre d'URL `XTransformPort=<port>` afin d'être routée vers
 * un autre service local. Vide en production (l'URL absolue est utilisée).
 */
const API_TRANSFORM_PORT = process.env.NEXT_PUBLIC_API_TRANSFORM_PORT;

/** Récupère le jeton JWT depuis le localStorage (côté navigateur uniquement). */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Stocke (ou supprime si null) le jeton JWT dans le localStorage. */
export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Instance Axios centralisée de l'application. */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur de requête : ajoute le jeton Authorization + le port de
// transformation (passerelle de prévisualisation) si nécessaire.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  if (API_TRANSFORM_PORT) {
    config.params = { ...config.params, XTransformPort: API_TRANSFORM_PORT };
  }
  return config;
});

/**
 * Callbacks de déconnexion. Enregistrés par le AuthProvider pour qu'un 401
 * puisse déconnecter l'utilisateur et le renvoyer à la page de connexion.
 */
let onUnauthorized: (() => void) | null = null;

/** Permet au AuthProvider d'enregistrer son gestionnaire de 401. */
export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

/** Convertit une erreur Axios en ApiError applicative exploitable par l'UI. */
export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: ApiErrorDetail }>;
    const status = axiosError.response?.status ?? 0;
    const detail = axiosError.response?.data?.error;

    if (detail) {
      return new ApiError(status, detail);
    }

    // Pas de corps d'erreur (ex. réseau, timeout, 204 mal géré).
    if (axiosError.request && !axiosError.response) {
      return new ApiError(0, {
        code: "NETWORK_ERROR",
        message:
          "Impossible de joindre le serveur. Vérifiez votre connexion ou que l'API est démarrée.",
      });
    }

    return new ApiError(status, {
      code: "UNKNOWN_ERROR",
      message: axiosError.message || "Une erreur inattendue est survenue.",
    });
  }

  if (error instanceof Error) {
    return new ApiError(0, {
      code: "UNKNOWN_ERROR",
      message: error.message,
    });
  }

  return new ApiError(0, {
    code: "UNKNOWN_ERROR",
    message: "Une erreur inattendue est survenue.",
  });
}

// Intercepteur de réponse : normalise les erreurs et gère le 401.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // Une réponse 401 (non authentifié / jeton invalide) déconnecte
    // l'utilisateur et le renvoie à la page de connexion.
    if (status === 401) {
      setToken(null);
      if (onUnauthorized) {
        onUnauthorized();
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);
