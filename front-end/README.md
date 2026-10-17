# Front-end — Plateforme de gestion de projets et tâches

Application Next.js (App Router) de gestion des projets, des tâches et des équipes
pour une entreprise informatique. **Sprint 0 livré** : fondations, authentification
et gestion des utilisateurs.

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

Couverture du Sprint 0 :

- **Formulaire de connexion** (`src/__tests__/login-form.test.tsx`) : rendu des
  champs, validation (email obligatoire et valide, mot de passe obligatoire),
  appel de `login` avec les bonnes valeurs, message d'erreur sur identifiants
  incorrects (`INVALID_CREDENTIALS`), redirection si déjà authentifié.
- **Garde des pages protégées** (`src/__tests__/auth-guard.test.tsx`) :
  indicateur de chargement, redirection vers `/login` si non authentifié,
  affichage du contenu si authentifié, redirection vers `/forbidden` si le rôle
  est insuffisant.

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

## Écrans livrés (Sprint 0)

| Écran | Route | Rôles | Description |
|-------|-------|-------|-------------|
| Connexion | `/login` | public | Formulaire validé (email + mot de passe), message d'erreur clair sur identifiants incorrects, redirection selon le rôle après connexion. |
| Tableau de bord | `/dashboard` | tous | Accueil par rôle (raccourcis ADMIN, message d'accueil CHEF_PROJET/EMPLOYE). |
| Liste des utilisateurs | `/users` | ADMIN | Tableau avec recherche, filtre par rôle, boutons modifier/supprimer, suppression désactivée pour son propre compte. |
| Création d'utilisateur | `/users/new` | ADMIN | Formulaire (nom, prénom, email, mot de passe ≥ 6, rôle) avec validation et erreur d'email déjà utilisé. |
| Modification d'utilisateur | `/users/:id/edit` | ADMIN | Formulaire pré-rempli, mot de passe optionnel, gestion `EMAIL_TAKEN`. |
| Employés | `/employees` | ADMIN | Liste en lecture seule des utilisateurs de rôle EMPLOYE. |
| Accès refusé | `/forbidden` | tous | Page 403. |
| Page introuvable | *(toute route inconnue)* | tous | Page 404. |

## Fonctionnalités clés

- **Authentification JWT** : le jeton est stocké dans `localStorage` et ajouté
  automatiquement à chaque requête par un intercepteur Axios. Une réponse 401
  déconnecte l'utilisateur et le renvoie à la page de connexion.
- **Rechargement de session** : au démarrage, si un jeton existe, l'utilisateur
  courant est rechargé via `GET /api/auth/me`.
- **Garde de rôle côté client** : le composant `AuthGuard` vérifie
  l'authentification et le rôle ; le jeton étant dans `localStorage`, le
  middleware Next.js ne peut pas le lire, la protection se fait donc côté client.
- **Navigation adaptée au rôle** :
  - ADMIN : Tableau de bord, Utilisateurs, Employés.
  - CHEF_PROJET : Tableau de bord.
  - EMPLOYE : Tableau de bord.
- **États gérés** sur chaque écran : chargement (squelettes), liste vide, erreur
  (avec bouton de réessai).
- **Notifications** (toaster) : succès et erreurs lors des actions.
- **Suppression avec confirmation** (dialogue) et gestion de l'erreur
  `CANNOT_DELETE_SELF`.
- **Interface en français**, adaptée aux ordinateurs et aux tablettes (menu
  coulissant en dessous de `lg`).

## Structure du code

```
src/
├── app/
│   ├── layout.tsx              # Layout racine (Providers : Auth + Toaster)
│   ├── page.tsx                # Redirection selon auth/role
│   ├── providers.tsx           # Fournisseurs client
│   ├── login/page.tsx          # Page de connexion
│   ├── forbidden/page.tsx      # Page 403
│   ├── not-found.tsx           # Page 404
│   └── (app)/                  # Groupe de routes authentifiées
│       ├── layout.tsx          # En-tête + nav + garde AuthGuard
│       ├── dashboard/page.tsx
│       ├── users/              # Liste, création, modification (ADMIN)
│       └── employees/page.tsx # Vue Employés (ADMIN)
├── api/                        # Appels à l'API
│   ├── client.ts               # Instance Axios + intercepteurs
│   ├── auth.ts                 # login, fetchMe, logout
│   ├── users.ts                # CRUD utilisateurs
│   └── employees.ts            # Liste employés
├── components/
│   ├── AuthGuard.tsx           # Garde d'authentification et de rôle
│   ├── AppHeader.tsx           # En-tête + navigation (rôle-adaptée)
│   ├── RoleBadge.tsx           # Badge de rôle coloré
│   ├── EmptyState.tsx          # État de liste vide
│   ├── ErrorState.tsx          # État d'erreur
│   └── ui/                     # Composants shadcn/ui
├── context/
│   └── AuthContext.tsx         # Contexte d'authentification
├── hooks/                      # Hooks (use-toast, use-mobile)
├── lib/
│   ├── utils.ts                # cn()
│   └── format.ts               # Libellés, formatage dates, erreurs
├── types/
│   └── index.ts                # Types TS (User, Role, ApiError…)
└── __tests__/                  # Tests Vitest
    ├── login-form.test.tsx
    └── auth-guard.test.tsx
```

## Scénario de test manuel

1. **Connexion admin** : ouvrir `/login`, saisir `admin@plateforme.local` /
   `Admin123!` → redirection vers `/users`. La liste affiche 4 utilisateurs.
2. **Création** : cliquer « Créer un utilisateur », remplir le formulaire,
   valider → l'utilisateur apparaît dans la liste.
3. **Modification** : cliquer l'icône crayon d'un utilisateur → le formulaire
   est pré-rempli, modifier le nom, enregistrer → toast de succès.
4. **Suppression** : cliquer l'icône corbeille d'un utilisateur → dialogue de
   confirmation → confirmer → l'utilisateur disparaît. Le bouton de suppression
   de son propre compte est désactivé.
5. **Vue Employés** : cliquer « Employés » → seuls les utilisateurs de rôle
   EMPLOYE s'affichent.
6. **Déconnexion** : cliquer l'icône déconnexion → retour à `/login`.
7. **Connexion employé** : saisir `employe1@plateforme.local` / `Employe123!`
   → redirection vers `/dashboard`. La navigation ne contient que « Tableau de
   bord ».
8. **Accès refusé** : en tant qu'employé, saisir `/users` dans la barre
   d'adresse → redirection vers `/forbidden` (page 403).

## Points bloquants

Aucun point bloquant pour ce sprint. Le contrat d'API Sprint 0 est complet et
tous les endpoints sont implémentés côté front-end.
