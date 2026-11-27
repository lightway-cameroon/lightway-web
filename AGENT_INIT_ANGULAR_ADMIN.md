# AGENT_INIT_ANGULAR_ADMIN.md — Initialisation du dépôt `lightway-web`

> Destinataire : un agent de développement. Lis tout ce fichier avant d'agir.
> Projet : LightWay Cameroon, application web d'administration (Angular).
> Les dépôts du projet sont `lightway-backend`, `lightway-web` (celui-ci) et `lightway-mobile`. Ce dépôt est **autonome** : le backend et l'application mobile (Expo) vivent dans d'autres dépôts. **Aucun fichier, paquet ou dossier n'est partagé entre ces dépôts.** Tout ce qui est « partagé » dans ce document l'est entre les fonctionnalités de CE dépôt (`core/` et `shared/`). N'installe ni monorepo, ni Nx, ni paquet interne.

## 0. Objectif et règle de travail

1. Créer le projet Angular et **toute l'arborescence** décrite en §3.
2. **Implémenter réellement** les éléments partagés marqués `[IMPL]` (gestion des erreurs, notifications, connectivité, session, journal, configuration, client GraphQL, langue, droits, composants d'interface de base, coque de l'application).
3. Pour tout dossier marqué `[KEEP]` (les fonctionnalités métier : `features/*`), ne créer **que** un fichier `.gitkeep`, plus les fichiers de route vides indiqués. Ne pas inventer de logique métier.
4. Chaque dossier de l'arborescence qui ne contient aucun fichier réel reçoit un `.gitkeep`. Un dossier qui contient un fichier réel n'a pas de `.gitkeep`.
5. Respecter la Clean Architecture et SOLID (§2). Si une consigne est ambiguë, choisir l'option la plus simple et la noter dans `docs/DECISIONS.md`.
6. Ne rien affirmer que tu n'as pas exécuté : à la fin, lance les commandes de vérification (§9) et rapporte leur résultat réel.
7. Suivre les **règles Git du projet** (§12) : branches, commits Conventional Commits, PR petites, CI. Le backend est décrit au §5 : la gateway GraphQL est l'unique point d'entrée, avec un seul schéma.

## 1. Pile et initialisation

- Angular : **dernière version stable** (22 ou plus récente) ; TypeScript strict ; composants autonomes uniquement (aucun `NgModule`) ; `ChangeDetectionStrategy.OnPush` sur chaque composant ; pas de rendu côté serveur ; pas de PWA.
- Gestionnaire de paquets : **pnpm**. Constructeur : esbuild (par défaut). Tests : lanceur par défaut du CLI (Vitest si proposé) ; sinon Vitest ; Playwright pour `e2e/` (dossier seulement, `.gitkeep`).
- Bibliothèques : `@angular/material` + `@angular/cdk`, `@apollo/client` (utilisé **directement**, sans `apollo-angular`), `graphql`, `@jsverse/transloco`, `rxjs`.
- Dev : `@graphql-codegen/cli` + preset client (configuration seulement, §7.9), `eslint` + `angular-eslint`, `prettier`, `dependency-cruiser` (règles de couches, §8), `@commitlint/cli` + `@commitlint/config-conventional`, `husky`, `lint-staged` (§12).

```bash
pnpm dlx @angular/cli@latest new lightway-web --style=scss --routing --ssr=false --skip-git=false --package-manager=pnpm
cd lightway-web
pnpm add @apollo/client graphql @jsverse/transloco
pnpm ng add @angular/material --skip-confirmation
pnpm add -D @graphql-codegen/cli @graphql-codegen/client-preset dependency-cruiser prettier
pnpm ng add angular-eslint
```

Si une option du CLI a changé de nom, lis `pnpm ng new --help` et adapte ; ne cherche pas à la forcer. Le projet doit avoir `strict`, `strictTemplates` et `noImplicitOverride` activés. Ajoute des budgets de taille dans `angular.json` (avertissement initial 500 kB, erreur 1 MB).

## 2. Principes d'architecture

| Couche         | Dossier (par fonctionnalité)   | Règle                                                                            |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| Domaine        | `domain/`                      | TypeScript pur. Aucun import de `@angular/*`, d'Apollo ni de `core/` hors types. |
| Application    | `application/`                 | Cas d'utilisation = une classe, TypeScript pur, dépend de ports (interfaces).    |
| Infrastructure | `infrastructure/`              | Adaptateurs des ports (GraphQL, mappeurs).                                       |
| Présentation   | `presentation/`                | Pages, composants, facades à signaux. N'appelle que les cas d'utilisation.       |
| Composition    | `*.routes.ts`, `app.config.ts` | Seul endroit qui choisit les adaptateurs (`InjectionToken` + fournisseurs).      |

Les services transverses sont des **ports** (interface + `InjectionToken`) dans `core/<service>/`, avec leur adaptateur Angular à côté. Les fonctionnalités dépendent du port, jamais de Material, d'Apollo ou de `window`.

## 3. Arborescence à créer

`[IMPL]` = écrire le code décrit au §7. `[KEEP]` = `.gitkeep` seulement. Les noms de fichiers sont normatifs.

