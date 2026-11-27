# Lightway Web — Console d'Administration

Console d'administration web du projet Lightway, développée avec **Angular 22** en Clean Architecture stricte (4 couches + composition de routes), **pnpm**, **Apollo Client**, **Transloco** et **Angular Material**.

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** : `>= 22.12.0`
- **pnpm** : `12.23.0` (défini via `packageManager`)

### Installation

```bash
pnpm install
```

### Lancement en développement

```bash
# Générer les types GraphQL et démarrer le serveur de développement local (port 4200)
pnpm start
```

### Construction pour production

```bash
pnpm build
```

---

## 🛠️ Scripts disponibles

| Script              | Rôle                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| `pnpm start`        | Démarre l'application en mode développement (`ng serve`)                         |
| `pnpm build`        | Compile l'application en mode production dans `dist/lightway-web`                |
| `pnpm test`         | Exécute la suite de tests unitaires avec Vitest (`ng test`)                      |
| `pnpm lint`         | Valide les règles ESLint sur le code TypeScript et gabarits                      |
| `pnpm lint:arch`    | Vérifie l'isolation des couches et règles architecturales (`dependency-cruiser`) |
| `pnpm format:check` | Vérifie le formatage Prettier de l'ensemble des fichiers                         |
| `pnpm format:write` | Formate automatiquement tous les fichiers du projet avec Prettier                |
| `pnpm codegen`      | Compile et génère les documents et types GraphQL typés (`graphql-codegen`)       |
| `pnpm schema:sync`  | Synchronise le schéma GraphQL depuis la gateway vers `schema/schema.graphql`     |

---

## 🏗️ Architecture du projet

Le projet applique une **Clean Architecture** stricte et modulaire :

```
src/app/
├── core/                       # Services et ports transverses du noyau
│   ├── config/                 # Configuration applicative (APP_CONFIG)
│   ├── time/                   # Ports temporels et idempotence (CLOCK, ID_GENERATOR, RetryPolicy)
│   ├── logging/                # Journalisation sans PII (LOGGER)
│   ├── errors/                 # Modèle Result<T, AppError>, ErrorMapper, ErrorReporter, ErrorHandler
│   ├── notifications/          # Toasts et notifications Material (NOTIFIER)
│   ├── connectivity/           # Machine à états réseau (CONNECTIVITY_MONITOR)
│   ├── auth/                   # Session, TokenStore en mémoire, AuthGateway, Guards (authGuard, roleGuard)
│   ├── permissions/            # Rôles et permissions (PERMISSION_POLICY, HasPermissionDirective)
│   ├── graphql/                # Apollo Client, GraphqlExecutor, CacheResetter, Pipeline de liens
│   ├── i18n/                   # Transloco, préférences de langue
│   └── testing/                # Faux services et utilitaires de test unitaire
├── features/                   # Fonctionnalités métier isolées
│   ├── accounts/               # Gestion des comptes administrateurs et modérateurs
│   ├── audit/                  # Journal d'audit et sécurité
│   ├── profile/                # Profil de l'utilisateur connecté
│   ├── auth/                   # Page de connexion et réinitialisation
│   ├── referential/            # Référentiel des lignes et arrêts (Phase 2)
│   ├── report-moderation/      # Modération des signalements (Phase 2)
│   └── alert-settings/         # Paramètres d'alerte (Phase 2)
├── layout/                     # Coque principale, barre de navigation, menu utilisateur, bannière hors ligne
└── shared/                     # Composants UI partagés, pipes, directives
```

### Règles de dépendance

1. **Isolation des fonctionnalités** : `features/<A>/**` ne dépend jamais de `features/<B>/**`.
2. **Couches d'une fonctionnalité** :
   - `domain/` : TypeScript pur (aucun import Angular/RxJS).
   - `application/` : Cas d'utilisation applicatifs.
   - `infrastructure/` : Adaptateurs GraphQL et mappers de données.
   - `presentation/` : Composants et pages autonomes OnPush (aucun import direct de l'infrastructure).
   - `*.routes.ts` : Point d'assemblage où les fournisseurs sont injectés.
3. **Sécurité des jetons** : Aucun jeton n'est stocké dans `localStorage` ou `sessionStorage`. Le jeton d'accès est conservé en mémoire (`MemoryTokenStore`), et le renouvellement s'effectue via cookie `HttpOnly` géré par la passerelle API.
4. **Validation de l'architecture** : La commande `pnpm lint:arch` garantit le respect continu de ces frontières via `dependency-cruiser`.

---

## 🌍 Environnements

Les fichiers d'environnement sont situés dans `src/environments/` :

- `environment.ts` (ou `environment.development.ts`) : Point d'accès local (`http://localhost:4000/graphql`).
- `environment.preprod.ts` : Environnement de recette (`https://api.preprod.lightway.cm/graphql`).
- `environment.production.ts` : Production (`https://api.lightway.cm/graphql`).
