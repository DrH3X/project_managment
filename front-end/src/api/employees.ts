import { apiClient } from "./client";
import type { User, UserListResponse } from "@/types";

/**
 * GET /api/employees — Liste les employés (utilisateurs de rôle EMPLOYE).
 * Réservé à l'ADMIN et au CHEF_PROJET. Sert à l'affectation des tâches (sprint 2).
 */
export async function listEmployees(): Promise<User[]> {
  const { data } = await apiClient.get<UserListResponse>("/employees");
  return data.data;
}
