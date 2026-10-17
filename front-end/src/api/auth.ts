import { apiClient, setToken } from "./client";
import type {
  LoginPayload,
  LoginResponse,
  MeResponse,
  User,
} from "@/types";

/**
 * POST /api/auth/login — Authentifie un utilisateur et renvoie un jeton JWT.
 */
export async function login(payload: LoginPayload): Promise<{
  token: string;
  user: User;
}> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  setToken(data.token);
  return { token: data.token, user: data.user };
}

/**
 * GET /api/auth/me — Renvoie l'utilisateur authentifié par le jeton courant.
 */
export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<MeResponse>("/auth/me");
  return data.user;
}

/**
 * POST /api/auth/logout — Déconnexion. Le serveur est sans état : il renvoie
 * 204 et le front-end supprime le jeton localement.
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch {
    // Même si l'appel échoue (serveur injoignable), on supprime le jeton local.
  } finally {
    setToken(null);
  }
}
