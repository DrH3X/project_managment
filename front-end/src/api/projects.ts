import { apiClient } from "./client";
import type {
  CreateProjectPayload,
  Project,
  ProjectListResponse,
  ProjectResponse,
  UpdateProjectPayload,
} from "@/types";

/**
 * GET /api/projects — Liste les projets selon la visibilité par rôle.
 * - ADMIN : tous les projets.
 * - CHEF_PROJET : ses projets seulement.
 * - EMPLOYE : projets auxquels il participe (liste vide au sprint 1).
 */
export async function listProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<ProjectListResponse>("/projects");
  return data.data;
}

/**
 * GET /api/projects/:id — Renvoie un projet par son identifiant
 * (sous réserve de visibilité par l'utilisateur).
 */
export async function getProject(id: string): Promise<Project> {
  const { data } = await apiClient.get<ProjectResponse>(`/projects/${id}`);
  return data.project;
}

/**
 * POST /api/projects — Crée un projet.
 * Réservé au CHEF_PROJET (le propriétaire est l'utilisateur connecté).
 * Le statut initial est `NON_COMMENCE` et ne peut pas être modifié par l'API.
 */
export async function createProject(
  payload: CreateProjectPayload,
): Promise<Project> {
  const { data } = await apiClient.post<ProjectResponse>("/projects", payload);
  return data.project;
}

/**
 * PUT /api/projects/:id — Modifie un projet.
 * Réservé au CHEF_PROJET propriétaire. Le `statut` ne peut pas être modifié.
 */
export async function updateProject(
  id: string,
  payload: UpdateProjectPayload,
): Promise<Project> {
  const { data } = await apiClient.put<ProjectResponse>(
    `/projects/${id}`,
    payload,
  );
  return data.project;
}

/**
 * DELETE /api/projects/:id — Supprime un projet.
 * Réservé au CHEF_PROJET propriétaire.
 */
export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}
