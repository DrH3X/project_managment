import type { Role } from "@/types";

/** Libellés français des rôles. */
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  CHEF_PROJET: "Chef de projet",
  EMPLOYE: "Employé",
};

/** Renvoie le libellé français d'un rôle. */
export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

/** Formate une date ISO en chaîne française lisible (jj/mm/aaaa hh:mm). */
export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formate une date ISO en chaîne française courte (jj/mm/aaaa). */
export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Extrait un message d'erreur lisible d'une erreur inconnue.
 * Gère ApiError (erreur API normalisée) et Error standard.
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  return "Une erreur inattendue est survenue.";
}

/**
 * Extrait les erreurs de validation par champ depuis une erreur API.
 * Renvoie une map { champ: message } quand details contient des objets
 * avec un champ `field`. Utilisé pour afficher les erreurs sous chaque champ.
 */
export function getFieldErrors(
  error: unknown,
): Record<string, string> {
  if (
    error &&
    typeof error === "object" &&
    "details" in error &&
    Array.isArray((error as { details?: unknown }).details)
  ) {
    const details = (error as { details: Array<{ field?: string; message?: string } | string> }).details;
    const map: Record<string, string> = {};
    for (const item of details) {
      if (typeof item === "object" && item.field && item.message) {
        map[item.field] = item.message;
      }
    }
    return map;
  }
  return {};
}
