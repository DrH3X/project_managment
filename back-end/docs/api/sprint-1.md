# Contrat d'API — Sprint 1

**Périmètre :** gestion des projets.
**Préfixe :** `/api` — **Port :** 4000 — **Format :** JSON — **Authentification :** Bearer JWT sur toutes les routes `/api/projects`.

Ce sprint s'appuie sur le sprint 0 (authentification, utilisateurs). Les conventions d'erreurs et de formats sont identiques (voir `sprint-0.md`).

## Objet Projet

```json
{
  "id": "65a1f0c2e4b0a1a2b3c4d5e6",
  "nom": "Projet Alpha",
  "description": "Description du projet",
  "dateDebut": "2025-01-01T00:00:00.000Z",
  "dateFin": "2025-12-31T00:00:00.000Z",
  "statut": "NON_COMMENCE",
  "chefProjet": "65a1f0c2e4b0a1a2b3c4d5e7",
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-01T10:00:00.000Z"
}
```

- `statut` : `NON_COMMENCE` | `EN_COURS` | `TERMINE`. Au sprint 1, seule la valeur `NON_COMMENCE` est utilisée (statut initial forcé à la création, non modifiable par l'API). Le calcul automatique du statut à partir des tâches sera ajouté au sprint 3.
- `chefProjet` : identifiant (chaîne) du chef de projet propriétaire.
- Le `nom` est **unique** (index unique avec collation insensible à la casse).

---

## 1. POST /api/projects

Crée un projet. Le propriétaire est l'utilisateur connecté (doit être CHEF_PROJET). Le statut initial est `NON_COMMENCE` et ne peut pas être modifié par l'API.

- **Rôles autorisés :** `CHEF_PROJET`.
- **Corps :**

```json
{
  "nom": "Projet Alpha",
  "description": "Description optionnelle",
  "dateDebut": "2025-01-01",
  "dateFin": "2025-12-31"
}
```

| Champ | Règle |
|-------|-------|
| `nom` | obligatoire, non vide, unique (insensible à la casse) |
| `description` | optionnel, chaîne (défaut `""`) |
| `dateDebut` | obligatoire, date ISO valide |
| `dateFin` | obligatoire, date ISO valide, `>= dateDebut` |
| `statut` | **ignoré** si envoyé (forcé à `NON_COMMENCE`) |

**Réponse 201 :**

```json
{ "project": { "id": "...", "nom": "Projet Alpha", "description": "...", "dateDebut": "...", "dateFin": "...", "statut": "NON_COMMENCE", "chefProjet": "...", "createdAt": "...", "updatedAt": "..." } }
```

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | Nom manquant ou date invalide |
| 401 | `UNAUTHENTICATED` | Pas de jeton |
| 403 | `FORBIDDEN` | Rôle insuffisant (ADMIN, EMPLOYE) |
| 409 | `PROJECT_NAME_TAKEN` | Nom déjà utilisé (insensible à la casse) |
| 422 | `DATE_RANGE_INVALID` | `dateFin` < `dateDebut` |

---

## 2. GET /api/projects

Liste les projets selon la visibilité par rôle.

- **Rôles autorisés :** tous les utilisateurs connectés.
- **Visibilité :**
  - `ADMIN` : tous les projets.
  - `CHEF_PROJET` : ses projets seulement.
  - `EMPLOYE` : projets auxquels il participe (liste vide au sprint 1, complétée au sprint 2 via les tâches).

**Réponse 200 :**

```json
{
  "data": [
    { "id": "...", "nom": "...", "description": "...", "dateDebut": "...", "dateFin": "...", "statut": "NON_COMMENCE", "chefProjet": "...", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 401 | `UNAUTHENTICATED` | Pas de jeton |

---

## 3. GET /api/projects/:id

Renvoie un projet par son identifiant, avec la même visibilité que la liste.

- **Rôles autorisés :** tous les utilisateurs connectés (sous réserve de visibilité).

**Réponse 200 :**

```json
{ "project": { "id": "...", "nom": "...", "description": "...", "dateDebut": "...", "dateFin": "...", "statut": "NON_COMMENCE", "chefProjet": "...", "createdAt": "...", "updatedAt": "..." } }
```

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | `:id` invalide |
| 401 | `UNAUTHENTICATED` | Pas de jeton |
| 403 | `FORBIDDEN` | Projet non visible par l'utilisateur |
| 404 | `PROJECT_NOT_FOUND` | Projet introuvable |

---

## 4. PUT /api/projects/:id

Modifie un projet. Réservé au chef de projet propriétaire. ADMIN consulte seulement. Le `statut` ne peut pas être modifié par cette route.

- **Rôles autorisés :** `CHEF_PROJET` propriétaire.
- **Corps (au moins un champ) :**

```json
{ "nom": "Projet Renommé", "description": "Nouvelle description", "dateDebut": "2025-02-01", "dateFin": "2025-11-30" }
```

Tous les champs sont optionnels (au moins un obligatoire). `statut` est ignoré si envoyé.

**Réponse 200 :** projet mis à jour (même forme qu'en création).

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | `:id` invalide, date invalide, ou aucun champ fourni |
| 401 | `UNAUTHENTICATED` | Pas de jeton |
| 403 | `FORBIDDEN` | Non propriétaire (ADMIN, autre chef, EMPLOYE) |
| 404 | `PROJECT_NOT_FOUND` | Projet introuvable |
| 409 | `PROJECT_NAME_TAKEN` | Nouveau nom déjà utilisé |
| 422 | `DATE_RANGE_INVALID` | Dates modifiées incohérentes (`dateFin` < `dateDebut`) |

---

## 5. DELETE /api/projects/:id

Supprime un projet. Réservé au chef de projet propriétaire.

- **Rôles autorisés :** `CHEF_PROJET` propriétaire.

**Réponse :** `204 No Content`

**Erreurs :**

| HTTP | Code | Cause |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | `:id` invalide |
| 401 | `UNAUTHENTICATED` | Pas de jeton |
| 403 | `FORBIDDEN` | Non propriétaire |
| 404 | `PROJECT_NOT_FOUND` | Projet introuvable |
| 409 | `PROJECT_HAS_TASKS` | *(Sprint 2)* Le projet possède encore des tâches |

---

## Règles métier appliquées (sprint 1)

- Le nom d'un projet est **unique**, de façon **insensible à la casse** (index unique MongoDB avec collation `strength: 2` + vérification applicative renvoyant `409 PROJECT_NAME_TAKEN`).
- `dateFin` doit être **supérieure ou égale** à `dateDebut` (bornes incluses), à la création et à la modification → `422 DATE_RANGE_INVALID`.
- Le **statut** est `NON_COMMENCE` à la création et **non modifiable par l'API** (champ ignoré s'il est envoyé dans le corps). Le calcul automatique sera ajouté au sprint 3.
- Le **propriétaire** (`chefProjet`) est l'utilisateur connecté lors de la création ; il ne peut pas être changé par l'API.
- **Visibilité** :
  - `ADMIN` consulte tous les projets (lecture seule).
  - `CHEF_PROJET` ne voit et ne modifie que **ses** projets.
  - `EMPLOYE` voit les projets auxquels il participe (liste vide au sprint 1, via les tâches au sprint 2).

## Modifications du contrat d'API (sprints précédents)

- `back-end/src/routes/index.js` (modifié) : enregistrement de la route `/api/projects`. Aucune logique métier du sprint 0 n'a été touchée ; les tests du sprint 0 continuent de passer.
- `back-end/README.md` (modifié) : mise à jour de la progression (sprint 1).

## Comptes de test

Identiques au sprint 0 (voir `sprint-0.md`). Les projets sont créés par les chefs de projet via l'API ; aucun projet n'est ajouté au script de seed au sprint 1.

## Variables d'environnement

Aucune variable nouvelle (voir `sprint-0.md`).

## Hypothèses

1. **Visibilité EMPLOYE (sprint 1) :** un employé reçoit une liste vide sur `GET /api/projects` et un `403 FORBIDDEN` sur `GET /api/projects/:id`, car la participation se détermine via les tâches (sprint 2). Interprétation la plus simple de « liste vide tant que les tâches n'existent pas ».
2. **Accès refusé = 403 :** un projet existant mais non visible par l'utilisateur renvoie `403 FORBIDDEN` (et non 404), conformément au regroupement « 403 = accès non autorisé » du contrat global. Le `404` est réservé au cas où le projet n'existe pas du tout.
3. **Collation du nom :** `strength: 2` (insensible à la casse, sensible aux accents) : « Projet A » et « projet a » sont en conflit, mais « café » et « cafe » ne le sont pas. Choix cohérent avec « insensible à la casse ».
4. **`statut` ignoré :** si un client envoie `statut` dans le corps (création ou modification), le champ est ignoré (Zod le supprime), le statut reste `NON_COMMENCE`. La modification du statut par l'API sera possible au sprint 3 (calcul automatique) — pas avant.
5. **`description` :** chaîne optionnelle, vide par défaut. La mettre à `""` via PUT est autorisé.
6. **Suppression d'un projet ayant des tâches :** non bloquée au sprint 1 (règle `409 PROJECT_HAS_TASKS` appliquée au sprint 2, point de contrôle prévu dans `src/services/project.service.js`).
7. **Aucun changement de propriétaire :** `chefProjet` ne peut pas être modifié par l'API (non présent dans les schémas de validation).

## Notes pour le sprint suivant (sprint 2)

- Ajouter le **blocage de suppression** d'un projet possédant des tâches (`409 PROJECT_HAS_TASKS`).
- Compléter la **visibilité EMPLOYE** sur `GET /api/projects` et `GET /api/projects/:id` via les tâches assignées.
- Appliquer la **cohérence de la date limite** d'une tâche avec les dates du projet (`422 DEADLINE_OUT_OF_PROJECT`).
