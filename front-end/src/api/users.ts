import { apiClient } from "./client";
import type {
  CreateUserPayload,
  Role,
  UpdateUserPayload,
  User,
  UserListResponse,
  UserResponse,
} from "@/types";

/**
 * GET /api/users — Liste les utilisateurs, avec filtre optionnel par rôle.
 * Réservé à l'ADMIN.
 */
export async function listUsers(role?: Role): Promise<User[]> {
  const { data } = await apiClient.get<UserListResponse>("/users", {
    params: role ? { role } : undefined,
  });
  return data.data;
}

/**
 * GET /api/users/:id — Renvoie un utilisateur par son identifiant.
 * Réservé à l'ADMIN.
 */
export async function getUser(id: string): Promise<User> {
  const { data } = await apiClient.get<UserResponse>(`/users/${id}`);
  return data.user;
}

/**
 * POST /api/users — Crée un utilisateur. Réservé à l'ADMIN.
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await apiClient.post<UserResponse>("/users", payload);
  return data.user;
}

/**
 * PUT /api/users/:id — Modifie un utilisateur (au moins un champ).
 * Réservé à l'ADMIN.
 */
export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<User> {
  const { data } = await apiClient.put<UserResponse>(`/users/${id}`, payload);
  return data.user;
}

/**
 * DELETE /api/users/:id — Supprime un utilisateur. Réservé à l'ADMIN.
 */
export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
