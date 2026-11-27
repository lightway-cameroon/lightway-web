# Guide pour les agents de développement — `lightway-web`

Ce document récapitule l'architecture, les règles de couches, les ports transverses et les consignes d'évolution pour tout agent ou développeur travaillant sur `lightway-web`.

---

## 1. Principes d'architecture (Clean Architecture & SOLID)

Chaque fonctionnalité métier est située dans `src/app/features/<nom>/` et découpée strictement en 4 couches :

| Couche             | Dossier           | Responsabilité & Règles                                                                                                                                                                  |
| ------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domaine**        | `domain/`         | TypeScript pur (`entities/`, `value-objects/`, `services/`, `ports/`). **Aucun** import de `@angular/*`, `@apollo/*`, `rxjs` ou `core/` hors types.                                      |
| **Application**    | `application/`    | Cas d'utilisation (`use-cases/`). Chaque cas d'utilisation est une classe pure dépendant uniquement des interfaces/ports du domaine ou de `core/`.                                       |
| **Infrastructure** | `infrastructure/` | Adaptateurs des ports (`graphql/`, `mappers/`). Appelle `GraphqlExecutor` de `core/` et mappe les DTOs en entités du domaine.                                                            |
| **Présentation**   | `presentation/`   | Pages (`pages/`), composants (`components/`), façades à signaux (`facades/`). N'appelle que les cas d'utilisation applicatifs. **Interdiction d'importer l'infrastructure directement**. |
| **Composition**    | `*.routes.ts`     | Point d'assemblage où les fournisseurs (`providers`) et adaptateurs d'infrastructure sont injectés pour la fonctionnalité.                                                               |

> **Consigne d'or** : Une nouvelle fonctionnalité = un dossier `src/app/features/<nom>` avec ses 4 couches. Ses fournisseurs (`providers`) sont enregistrés **dans sa route dédiée** (`<nom>.routes.ts`), **jamais dans `app.config.ts`**.

---

## 2. Règles de dépendances (vérifiées par `dependency-cruiser`)

- `features/*/domain` et `features/*/application` : interdiction absolue d'importer `@angular/*`, `@apollo/*`, `rxjs`, `core/graphql`, les adaptateurs matériels de notification, `shared/` ou `layout/`.
- `features/*/presentation` : interdiction d'importer directement `infrastructure/`.
- Isolation inter-fonctionnalités : `features/<A>/**` ne doit **jamais** importer `features/<B>/**`. Le partage passe obligatoirement par `shared/` ou `core/`.
- `core/**` ne doit **jamais** dépendre de `features/**`, `layout/**` ou `shared/**`.
- Aucun cycle de dépendance n'est toléré.
- Commande de vérification : `pnpm lint:arch`.

---

## 3. Ports transverses disponibles dans `core/`

Les services transverses sont fournis sous forme de **ports** (`interface` + `InjectionToken`), utilisables via injection sans dépendre de leur implémentation concrète :

1. **Configuration** : `APP_CONFIG` (`AppConfig`)
2. **Journalisation** : `LOGGER` (`Logger`) — sans données personnelles (`password`, `token`, etc.).
3. **Erreurs** :
   - `ERROR_MAPPER` (`ErrorMapper`)
   - `ERROR_REPORTER` (`ErrorReporter`)
   - `GlobalErrorHandler` (`ErrorHandler`)
4. **Notifications / Toasts** : `NOTIFIER` (`Notifier`)
5. **Connectivité** : `CONNECTIVITY_MONITOR` (`ConnectivityMonitor`)
6. **Temps & Aléas** :
   - `CLOCK` (`Clock`)
   - `ID_GENERATOR` (`IdGenerator`)
7. **Authentification & Session** :
   - `TOKEN_STORE` (`TokenStore`)
   - `AUTH_GATEWAY` (`AuthGateway`)
   - `SessionManager` (service root)
8. **Permissions** : `PERMISSION_POLICY` (`PermissionPolicy`)
9. **Exécution GraphQL** :
   - `GRAPHQL_EXECUTOR` (`GraphqlExecutor`)
   - `CACHE_RESETTER` (`CacheResetter`)

---

## 4. Contrats de codage

1. **Typage strict** : Pas de `any`. Toujours `Result<T, AppError>` pour les erreurs prévues (`ok(value)` / `fail(error)`).
2. **Composants** :
   - `ChangeDetectionStrategy.OnPush` sur tous les composants.
   - Composants autonomes uniquement (`standalone: true` / Angular 22+).
   - Signaux Angular privilégiés pour l'état réactif local.
3. **i18n** :
   - Aucun texte codé en dur dans les gabarits ou le code.
   - Clés Transloco systématiques dans `src/assets/i18n/fr.json` et `en.json`.
4. **Sécurité** :
   - Aucun jeton dans `localStorage` ou `sessionStorage`.
   - Jeton d'accès conservé en mémoire (`MemoryTokenStore`). Jeton de renouvellement via cookie HttpOnly géré par la gateway.
