# Contrat d'API — Sprint 0

**Périmètre :** fondations, authentification et gestion des utilisateurs.
**Préfixe :** `/api` — **Port :** 4000 — **Format :** JSON — **Authentification :** Bearer JWT (sauf `/api/auth/login`, `/api/health`).

## Conventions

- Champs en `camelCase`, dates au format ISO 8601, énumérations en MAJUSCULES.
- Jeton JWT signé côté serveur, valable **8 heures** par défaut (`JWT_EXPIRES_IN`).
- Le mot de passe n'est **jamais** renvoyé dans les réponses.
- Format d'erreur unique :

```json
{ "error": { "code": "CODE_EN_MAJUSCULES", "message": "message en français", "details": [] } }
```

| Code HTTP | Cas d'usage |
|-----------|-------------|
| 200 | Succès (GET, PUT) |
| 201 | Création (POST) |
| 204 | Succès sans contenu (DELETE, logout) |
| 400 | Données invalides (validation Zod) |
| 401 | Non authentifié / jeton invalide ou expiré |
| 403 | Rôle insuffisant |
| 404 | Ressource introuvable |
| 409 | Conflit (email déjà utilisé, suppression interdite) |
| 422 | Règle métier non respectée (utilisé à partir du sprint 2) |
| 500 | Erreur interne |

## Objets échangés

### Utilisateur (User)

```json
{
  "id": "65a1f0c2e4b0a1a2b3c4d5e6",
  "nom": "Dupont",
  "prenom": "Marie",
  "email": "marie@plateforme.local",
  "role": "CHEF_PROJET",
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-01T10:00:00.000Z"
}
```

Rôles possibles : `ADMIN`, `CHEF_PROJET`, `EMPLOYE`. Un **employé** est un utilisateur de rôle `EMPLOYE`.

---

## 1. GET /api/health

Vérifie que l'API est démarrée. Aucune authentification.

**Réponse 200 :**

```json
{ "status": "ok", "timestamp": "2025-01-01T10:00:00.000Z" }
```

---

## 2. POST /api/auth/login

Authentifie un utilisateur et renvoie un jeton JWT.

- **Rôles autorisés :** public (aucun).
- **Corps :**

```json
{ "email": "admin@plateforme.local", "motDePasse": "Admin123!" }
```

**Réponse 200 :**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "65a1f0c2e4b0a1a2b3c4d5e6",
    "nom": "Admin",
    "prenom": "Système",
    "email": "admin@plateforme.local",
    "role": "ADMIN",
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | Email invalide ou mot de passe manquant |
| 401 | `INVALID_CREDENTIALS` | Email inexistant ou mot de passe incorrect |

**Règles :** email comparé de façon insensible à la casse ; mot de passe haché avec bcrypt.

---

## 3. GET /api/auth/me

Renvoie l'utilisateur authentifié par le jeton.

- **Rôles autorisés :** tout utilisateur connecté.
- **En-tête :** `Authorization: Bearer <token>`

**Réponse 200 :**

```json
{ "user": { "id": "...", "nom": "...", "prenom": "...", "email": "...", "role": "ADMIN", "createdAt": "...", "updatedAt": "..." } }
```

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 401 | `UNAUTHENTICATED` | En-tête Authorization manquant |
| 401 | `INVALID_TOKEN` | Jeton invalide ou expiré |
| 404 | `USER_NOT_FOUND` | Utilisateur du jeton introuvable en base |

---

## 4. POST /api/auth/logout

Déconnexion. Le serveur ne stocke pas le jeton : il renvoie 204 et le front-end supprime le jeton localement.

- **Rôles autorisés :** public (no-op serveur).
- **Corps :** aucun.

**Réponse :** `204 No Content`

---

## 5. GET /api/users

Liste les utilisateurs, avec filtre optionnel par rôle.

- **Rôles autorisés :** `ADMIN`.
- **Query params :** `role` (optionnel, parmi `ADMIN`, `CHEF_PROJET`, `EMPLOYE`).

Exemple : `GET /api/users?role=EMPLOYE`

**Réponse 200 :**

