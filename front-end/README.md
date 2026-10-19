# Front-end — Plateforme de gestion de projets et tâches

Application Next.js (App Router) de gestion des projets, des tâches et des équipes
pour une entreprise informatique.

**Sprints livrés :**
- **Sprint 0** : fondations, authentification et gestion des utilisateurs.
- **Sprint 1** : gestion des projets (liste, détail, création, modification, suppression).

## Stack technique

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + composants **shadcn/ui** (style New York)
- **Axios** (client HTTP centralisé avec intercepteur de jeton et gestion du 401)
- **React Hook Form** + **Zod** (validation des formulaires)
- **Vitest** + **React Testing Library** + **jsdom** (tests unitaires)
- **ESLint** (config Next.js core-web-vitals)

## Prérequis

- Node.js 20+ (ou Bun)
- L'API back-end démarrée en local sur le port **4000** (voir le README du
  dossier `back-end/` : `npm install && npm run seed && npm run dev`).

## Installation

```bash
cd front-end
npm install
cp .env.example .env   # puis vérifier NEXT_PUBLIC_API_URL
```

## Variables d'environnement

Le fichier `.env.example` est versionné. Le fichier `.env` ne l'est **jamais**.

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | URL de base de l'API back-end (sans slash final) | `http://localhost:4000/api` |
| `NEXT_PUBLIC_API_TRANSFORM_PORT` | *(optionnel)* Port de transformation pour la passerelle de prévisualisation. Laisser vide en production. | _(vide)_ |

## Lancement

