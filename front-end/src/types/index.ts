// Types partagés de l'application front-end.
// Conformes au contrat d'API back-end (Sprint 0).

/** Rôles possibles d'un utilisateur. */
export type Role = "ADMIN" | "CHEF_PROJET" | "EMPLOYE";

/** Objet Utilisateur tel que renvoyé par l'API (jamais de mot de passe). */
export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/** Corps de la requête de connexion. */
export interface LoginPayload {
  email: string;
  motDePasse: string;
}

/** Réponse de POST /api/auth/login. */
export interface LoginResponse {
  token: string;
  user: User;
}

/** Réponse de GET /api/auth/me. */
export interface MeResponse {
  user: User;
}

/** Réponse de GET /api/users et GET /api/employees. */
export interface UserListResponse {
  data: User[];
}

/** Réponse de GET /api/users/:id, POST /api/users, PUT /api/users/:id. */
export interface UserResponse {
  user: User;
}

/** Corps de POST /api/users. */
export interface CreateUserPayload {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  role: Role;
}

/** Corps de PUT /api/users/:id (au moins un champ). */
export interface UpdateUserPayload {
  nom?: string;
  prenom?: string;
  email?: string;
  motDePasse?: string;
  role?: Role;
}

/**
 * Format d'erreur normalisé par l'API back-end.
 * { error: { code, message, details } }
 */
export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Array<{ field?: string; message: string } | string>;
}

/** Erreur applicative levée côté front quand l'API renvoie une erreur. */
export class ApiError extends Error {
  code: string;
  status: number;
  details?: ApiErrorDetail["details"];

  constructor(status: number, detail: ApiErrorDetail) {
    super(detail.message);
    this.name = "ApiError";
    this.status = status;
    this.code = detail.code;
    this.details = detail.details;
  }
}