```json
{
  "data": [
    { "id": "...", "nom": "...", "prenom": "...", "email": "...", "role": "EMPLOYE", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 401 | `UNAUTHENTICATED` | Pas de jeton |
| 403 | `FORBIDDEN` | Rôle insuffisant |
| 400 | `VALIDATION_ERROR` | Valeur de `role` invalide |

---

## 6. GET /api/users/:id

Renvoie un utilisateur par son identifiant.

- **Rôles autorisés :** `ADMIN`.

**Réponse 200 :**

```json
{ "user": { "id": "...", "nom": "...", "prenom": "...", "email": "...", "role": "EMPLOYE", "createdAt": "...", "updatedAt": "..." } }
```

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | `:id` n'est pas un ObjectId valide |
| 401 | `UNAUTHENTICATED` | Pas de jeton |
| 403 | `FORBIDDEN` | Rôle insuffisant |
| 404 | `USER_NOT_FOUND` | Utilisateur introuvable |

---

## 7. POST /api/users

Crée un utilisateur.

- **Rôles autorisés :** `ADMIN`.
- **Corps :**

```json
{
  "nom": "Martin",
  "prenom": "Paul",
  "email": "paul@plateforme.local",
  "motDePasse": "MotDePasse123",
  "role": "EMPLOYE"
}
```

Validation : `nom` et `prenom` non vides, `email` valide, `motDePasse` ≥ 6 caractères, `role` dans l'énumération.

**Réponse 201 :**

```json
{ "user": { "id": "...", "nom": "Martin", "prenom": "Paul", "email": "paul@plateforme.local", "role": "EMPLOYE", "createdAt": "...", "updatedAt": "..." } }
```

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | Données invalides |
| 401 | `UNAUTHENTICATED` | Pas de jeton |
| 403 | `FORBIDDEN` | Rôle insuffisant |
| 409 | `EMAIL_TAKEN` | Email déjà utilisé |

**Règle métier :** l'email est unique (index unique) ; le mot de passe est haché avec bcrypt (10 rounds) avant stockage.

---

## 8. PUT /api/users/:id

Modifie un utilisateur. Au moins un champ doit être fourni.

- **Rôles autorisés :** `ADMIN`.
- **Corps (tous optionnels, au moins un) :**

```json
{ "nom": "Bernard", "email": "sophie@plateforme.local", "motDePasse": "Nouveau123!", "role": "CHEF_PROJET" }
```

**Réponse 200 :** utilisateur mis à jour (même forme qu'en création).

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | `:id` invalide, données invalides, ou aucun champ fourni |
| 401 | `UNAUTHENTICATED` | Pas de jeton |
| 403 | `FORBIDDEN` | Rôle insuffisant |
| 404 | `USER_NOT_FOUND` | Utilisateur introuvable |
| 409 | `EMAIL_TAKEN` | Email déjà utilisé par un autre utilisateur |

**Règle métier :** si le mot de passe est fourni, il est re-haché.

---

## 9. DELETE /api/users/:id

Supprime un utilisateur.

- **Rôles autorisés :** `ADMIN`.

**Réponse :** `204 No Content`

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | `:id` invalide |
| 401 | `UNAUTHENTICATED` | Pas de jeton |
| 403 | `FORBIDDEN` | Rôle insuffisant |
| 404 | `USER_NOT_FOUND` | Utilisateur introuvable |
| 409 | `CANNOT_DELETE_SELF` | Un administrateur ne peut pas supprimer son propre compte |

**Règle métier (anticipée) :** à partir du sprint 2, la suppression d'un employé possédant encore des tâches en cours renverra `409 EMPLOYEE_HAS_ACTIVE_TASKS`.

---

## 10. GET /api/employees

Liste les employés (utilisateurs de rôle `EMPLOYE`). Sert à l'affectation des tâches (sprint 2).

- **Rôles autorisés :** `ADMIN`, `CHEF_PROJET`.

**Réponse 200 :**

```json
{
  "data": [
    { "id": "...", "nom": "Martin", "prenom": "Paul", "email": "employe1@plateforme.local", "role": "EMPLOYE", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 401 | `UNAUTHENTICATED` | Pas de jeton |
| 403 | `FORBIDDEN` | Rôle insuffisant (employé) |

---

## Comptes de test (données de départ — `npm run seed`)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| ADMIN | `admin@plateforme.local` | `Admin123!` |
| CHEF_PROJET | `chef@plateforme.local` | `Chef123!` |
| EMPLOYE | `employe1@plateforme.local` | `Employe123!` |
| EMPLOYE | `employe2@plateforme.local` | `Employe123!` |

## Variables d'environnement (`.env.example`)

| Variable | Rôle |
|----------|------|
| `PORT` | Port d'écoute de l'API (4000) |
| `MONGODB_URI` | URI de connexion MongoDB |
| `JWT_SECRET` | Secret de signature des jetons (obligatoire en production) |
| `JWT_EXPIRES_IN` | Durée de validité du jeton (`8h`) |
| `FRONTEND_URL` | Origine autorisée par CORS (front-end Next.js, port 3000) |
| `NODE_ENV` | Environnement (`development` / `production`) |

## Hypothèses

1. **Champ mot de passe :** le champ s'appelle `motDePasse` (camelCase) dans les requêtes/réponses ; il est stocké haché et jamais renvoyé.
2. **Déconnexion (`logout`) :** le serveur est sans état (stateless). `POST /api/auth/logout` renvoie systématiquement 204, sans exiger de jeton : le front-end supprime le jeton localement. Interprétation la plus simple de « renvoie 204, le front supprime le jeton ».
3. **Suppression de son propre compte :** code `409 CANNOT_DELETE_SELF` (suppression interdite), conformément au regroupement « 409 = suppression interdite » du contrat global. Le code 403 est réservé au cas « rôle insuffisant ».
4. **`createdAt` / `updatedAt` :** inclus dans la réponse utilisateur (Mongoose `timestamps`), utiles au front-end ; non exigés par le prompt mais sans incidence.
5. **Validation du mot de passe :** longueur minimale de 6 caractères (choix simple) ; aucune règle de complexité imposée au sprint 0.
6. **Unicité de l'email :** index unique Mongoose + vérification applicative (`EMAIL_TAKEN` 409) pour un message d'erreur explicite en français.
7. **Liste des employés :** un employé = un utilisateur de rôle `EMPLOYE` (pas de modèle séparé).

## Modifications

Aucune modification de fichiers d'un sprint précédent (sprint 0 = démarrage du projet).

## Notes pour le sprint suivant

- La règle **« un employé ne peut pas être supprimé s'il possède encore des tâches en cours »** sera appliquée au **sprint 2** (`409 EMPLOYEE_HAS_ACTIVE_TASKS`), dès que le modèle Tâche existera. Le point de contrôle est déjà prévu dans `src/services/user.service.js`.
- La visibilité des projets pour les employés (projets auxquels ils participent) sera complétée au sprint 2, via les tâches.