```
lightway-web/
├── .github/
│   ├── workflows/ci.yml                     [IMPL] §12
│   ├── pull_request_template.md             [IMPL]
│   └── CODEOWNERS                           [IMPL] lignes TODO
├── .editorconfig, .prettierrc, .gitignore   [IMPL] .gitignore : node_modules, dist, .angular, generated/*
├── commitlint.config.cjs                    [IMPL] §12
├── schema/schema.graphql                    [IMPL] copie du contrat backend (§5) ; sinon .gitkeep
├── scripts/sync-schema.mjs                  [IMPL] §5
├── AGENTS.md                                [IMPL] résumé des règles §2 et §8 pour les futurs agents
├── README.md                                [IMPL] démarrage, scripts, structure
├── docs/
│   └── DECISIONS.md                         [IMPL] décisions et écarts
├── e2e/.gitkeep                             [KEEP]
├── codegen.ts                               [IMPL] §7.9
├── .dependency-cruiser.cjs                  [IMPL] §8
├── src/
│   ├── main.ts
│   ├── index.html, styles.scss              (thème Material clair + sombre)
│   ├── environments/
│   │   ├── environment.ts                   [IMPL] production (branche main) : gatewayUrl, healthUrl, phase
│   │   ├── environment.preprod.ts           [IMPL] preprod
│   │   └── environment.development.ts       [IMPL] dev ; configurations angular.json « preprod » et « production »
│   ├── assets/i18n/
│   │   ├── fr.json                          [IMPL] langue par défaut
│   │   └── en.json                          [IMPL]
│   └── app/
│       ├── app.config.ts                    [IMPL] §7.12
│       ├── app.routes.ts                    [IMPL] §7.11
│       ├── app.component.ts                 [IMPL] <router-outlet> + bandeau hors ligne
│       ├── core/
│       │   ├── config/        app-config.ts, app-config.token.ts                          [IMPL]
│       │   ├── errors/        app-error.ts, error-code.ts, error-mapper.port.ts,
│       │   │                  graphql-error-mapper.ts, error-reporter.port.ts,
│       │   │                  console-error-reporter.ts, global-error-handler.ts           [IMPL]
│       │   ├── notifications/ notifier.port.ts, material-snackbar-notifier.ts              [IMPL]
│       │   ├── connectivity/  connectivity-monitor.port.ts, connectivity-state-machine.ts,
│       │   │                  browser-connectivity-monitor.ts, gateway-prober.ts           [IMPL]
│       │   ├── logging/       logger.port.ts, console-logger.ts                            [IMPL]
│       │   ├── auth/          token-store.port.ts, memory-token-store.ts,
│       │   │                  session.ts, session-manager.ts, auth-gateway.port.ts,
│       │   │                  graphql-auth-gateway.ts, auth.guard.ts, role.guard.ts,
│       │   │                  role.ts                                                      [IMPL]
│       │   ├── permissions/   permission-policy.port.ts, role-permission-policy.ts,
│       │   │                  has-permission.directive.ts                                  [IMPL]
│       │   ├── graphql/       apollo-client.factory.ts, links/ (request-id, connectivity,
│       │   │                  auth, retry, error-mapping), graphql-executor.port.ts,
│       │   │                  apollo-graphql-executor.ts, generated/.gitkeep (contenu ignoré par Git) [IMPL]
│       │   ├── i18n/          transloco.config.ts, language-preference.ts                  [IMPL]
│       │   ├── time/          clock.port.ts, system-clock.ts, id-generator.port.ts,
│       │   │                  uuid-id-generator.ts, retry-policy.ts                        [IMPL]
│       │   └── testing/       fakes des ports (FakeNotifier, FakeConnectivityMonitor,
│       │                      FakeClock, InMemoryTokenStore, FakeLogger)                  [IMPL]
│       ├── layout/            shell.component.ts (barre latérale, barre haute, outlet),
│       │                      offline-banner.component.ts, user-menu.component.ts         [IMPL]
│       ├── shared/
│       │   ├── ui/            page-header, empty-state, confirm-dialog (+ ConfirmService
│       │   │                  via Notifier-like port), loading-skeleton, form-field-error  [IMPL]
│       │   ├── pipes/         localized-date.pipe.ts                                       [IMPL]
│       │   └── directives/.gitkeep                                                         [KEEP]
│       └── features/
│           ├── auth/          login.page.ts minimal [IMPL]; domain/, application/,
│           │                  infrastructure/, presentation/ → .gitkeep                   [KEEP]
│           ├── accounts/      accounts.routes.ts (route vide) + 4 couches .gitkeep        [KEEP]
│           ├── audit/         audit.routes.ts (route vide) + 4 couches .gitkeep            [KEEP]
│           ├── profile/       profile.routes.ts (route vide) + 4 couches .gitkeep         [KEEP]
│           ├── referential/   4 couches .gitkeep (phase ultérieure)                       [KEEP]
│           ├── report-moderation/ 4 couches .gitkeep (phase ultérieure)                   [KEEP]
│           └── alert-settings/    4 couches .gitkeep (phase ultérieure)                   [KEEP]
```

Pour chaque fonctionnalité `[KEEP]`, les quatre couches sont `domain/{entities,value-objects,services,ports}`, `application/use-cases`, `infrastructure/{graphql,mappers}`, `presentation/{pages,components,facades}`, chacun avec un `.gitkeep`.

`auth/login.page.ts` : un formulaire (courriel, mot de passe) qui appelle `SessionManager.login()` ; c'est le seul écran métier à implémenter, car il valide la chaîne complète (client GraphQL, erreurs, toast, session).

