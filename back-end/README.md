# Back-end — Plateforme de gestion de projets et tâches

API REST (Node.js / Express / MongoDB) pour la gestion des projets et des tâches.

## Stack

- Node.js LTS + Express
- MongoDB + Mongoose
- JWT (authentification), bcrypt (hash des mots de passe)
- Zod (validation des entrées), CORS limité au front-end
- Jest + Supertest + mongodb-memory-server (tests)
- ESLint (flat config)

## Structure (architecture en couches)

```
back-end/
├── src/
│   ├── app.js                 # Application Express (middlewares + routes)
│   ├── server.js              # Démarrage (connexion MongoDB + écoute)
│   ├── config/env.js          # Configuration par variables d'environnement
│   ├── models/                # Modèles Mongoose
│   ├── middlewares/           # auth, role, validate, error
│   ├── validators/            # Schémas Zod
│   ├── repositories/          # Accès aux données (Mongoose)
│   ├── services/              # Logique métier
│   ├── controllers/           # Contrôleurs HTTP
│   ├── routes/                # Définition des routes API
│   └── utils/                 # ApiError, asyncHandler, serializers
├── scripts/seed.js            # Données de départ
├── tests/                     # Tests Jest + Supertest
├── docs/api/                  # Contrats d'API par sprint
├── .env.example
├── eslint.config.js
└── jest.config.js
```

## Installation

```bash
cd back-end
cp .env.example .env       # puis éditer .env (MONGODB_URI, JWT_SECRET, FRONTEND_URL)
npm install
```

## Données de départ

```bash
npm run seed
```

Crée : 1 administrateur, 1 chef de projet, 2 employés (voir `docs/api/sprint-0.md`).

## Lancement

```bash
npm run dev     # développement (redémarrage auto)
# ou
npm start       # production
```

L'API écoute sur le port **4000** (variable `PORT`). Le front-end Next.js tourne sur le port **3000`.

## Tests

```bash
npm test        # Jest + Supertest (base MongoDB en mémoire)
```

## Linter

```bash
npm run lint
```

## Documentation API

- `docs/api/sprint-0.md` — contrat détaillé du sprint 0 (fondations, authentification, utilisateurs).

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `PORT` | Port d'écoute (4000) |
| `MONGODB_URI` | URI MongoDB |
| `JWT_SECRET` | Secret JWT (obligatoire en production) |
| `JWT_EXPIRES_IN` | Durée de validité du jeton (`8h`) |
| `FRONTEND_URL` | Origine autorisée par CORS (port 3000) |
| `NODE_ENV` | `development` / `production` |

## Avancement

- **Sprint 0 ✅** — Fondations, authentification, utilisateurs, employés.