```bash
npm run dev      # démarre le serveur de développement sur le port 3000
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).
L'API back-end doit tourner sur le port 4000 (voir le README du `back-end/`).

## Tests

```bash
npm test          # mode watch (Vitest)
npm run test:run  # exécution unique
```

Couverture :

### Sprint 0
- **Formulaire de connexion** (`src/__tests__/login-form.test.tsx`) : rendu des
  champs, validation, appel de `login` avec les bonnes valeurs, message d'erreur
  sur identifiants incorrects, redirection si déjà authentifié.
- **Garde des pages protégées** (`src/__tests__/auth-guard.test.tsx`) : indicateur
  de chargement, redirection vers `/login` si non authentifié, affichage du
  contenu si authentifié, redirection vers `/forbidden` si rôle insuffisant.

### Sprint 1
- **Formulaire de création de projet** (`src/__tests__/project-form.test.tsx`) :
  rendu des champs, validation (nom et dates obligatoires), erreur si date de fin
  antérieure à la date de début, appel de `createProject` avec les bonnes valeurs,
  redirection après succès, erreur de nom déjà utilisé (`PROJECT_NAME_TAKEN`)
  affichée sous le champ nom.

## Linter

```bash
npm run lint
```

## Build de production

```bash
npm run build
```

## Comptes de test (données de départ du back-end — `npm run seed`)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| ADMIN | `admin@plateforme.local` | `Admin123!` |
| CHEF_PROJET | `chef@plateforme.local` | `Chef123!` |
| EMPLOYE | `employe1@plateforme.local` | `Employe123!` |
| EMPLOYE | `employe2@plateforme.local` | `Employe123!` |

## Écrans livrés

### Sprint 0 — Authentification et utilisateurs

| Écran | Route | Rôles | Description |
|-------|-------|-------|-------------|
| Connexion | `/login` | public | Formulaire validé, message d'erreur sur identifiants incorrects, redirection selon le rôle. |
| Tableau de bord | `/dashboard` | tous | Accueil par rôle. |
| Liste des utilisateurs | `/users` | ADMIN | Recherche, filtre par rôle, modifier/supprimer (confirmation). |
| Création d'utilisateur | `/users/new` | ADMIN | Formulaire (nom, prénom, email, mot de passe ≥ 6, rôle). |
| Modification d'utilisateur | `/users/:id/edit` | ADMIN | Formulaire pré-rempli, mot de passe optionnel. |
| Employés | `/employees` | ADMIN | Liste en lecture seule des employés. |
| Accès refusé | `/forbidden` | tous | Page 403. |
| Page introuvable | *(route inconnue)* | tous | Page 404. |

### Sprint 1 — Gestion des projets

| Écran | Route | Rôles | Description |
|-------|-------|-------|-------------|
| Liste des projets | `/projects` | tous (visibilité par rôle) | Tableau (nom, dates, badge de statut). Bouton « Créer » pour CHEF_PROJET. Actions modifier/supprimer réservées au propriétaire. |
| Création de projet | `/projects/new` | CHEF_PROJET | Formulaire (nom, description, dateDebut, dateFin) avec validation des dates et erreur de nom déjà utilisé sous le champ. |
| Détail d'un projet | `/projects/:id` | tous (visibilité par rôle) | Toutes les informations du projet (description, dates, statut, chef de projet, dates de création/maj). Boutons modifier/supprimer pour le propriétaire. |
| Modification de projet | `/projects/:id/edit` | CHEF_PROJET propriétaire | Formulaire pré-rempli, validation des dates, erreur `PROJECT_NAME_TAKEN`. |

## Fonctionnalités clés

- **Authentification JWT** : jeton dans `localStorage`, ajouté par intercepteur
  Axios. Une réponse 401 déconnecte et redirige vers `/login`.
- **Rechargement de session** au démarrage via `GET /api/auth/me`.
- **Garde de rôle côté client** (`AuthGuard`) : le jeton étant dans `localStorage`,
  la protection se fait côté client (redirection `/login` ou `/forbidden`).
- **Navigation adaptée au rôle** : tous voient « Tableau de bord » et « Projets » ;
  l'ADMIN voit aussi « Utilisateurs » et « Employés ».
- **Gestion des projets** :
  - Visibilité par rôle : ADMIN voit tous les projets, CHEF_PROJET voit les siens,
    EMPLOYE voit ceux auxquels il participe (liste vide au sprint 1).
  - Le statut d'un projet (`NON_COMMENCE`/`EN_COURS`/`TERMINE`) est calculé par
    le serveur et affiché sous forme de badge coloré — l'interface ne permet
    jamais de le modifier.
  - Le nom d'un projet est unique (insensible à la casse) ; l'erreur
    `PROJECT_NAME_TAKEN` s'affiche sous le champ nom.
  - La date de fin doit être ≥ à la date de début (validation front + serveur
    `DATE_RANGE_INVALID`).
  - Suppression avec confirmation, réservée au chef de projet propriétaire.
  - ADMIN et EMPLOYE consultent seulement : aucun bouton de création,
    modification ni suppression.
- **États gérés** sur chaque écran : chargement (squelettes), liste vide, erreur
  (avec bouton de réessai).
- **Notifications** (toaster) : succès et erreurs.
- **Interface en français**, adaptée aux ordinateurs et aux tablettes.

## Structure du code

```
src/
├── app/
│   ├── layout.tsx, providers.tsx, page.tsx     # Layout racine + redirection
│   ├── login/, forbidden/, not-found.tsx       # Pages publiques
│   └── (app)/                                  # Routes authentifiées
│       ├── layout.tsx                          # En-tête + nav + garde
│       ├── dashboard/
│       ├── users/                              # Sprint 0 (ADMIN)
│       ├── employees/                          # Sprint 0 (ADMIN)
│       └── projects/                           # Sprint 1
│           ├── page.tsx                        # Liste
│           ├── new/page.tsx                    # Création
│           └── [id]/
│               ├── page.tsx                    # Détail
│               └── edit/page.tsx              # Modification
├── api/
│   ├── client.ts, auth.ts, users.ts, employees.ts   # Sprint 0
│   └── projects.ts                                   # Sprint 1
├── components/
│   ├── AuthGuard, AppHeader, RoleBadge, EmptyState, ErrorState
│   ├── ProjectStatusBadge.tsx                 # Sprint 1
│   └── ui/                                     # shadcn/ui
├── context/AuthContext.tsx
├── lib/format.ts                               # Libellés, dates, erreurs
├── types/index.ts                              # User, Project, ApiError…
└── __tests__/                                  # Tests Vitest
```

## Scénario de test manuel

### Sprint 0 — Authentification et utilisateurs
1. **Connexion admin** (`admin@plateforme.local` / `Admin123!`) → `/users`.
2. Créer, modifier, supprimer un utilisateur (confirmation). Le bouton de
   suppression de son propre compte est désactivé.
3. Consulter la vue « Employés ».
4. Se déconnecter, se connecter en employé (`employe1@plateforme.local` /
   `Employe123!`) → `/dashboard`, navigation limitée.
5. En tant qu'employé, saisir `/users` → `/forbidden` (403).

### Sprint 1 — Gestion des projets
6. **Connexion chef de projet** (`chef@plateforme.local` / `Chef123!`).
7. Aller sur « Projets » → la liste affiche les projets du chef (2 projets au
   départ : Projet Alpha, Projet Beta).
8. Cliquer « Créer un projet » → remplir le formulaire (nom, description,
   dates) → valider → le projet apparaît dans la liste.
9. Tenter de créer un projet avec une date de fin antérieure à la date de début
   → erreur sous le champ dateFin.
10. Tenter de créer un projet avec un nom déjà utilisé → erreur « Ce nom de
    projet est déjà utilisé » sous le champ nom.
11. Cliquer sur un projet → page de détail (description, dates, statut « Non
    commencé », boutons Modifier/Supprimer).
12. Modifier le projet → formulaire pré-rempli, changer le nom, enregistrer →
    retour au détail avec le nouveau nom.
13. Supprimer le projet → dialogue de confirmation → confirmer → le projet
    disparaît de la liste.
14. **Connexion admin** → « Projets » → voit tous les projets mais **aucun
    bouton** Créer/Modifier/Supprimer (lecture seule).
15. **Connexion employé** → « Projets » → liste vide (aucun projet, aucun
    bouton de création).

## Points bloquants

Aucun point bloquant. Les contrats d'API Sprint 0 et Sprint 1 sont complets et
tous les endpoints sont implémentés côté front-end.