## 4. Contrats communs

- **Résultats** : les opérations qui peuvent échouer de façon prévue retournent `Result<T, AppError>` (`{ ok: true, value } | { ok: false, error }`). Les exceptions sont réservées aux erreurs inattendues.
- **Aucun texte utilisateur codé en dur** : clés de traduction (`errors.UNAUTHENTICATED`, …). Les messages techniques restent dans les journaux.
- **Aucune donnée personnelle** dans les journaux ni dans les rapports d'erreur (pas de courriel, pas de jeton).
- Chaque requête GraphQL porte l'en-tête `x-request-id` (UUID) ; la valeur est aussi mise dans `AppError.traceId` quand la réponse la renvoie.

## 5. Backend : ce que l'on sait et ce qu'il faut confirmer

Source : document « lightway-backend : architecture et règles de travail ». Les dépôts du projet sont `lightway-backend`, `lightway-web` et `lightway-mobile`.

**Ce que dit le backend :**

- `gateway/` (NestJS, GraphQL) est le **point d'entrée unique** des clients : il authentifie les requêtes, compose le GraphQL et appelle les services en REST. Il ne contient aucune logique métier.
- Les services sont `auth-service` (UT01 à UT03) et `utilisateurs-service` (UT04 à UT07) ; d'autres s'ajoutent au fil des étapes. Un client ne les appelle **jamais** directement.
- **Il n'y a qu'un seul schéma GraphQL**, `contracts/graphql/schema.graphql` du dépôt backend. Pas de fédération, pas de routeur Apollo, pas de sous-graphes : le client ne connaît qu'un point d'entrée GraphQL.
- Règle d'évolution : le backend **ajoute** puis **déprécie avant de supprimer**. Le client ne dépend jamais d'un champ absent du schéma et traite les avertissements de dépréciation de `codegen` comme des tâches à planifier.
- Environnements : `dev`, `preprod`, `main` (production plus tard). Aucun secret dans Git.

**Le schéma dans ce dépôt.** Le fichier `schema/schema.graphql` est une **copie versionnée du contrat** (ce n'est pas un fichier généré). Le script `scripts/sync-schema.mjs` (`pnpm schema:sync`) la met à jour depuis un clone local du backend (`LIGHTWAY_BACKEND_PATH`, par défaut `../lightway-backend`, branche `dev`) ou depuis une URL (`LIGHTWAY_SCHEMA_URL`) ; sans l'un des deux, il s'arrête avec un message clair. La mise à jour passe par une PR dédiée `chore(contracts): met à jour le schéma GraphQL` qui liste les champs ajoutés et dépréciés. Si le fichier est absent (backend pas encore prêt), crée `schema/.gitkeep` et continue : le lot n'écrit aucune opération métier.

**Hypothèses du lot, non décrites par le document backend, à confirmer avec l'équipe backend.** Si `schema.graphql` les contredit, **le schéma a raison** : adapte uniquement `core/` et note l'écart dans `docs/DECISIONS.md`.

- Erreurs GraphQL avec `extensions.code` parmi `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`, et `extensions.traceId` ; `VALIDATION_FAILED` ajoute `extensions.fields: Record<string, string[]>`.
- Les mutations métier renvoient un type `…Payload` avec `userErrors` pour les refus attendus.
- Authentification (UT01 à UT03, via la gateway) : mutations `login(input)`, `refreshSession(input)`, `logout(input)` avec `clientType: WEB`. Jeton d'accès de 15 min, gardé **en mémoire**. Le jeton de renouvellement web est un cookie HttpOnly posé par la gateway (NestJS) ; le client envoie `credentials: 'include'`. **À confirmer** : cookie, CORS avec identifiants et origines autorisées par environnement.
- Mutations d'écriture idempotentes avec `clientMutationId` (UUID).
- En-tête `apollo-require-preflight: true`, méthode POST.
- Point de santé `GET {healthUrl}` répondant 2xx quand la gateway est joignable.
- Si le cookie HttpOnly n'est pas retenu côté gateway, le jeton de renouvellement devra être géré autrement : arrêter, documenter dans `docs/DECISIONS.md` et ne **pas** le stocker dans `localStorage` ni `sessionStorage`.

Les documents d'authentification (`login`, `refreshSession`, `logout`) sont écrits comme **chaînes GraphQL en ligne** dans l'adaptateur d'authentification (qui utilise `fetch`) : ils ne dépendent donc pas de `codegen`.

## 6. Ordre de réalisation

1. Projet + dépendances + environnements + thème (§1).
2. Arborescence complète avec `.gitkeep` (§3), avant tout code.
3. `core/config`, `core/time`, `core/logging`, `core/errors`.
4. `core/notifications`, `core/connectivity`.
5. `core/auth`, `core/permissions`, `core/graphql`.
6. `core/i18n`, `shared/`, `layout/`, `features/auth/login.page.ts`, routes.
7. Tests (§9), règles de couches (§8), `README.md`, `AGENTS.md`, `docs/DECISIONS.md`.
8. Vérifications (§9). Une branche et au moins un commit par étape, selon le plan de branches du §12.

## 7. Éléments partagés à implémenter

### 7.1 Configuration — `core/config`

```ts
// app-config.ts
export interface AppConfig {
  readonly gatewayUrl: string; // ex. https://api.example.cm/graphql
  readonly healthUrl: string; // ex. https://api.example.cm/health
  readonly defaultLanguage: 'fr' | 'en';
  readonly phase: 1 | 2 | 3;
  readonly environment: 'dev' | 'preprod' | 'production';
}
// app-config.token.ts
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
```

La valeur est construite dans `app.config.ts` à partir de `environment`. Aucun autre fichier n'importe `environment`.

### 7.2 Temps, identifiants, reprise — `core/time`

- `Clock { now(): Date }`, `SystemClock`.
- `IdGenerator { uuid(): string }`, `UuidIdGenerator` (`crypto.randomUUID()`).
- `RetryPolicy` : fonction pure `nextDelayMs(attempt: number): number | null` ; défaut : 400, 1200, 3000 ms avec 20 % d'aléa, puis `null`. Ne reprendre que les erreurs `NETWORK` et `TIMEOUT`, jamais une mutation sans `clientMutationId`.

### 7.3 Journal — `core/logging`

```ts
export interface Logger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
}
export const LOGGER = new InjectionToken<Logger>('LOGGER');
```

`ConsoleLogger` : niveau minimal configurable (`debug` en développement, `warn` en production) ; retire les clés `password`, `token`, `accessToken`, `refreshToken`, `email` du contexte avant affichage.

### 7.4 Erreurs — `core/errors`

```ts
// error-code.ts
export type ErrorCode =
  | 'NETWORK_OFFLINE'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'UNKNOWN';

// app-error.ts
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly messageKey: string, // ex. 'errors.FORBIDDEN'
    readonly options: {
      fields?: Record<string, string[]>;
      traceId?: string;
      retryable?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(code);
    this.name = 'AppError';
  }
  get fields() {
    return this.options.fields;
  }
  get traceId() {
    return this.options.traceId;
  }
  get retryable() {
    return this.options.retryable ?? false;
  }
}
export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = <E = AppError>(error: E): Result<never, E> => ({ ok: false, error });

// error-mapper.port.ts
export interface ErrorMapper {
  map(error: unknown): AppError;
}
export const ERROR_MAPPER = new InjectionToken<ErrorMapper>('ERROR_MAPPER');

// error-reporter.port.ts
export interface ErrorReporter {
  report(error: AppError, context?: Record<string, unknown>): void;
}
export const ERROR_REPORTER = new InjectionToken<ErrorReporter>('ERROR_REPORTER');
```

`GraphqlErrorMapper` (implémente `ErrorMapper`) : reconnaît, dans l'ordre, une `AppError` (rendue telle quelle), une erreur Apollo avec `graphQLErrors[0].extensions.code`, une erreur réseau Apollo (`networkError`) → `NETWORK`, `AbortError`/délai → `TIMEOUT`, tout le reste → `UNKNOWN`. Chaque code a sa clé `errors.<CODE>`. `retryable` vrai pour `NETWORK`, `TIMEOUT`, `RATE_LIMITED`. Une réponse avec plusieurs erreurs prend la première de plus haute gravité (`UNAUTHENTICATED` > `FORBIDDEN` > `VALIDATION_FAILED` > autres).

`ConsoleErrorReporter` : écrit via `Logger.error` ; point d'extension pour un futur service externe (ne pas en brancher un).

`GlobalErrorHandler` (implémente `ErrorHandler`) : mappe l'erreur, la reporte, notifie l'utilisateur avec `Notifier.error(messageKey)` **sauf** pour `NETWORK_OFFLINE` (déjà couvert par le bandeau) ; dédoublonne les erreurs identiques sur 3 s.

### 7.5 Notifications — `core/notifications`

```ts
export type NotificationLevel = 'success' | 'info' | 'warning' | 'error';
export interface Notification {
  level: NotificationLevel;
  messageKey: string; // clé de traduction
  params?: Record<string, unknown>;
  dedupeKey?: string;
  durationMs?: number; // défaut : 4000 (error : 7000)
  action?: { labelKey: string; run: () => void };
}
export interface Notifier {
  show(n: Notification): void;
  success(messageKey: string, params?: Record<string, unknown>): void;
  info(messageKey: string, params?: Record<string, unknown>): void;
  warning(messageKey: string, params?: Record<string, unknown>): void;
  error(messageKey: string, params?: Record<string, unknown>): void;
  dismiss(dedupeKey: string): void;
}
export const NOTIFIER = new InjectionToken<Notifier>('NOTIFIER');
```

`MaterialSnackbarNotifier` : utilise `MatSnackBar` et le service de traduction ; une seule snackbar à la fois (la suivante remplace la précédente sauf `error`, mise en file) ; ignore une notification dont `dedupeKey` est déjà affichée ; classes CSS par niveau ; `aria-live` correct (`assertive` pour `error`).

### 7.6 Connectivité — `core/connectivity`

```ts
export type ConnectivityStatus = 'ONLINE' | 'LIMITED' | 'OFFLINE';
export interface ConnectivityMonitor {
  readonly status: Signal<ConnectivityStatus>;
  readonly canWrite: Signal<boolean>; // true si status !== 'OFFLINE'
  recordRequestSuccess(): void; // appelé par le client GraphQL
  recordRequestFailure(kind: 'NETWORK' | 'TIMEOUT'): void;
  checkNow(): Promise<ConnectivityStatus>;
}
export const CONNECTIVITY_MONITOR = new InjectionToken<ConnectivityMonitor>('CONNECTIVITY_MONITOR');
```

`ConnectivityStateMachine` (classe pure, sans Angular, testable avec `FakeClock`) :

- Entrées : `browserOnline(boolean)`, `probeResult(ok)`, `requestSuccess`, `requestFailure`.
- Règles : `browserOnline(false)` → `OFFLINE` après **1,5 s** de stabilité (anti-rebond) ; `browserOnline(true)` → lance une sonde, état provisoire `LIMITED` jusqu'au résultat ; sonde réussie → `ONLINE` ; **2 échecs consécutifs** (sonde ou requête réelle) en `ONLINE` → `LIMITED` ; en `LIMITED` ou `OFFLINE` avec navigateur en ligne, nouvelle sonde avec attente croissante 15 s → 30 s → 60 s (plafond) ; un succès de requête réelle remet `ONLINE` et remet l'attente à 15 s.
- `navigator.onLine === true` ne suffit **jamais** à conclure `ONLINE`.

`GatewayProber` : `fetch(healthUrl, { method: 'GET', cache: 'no-store', signal })` avec délai de **4 s** ; réussite = statut 2xx. Aucune donnée envoyée.

`BrowserConnectivityMonitor` : écoute `online`/`offline` (via `fromEvent` + `takeUntilDestroyed` ou `DestroyRef`), expose les signaux, déclenche les sondes planifiées par la machine, s'arrête quand l'onglet est caché (`visibilitychange`) et sonde une fois au retour de l'onglet. Fournit aussi `onReconnect(cb)` pour relancer les requêtes actives ; le bandeau et `canWrite` lisent les signaux.

Comportement d'interface (dans `layout/` et `app.component.ts`) : passage à `OFFLINE` → bandeau persistant ; retour à `ONLINE` après `OFFLINE` ou `LIMITED` → un seul toast `connectivity.restored` ; `LIMITED` → bandeau d'avertissement discret.

### 7.7 Authentification et session — `core/auth`

```ts
export type Role = 'CONDUCTEUR' | 'ADMIN' | 'SUPER_ADMIN';
export const ROLE_RANK: Record<Role, number> = { CONDUCTEUR: 0, ADMIN: 1, SUPER_ADMIN: 2 };
export const hasAtLeast = (actual: Role, required: Role) =>
  ROLE_RANK[actual] >= ROLE_RANK[required];

export interface Session {
  accessToken: string;
  expiresAt: Date;
  user: { id: string; role: Role; displayName: string };
}

export interface TokenStore {
  // en mémoire uniquement
  get(): Session | null;
  set(s: Session | null): void;
}

export interface AuthGateway {
  // port ; adaptateur GraphQL
  login(email: string, password: string): Promise<Result<Session>>;
  refresh(): Promise<Result<Session>>; // utilise le cookie HttpOnly
  logout(): Promise<Result<void>>;
}
```

- `GraphqlAuthGateway` envoie `login`/`refreshSession`/`logout` avec `fetch` **directement** (et non Apollo, pour éviter une dépendance circulaire avec le lien d'authentification), `credentials: 'include'`, en-têtes du §5. Il convertit les erreurs avec `ErrorMapper`.
- `SessionManager` (service `providedIn: 'root'`, signaux `session`, `isAuthenticated`, `role`) : `login()`, `logout()` (vide aussi le cache Apollo via un port `CacheResetter` injecté, voir §7.10), `getValidAccessToken()` ; **refresh en vol unique** (single-flight : un `Promise` partagé tant qu'un renouvellement est en cours) ; renouvelle quand `expiresAt - now < 60 s` ; au démarrage de l'application tente un `refresh()` silencieux (initialiseur d'application). Échec de renouvellement avec `UNAUTHENTICATED` → vide la session, redirige vers `/login` avec `returnUrl`, toast `auth.sessionExpired`.
- `authGuard` (`CanActivateFn`/`CanMatchFn`) : autorise si session valide, sinon redirection `/login?returnUrl=…`.
- `roleGuard(required: Role): CanMatchFn` : redirige vers `/forbidden` si le rôle est insuffisant ; l'écran n'est même pas téléchargé.

### 7.8 Droits — `core/permissions`

`PermissionPolicy { can(permission: Permission): boolean }` avec `type Permission = 'accounts.read' | 'accounts.write' | 'accounts.createAdmin' | 'audit.read'` ; `RolePermissionPolicy` en dérive depuis le rôle courant (ADMIN : `accounts.read`, `accounts.write`, `audit.read` ; SUPER_ADMIN : tout). Directive structurelle `*hasPermission="'accounts.write'"`. Cette politique est un confort d'interface : le serveur reste l'autorité.

### 7.9 Client GraphQL — `core/graphql`

Port utilisé par les futurs adaptateurs de fonctionnalités :

```ts
export interface GraphqlExecutor {
  query<TData, TVars>(
    doc: TypedDocumentNode<TData, TVars>,
    vars?: TVars,
    opts?: { fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' },
  ): Promise<Result<TData>>;
  mutate<TData, TVars>(doc: TypedDocumentNode<TData, TVars>, vars?: TVars): Promise<Result<TData>>;
}
export const GRAPHQL_EXECUTOR = new InjectionToken<GraphqlExecutor>('GRAPHQL_EXECUTOR');
export interface CacheResetter {
  reset(): Promise<void>;
}
export const CACHE_RESETTER = new InjectionToken<CacheResetter>('CACHE_RESETTER');
```

`ApolloGraphqlExecutor` convertit toute exception en `Result` via `ErrorMapper` ; c'est la seule classe qui appelle `client.query/mutate`.

`apollo-client.factory.ts` construit `ApolloClient` avec `InMemoryCache` (identifiant par `id`) et la chaîne de liens **dans cet ordre** :

1. `requestIdLink` : ajoute `x-request-id` (UUID) ;
2. `connectivityLink` : si `status() === 'OFFLINE'`, échoue immédiatement avec `AppError('NETWORK_OFFLINE')` sans appeler le réseau ; sinon passe, puis rapporte succès/échec au `ConnectivityMonitor` ;
3. `authLink` : ajoute `Authorization: Bearer` depuis `SessionManager.getValidAccessToken()` ; sur `UNAUTHENTICATED`, un seul `refresh()` puis **une** relecture de l'opération ; au second échec, déconnexion ;
4. `retryLink` : applique `RetryPolicy` aux seules lectures (`query`) et aux mutations portant un `clientMutationId` ;
5. `errorMappingLink` : convertit les erreurs en `AppError` ;
6. `HttpLink` : `uri = gatewayUrl`, `credentials: 'include'`, méthode POST, en-tête `apollo-require-preflight: true`.

Les requêtes persistées (hachage SHA-256) sont **hors de ce lot** : laisser un `// TODO(persisted-queries)` dans la factory. `defaultOptions.watchQuery.errorPolicy = 'none'`.

`codegen.ts` : schéma = `./schema/schema.graphql` (copie du contrat backend, §5), documents = `src/app/features/**/infrastructure/graphql/**/*.graphql`, sortie = `src/app/core/graphql/generated/` avec le preset `client`. Script `pnpm codegen`, **exécuté avant `build` et `test`** (script `prebuild`/`pretest`) car le dossier `generated/` n'est pas versionné (le `.gitkeep` seul l'est). Ne pas faire échouer le build si le schéma est absent ou si aucun document n'existe. Les avertissements de dépréciation sont affichés, pas bloquants.

### 7.10 Langue — `core/i18n`

Transloco avec chargement différé des fichiers de `assets/i18n`, langue par défaut `fr`, repli `fr`, langue mémorisée dans `localStorage` (entourer chaque accès d'un `try/catch`). Clés minimales à fournir en `fr` et `en` :

```
common.{save,cancel,confirm,delete,close,retry,loading}
errors.{NETWORK_OFFLINE,NETWORK,TIMEOUT,UNAUTHENTICATED,FORBIDDEN,VALIDATION_FAILED,
        NOT_FOUND,CONFLICT,RATE_LIMITED,INTERNAL,UNKNOWN}
auth.{login.title,login.email,login.password,login.submit,sessionExpired,logout}
connectivity.{offline,limited,restored}
layout.{accounts,audit,profile,forbidden.title,notFound.title}
```

Un test vérifie que `fr.json` et `en.json` ont exactement les mêmes clés.

### 7.11 Coque, composants communs, routes

- `layout/shell.component.ts` : barre latérale (liens vers `accounts`, `audit`, `profile`, filtrés par `PermissionPolicy`), barre haute (menu utilisateur, sélecteur de langue, bascule thème clair/sombre mémorisée), `<router-outlet>`, `offline-banner`.
- `shared/ui` : `PageHeader` (titre, actions), `EmptyState`, `LoadingSkeleton`, `FormFieldError` (affiche les `AppError.fields` d'un champ), `ConfirmDialog` + `ConfirmService.ask({titleKey, messageKey, destructive}): Promise<boolean>`. Tous en `OnPush`, accessibles au clavier, avec les attributs ARIA nécessaires.
- Pages minimales : `forbidden.page.ts`, `not-found.page.ts` (dans `core/errors/pages/`).
- `app.routes.ts` :

```ts
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.page') },
  { path: 'forbidden', loadComponent: () => import('./core/errors/pages/forbidden.page') },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./layout/shell.component'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'accounts' },
      {
        path: 'accounts',
        canMatch: [roleGuard('ADMIN')],
        loadChildren: () => import('./features/accounts/accounts.routes'),
      },
      {
        path: 'audit',
        canMatch: [roleGuard('ADMIN')],
        loadChildren: () => import('./features/audit/audit.routes'),
      },
      { path: 'profile', loadChildren: () => import('./features/profile/profile.routes') },
    ],
  },
  { path: '**', loadComponent: () => import('./core/errors/pages/not-found.page') },
];
```

Chaque `*.routes.ts` de fonctionnalité exporte par défaut `[] satisfies Routes` avec un commentaire `// TODO(feature)`. Router avec `withComponentInputBinding()` et `withViewTransitions()`.

### 7.12 Composition — `app.config.ts`

Fournir, dans cet ordre : `provideBrowserGlobalErrorListeners()` (si disponible dans la version installée), `provideRouter(routes, withComponentInputBinding(), withViewTransitions())`, `provideHttpClient(withFetch())` (réservé aux appels REST éventuels), `provideAnimationsAsync()`, Transloco, puis :

```ts
{ provide: APP_CONFIG,         useValue: buildConfig(environment) },
{ provide: LOGGER,             useClass: ConsoleLogger },
{ provide: ERROR_MAPPER,       useClass: GraphqlErrorMapper },
{ provide: ERROR_REPORTER,     useClass: ConsoleErrorReporter },
{ provide: ErrorHandler,        useClass: GlobalErrorHandler },
{ provide: NOTIFIER,           useClass: MaterialSnackbarNotifier },
{ provide: CONNECTIVITY_MONITOR, useClass: BrowserConnectivityMonitor },
{ provide: TOKEN_STORE,        useClass: MemoryTokenStore },
{ provide: AUTH_GATEWAY,       useClass: GraphqlAuthGateway },
{ provide: PERMISSION_POLICY,  useClass: RolePermissionPolicy },
{ provide: CLOCK,              useClass: SystemClock },
{ provide: ID_GENERATOR,       useClass: UuidIdGenerator },
{ provide: APOLLO_CLIENT,      useFactory: createApolloClient },
{ provide: GRAPHQL_EXECUTOR,   useClass: ApolloGraphqlExecutor },
{ provide: CACHE_RESETTER,     useExisting: ApolloCacheResetter },
provideAppInitializer(() => inject(SessionManager).restore()),
```

Les noms `TOKEN_STORE`, `AUTH_GATEWAY`, `PERMISSION_POLICY`, `CLOCK`, `ID_GENERATOR`, `APOLLO_CLIENT` sont des `InjectionToken` à déclarer dans le fichier du port correspondant.

## 8. Règles de couches (à faire respecter par outil)

`.dependency-cruiser.cjs` interdit :

- `features/*/domain` et `features/*/application` : tout import de `@angular/*`, `@apollo/*`, `rxjs`, `core/graphql`, `core/notifications/material-*`, `shared/`, `layout/` ;
- `features/*/presentation` : import de `infrastructure/` ;
- une fonctionnalité qui importe dans le dossier interne d'une autre (`features/a/**` → `features/b/**`) ;
- `core/**` : import de `features/**`, `layout/**`, `shared/**` ;
- cycles. Script `pnpm lint:arch`.

`AGENTS.md` reprend ces règles, la liste des ports de `core/`, et la consigne « une nouvelle fonctionnalité = un dossier `features/<nom>` avec les quatre couches, ses fournisseurs dans sa route, jamais dans `app.config.ts` ».

## 9. Tests et vérifications

Écrire, avec les faux de `core/testing` :

1. `ConnectivityStateMachine` : anti-rebond de 1,5 s ; deux échecs → `LIMITED` ; attente 15/30/60 s ; succès de requête → `ONLINE`.
2. `GraphqlErrorMapper` : chaque code, plusieurs erreurs (priorité), erreur réseau, délai, `fields` de validation.
3. `SessionManager` : renouvellement en vol unique (deux appels simultanés → un seul `refresh`), renouvellement avant expiration, échec → déconnexion.
4. `authLink` : un seul rejeu après `UNAUTHENTICATED`.
5. `connectivityLink` : `OFFLINE` → échec immédiat sans appel réseau.
6. `MaterialSnackbarNotifier` : dédoublonnage, remplacement, durée.
7. Gardes : `authGuard`, `roleGuard` (ADMIN refusé sur SUPER_ADMIN).
8. i18n : mêmes clés dans `fr.json` et `en.json`.
9. Un test de composant du bandeau hors ligne (apparition selon le signal).

Commandes à exécuter et dont tu rapporteras le résultat réel :

```bash
pnpm format:check
pnpm lint
pnpm lint:arch      # test d'architecture
pnpm test --watch=false
pnpm build
git status --short   # aucun fichier inattendu
```

Si une commande échoue, corrige ; si tu ne peux pas, dis-le explicitement dans `docs/DECISIONS.md` et dans ta réponse finale.

## 10. Critères d'acceptation

- [ ] Toute l'arborescence du §3 existe ; chaque dossier vide a un `.gitkeep` ; aucune logique métier dans `features/*` hors `login.page.ts`.
- [ ] Tous les éléments `[IMPL]` existent, typés strictement, sans `any` non justifié.
- [ ] `pnpm build`, `pnpm lint`, `pnpm lint:arch` et les tests passent.
- [ ] Aucun import entre `core/` et `features/` dans le mauvais sens.
- [ ] Aucun jeton ni donnée personnelle dans `localStorage`, `sessionStorage` ou les journaux.
- [ ] Tout texte visible passe par une clé de traduction.
- [ ] Le dépôt ne référence aucun paquet ou chemin d'un autre dépôt (backend et mobile compris) ; le schéma n'y figure que comme copie du contrat (§5).
- [ ] Aucun fichier généré ni dossier de construction n'est versionné ; aucun secret ; aucun code commenté.
- [ ] `commitlint`, `husky`, `lint-staged`, `.editorconfig`, Prettier, `ci.yml`, modèle de PR et `CODEOWNERS` existent ; tous les commits respectent le format (72 caractères maximum).
- [ ] Les hypothèses du §5 sont reprises dans `docs/DECISIONS.md` sous « À confirmer avec le backend ».
- [ ] `README.md`, `AGENTS.md` et `docs/DECISIONS.md` sont rédigés.

## 11. Hors périmètre de ce lot

Écrans de comptes, d'audit, de profil, du Référentiel, de modération et de paramètres d'alerte ; requêtes persistées ; abonnements GraphQL ; rapport d'erreurs vers un service externe ; tests de bout en bout ; déploiement des environnements (dev, preprod).

## 12. Règles Git (celles de `lightway-backend`, sections 2 à 8, valables ici)

- **Branches protégées** : `dev` (intégration), `preprod`, `main`. Pas de poussée directe, pas de force push. Flux : `feature/*` → PR → `dev` → PR → `preprod` → PR → `main`. Tu **ne pousses jamais** sur ces trois branches et tu ne fusionnes rien. Si `dev` n'existe pas localement, crée-la depuis `main` et signale-le (la protection des branches est faite par un humain dans les réglages du dépôt).
- **Branches de travail** : toujours créées depuis `dev`. Préfixes : `feature/`, `fix/`, `refactor/`, `chore/`, `docs/`, `test/`, `hotfix/`. Nom : minuscules, tirets, sans accents, 3 à 5 mots, `type/<cas-ou-composant>-<description>`.
- **Commits** : Conventional Commits, `type(portée): résumé à l'impératif`, **72 caractères au maximum**. Types : `feat fix refactor test docs chore ci perf`. Portées du backend à reprendre quand elles s'appliquent : `auth`, `utilisateurs`, `referentiel`, `signalements`, `alertes`, `navigation`, `contracts`, `docs`. Portées **proposées** pour ce dépôt : `core`, `ui`, `layout`, `i18n`, `config`. Un commit = un changement cohérent ; pas de « wip » ni de « correction ».
- **Pull requests** : une PR = une fonctionnalité ou un correctif, idéalement **moins de 400 lignes** ; titre au format d'un commit ; description : quoi, pourquoi, comment tester, cas d'utilisation concerné ; une approbation minimum d'un coéquipier ; on ne valide jamais sa propre PR. Fusion en **squash** de `feature/*` vers `dev`, en **commit de fusion** de `dev` vers `preprod` et de `preprod` vers `main`. La branche est supprimée après fusion.
- **Dépendances** : une PR `chore` dédiée, jamais mêlée à une fonctionnalité.
- **Dépôt propre** : pas de code commenté, pas de fichiers générés, pas de dossier de construction (`node_modules/`, `dist/`, `.angular/`, `src/app/core/graphql/generated/*` sauf `.gitkeep`). Aucun secret dans Git ; si un secret est poussé, le changer immédiatement puis nettoyer l'historique.
- **Langue** : identifiants et code en anglais ; messages de commit et documentation en français. Le document backend demande de trancher « une fois pour toutes » : retiens ce choix et signale-le dans `docs/DECISIONS.md` pour confirmation.
- **Outillage à mettre en place** : `.editorconfig`, Prettier, ESLint ; `commitlint` (`@commitlint/cli`, `@commitlint/config-conventional`) avec `header-max-length` à 72 et la liste des types ci-dessus ; `husky` + `lint-staged` (format et lint sur les fichiers modifiés, contrôle du message de commit). Scripts `pnpm format` et `pnpm format:check`.
- **Fichiers GitHub** : `.github/workflows/ci.yml` (déclenché sur les PR vers `dev`, `preprod` et `main` : installation à lockfile figé, `format:check`, `lint`, `lint:arch` — c'est le **test d'architecture** —, tests, `build`) ; `.github/pull_request_template.md` (quoi, pourquoi, comment tester, cas d'utilisation, composants touchés, cases : tests verts, test d'architecture vert, documentation à jour) ; `.github/CODEOWNERS` avec des lignes `TODO` à remplir par l'équipe (n'invente aucun identifiant de personne).

### Plan de branches pour ce lot

Tu travailles **localement**, une branche par étape, chacune créée depuis `dev` ou, si la précédente n'est pas fusionnée, depuis la précédente (empilées). Un commit propre par branche au minimum. À la fin, tu listes dans ta réponse les PR à ouvrir (titre, description) ; une PR d'initialisation peut dépasser 400 lignes : c'est la seule exception, à noter dans `docs/DECISIONS.md`.

| #   | Branche                           | Contenu                                                                                          | Premier commit                                               |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 1   | `chore/web-init-project`          | Projet Angular, dépendances, environnements, thème, `.editorconfig`, Prettier, commitlint, husky | `chore(core): initialise le projet Angular et l'outillage`   |
| 2   | `chore/web-folder-structure`      | Arborescence et `.gitkeep`, `AGENTS.md`                                                          | `chore(core): crée l'arborescence et les .gitkeep`           |
| 3   | `chore/web-ci-arch-rules`         | `ci.yml`, modèle de PR, `CODEOWNERS`, règles de couches                                          | `ci(core): ajoute la CI et le test d'architecture`           |
| 4   | `feature/web-core-foundation`     | `config`, `time`, `logging`, `errors` + tests                                                    | `feat(core): ajoute erreurs, journal et configuration`       |
| 5   | `feature/web-core-notify-network` | `notifications`, `connectivity` + tests                                                          | `feat(core): ajoute toasts et détection de connectivité`     |
| 6   | `feature/web-core-auth-graphql`   | `auth`, `permissions`, `graphql`, `sync-schema` + tests                                          | `feat(auth): ajoute la session et le client GraphQL`         |
| 7   | `feature/web-shell-login`         | `i18n`, `shared/`, `layout/`, routes, page de connexion                                          | `feat(auth): ajoute la coque et la page de connexion (UT02)` |
| 8   | `docs/web-readme-decisions`       | `README.md`, `docs/DECISIONS.md`                                                                 | `docs(docs): rédige le README et les décisions`              |
