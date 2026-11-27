# Décisions d'architecture et de conception — Lightway Web

Ce document consigne les choix structurants, hypothèses opérationnelles et arbitrages techniques pris lors de l'initialisation du projet `lightway-web`.

---

## 1. Choix du gestionnaire de paquets et environnement

- **pnpm v12** : Retenu pour la rapidité des installations, la gestion stricte de l'arbre de dépendances (symlinks) évitant les accès fantômes (« phantom dependencies »), et l'économie d'espace disque.
- **Node.js >= 22** : Environnement moderne supportant nativement les modules ESM et les dernières fonctionnalités standard.
- **Angular 22** : Utilisation du nouveau modèle autonome (`standalone: true` par défaut), des signaux natifs (`signal()`, `computed()`, `input()`), et de `ChangeDetectionStrategy.OnPush` sur tous les composants pour des performances optimales.

---

## 2. Architecture logicielle : Clean Architecture stricte

- **4 couches métier par feature** :
  - `domain/` : Entités et règles métier indépendantes de tout framework (zéro import Angular/Apollo).
  - `application/` : Cas d'utilisation orchestrant les flux métier.
  - `infrastructure/` : Adaptateurs techniques et requêtes GraphQL.
  - `presentation/` : Composants graphiques et façades réactives.
  - `*.routes.ts` : Point de liaison pour l'injection de dépendances locale à la route.
- **Vérification automatique** : Intégration de `dependency-cruiser` (`pnpm lint:arch`) dans la CI GitHub Actions et le cycle de pre-commit pour empêcher toute régression de couplage.

---

## 3. Communication API & GraphQL

- **Apollo Client sans wrapper externe** :
  - Utilisation directe d'@apollo/client v4 avec un port `GraphqlExecutor` découplé.
  - Implémentation d'un pipeline de liens Apollo :
    - `requestIdLink` : Injecte un identifiant unique `X-Request-Id` par requête.
    - `connectivityLink` : Échoue rapidement lorsque l'application est hors ligne sans gaspiller de trafic réseau.
    - `authLink` : Injecte l'en-tête `Authorization: Bearer <token>` et intercepte les retours 401 pour rafraîchir le jeton via une passe unique (« single-flight refresh »).
    - `retryLink` : Rejoue les erreurs réseau/timeout selon une politique de backoff exponentiel (uniquement sur requêtes idempotentes ou mutations avec `clientMutationId`).
    - `errorMappingLink` : Normalise les erreurs GraphQL vers le modèle typé `AppError`.
- **Typage statique de bout en bout** :
  - Script `pnpm codegen` avec le preset `@graphql-codegen/client-preset` pour un typage automatique sans surcharge de runtime.
  - Script `pnpm schema:sync` pour actualiser le schéma GraphQL introspecté.

---

## 4. Sécurité des sessions

- **Zéro stockage persistant vulnérable (XSS)** :
  - Les jetons d'accès ne sont jamais écrits dans `localStorage` ou `sessionStorage`.
  - Le jeton d'accès réside uniquement dans un magasin en mémoire (`MemoryTokenStore`).
  - Le jeton de rafraîchissement est conservé dans un cookie sécurisé `HttpOnly` / `SameSite=Strict`, manipulé exclusivement par la passerelle GraphQL.
  - Lors d'un rafraîchissement de page, un appel initial `restore()` réhydrate la session en mémoire de manière transparente.

---

## 5. Gestion de la connectivité et mode hors-ligne

- **Machine à états de connectivité** (`ConnectivityStateMachine`) :
  - Statuts gérés : `ONLINE`, `LIMITED`, `OFFLINE`.
  - Détection hybride : écoute des événements navigateur (`online` / `offline`) combinée à des sondes actives HTTP (`/health`) avec backoff progressif (15s, 30s, 60s) et anti-rebond (1.5s).
  - Composant visuel `OfflineBannerComponent` affichant une alerte non bloquante lors de dégradations réseau.

---

## 6. Budget de taille des bundles

- **Arbitrage sur le budget initial (500 Ko d'avertissement / 1 Mo d'erreur)** :
  - Le bundle initial actuel atteint ~822 Ko bruts (~190 Ko transférés avec compression gzip/brotli).
  - Ce volume comprend l'ensemble d'Angular Material v22, le client Apollo v4 complet, le runtime Transloco et les polyfills d'animations asynchrones.
  - L'avertissement est accepté pour la phase d'initialisation, le seuil d'erreur bloquant (1 Mo) étant parfaitement respecté. L'optimisation par découpage en sous-modules différés se poursuivra lors du développement des fonctionnalités métier des phases ultérieures.

---

## 7. Hypothèses et points à confirmer avec l'équipe Backend

1. **Format des cookies de rafraîchissement** :
   - Hypothèse retenue : le cookie `refreshToken` est positionné avec les drapeaux `HttpOnly; Secure; SameSite=Strict` lors de la mutation `login` ou `refreshToken`.
2. **Format des codes d'erreur GraphQL** :
   - Hypothèse retenue : les erreurs GraphQL renvoient une extension `extensions.code` reprenant la nomenclature standard (`UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`, `NOT_FOUND`, etc.).
3. **Endpoint de santé** :
   - Hypothèse retenue : la passerelle expose une route `GET /health` renvoyant un statut 200/204 sans authentification.

---

## 8. Historique des branches Git

La présente initialisation a été réalisée selon une suite de branches empilées (« stacked branches »), chacune validée avec des tests unitaires, vérification d'architecture et commits conventionnels :

1. `chore/web-init-project` : Initialisation du projet Angular 22, configuration pnpm, outillage ESLint/Prettier/Husky.
2. `chore/web-folder-structure` : Création de l'arborescence Clean Architecture et des règles `AGENTS.md`.
3. `chore/web-ci-arch-rules` : Configuration de la CI GitHub Actions, templates PR et règles `dependency-cruiser`.
4. `feature/web-core-foundation` : Implémentation de la configuration, journalisation, gestion des erreurs et temps.
5. `feature/web-core-notify-network` : Implémentation des notifications et de la détection de connectivité.
6. `feature/web-core-auth-graphql` : Implémentation du client Apollo, pipeline de liens et gestionnaire de session.
7. `feature/web-shell-login` : Implémentation de la coque applicative, de l'internationalisation Transloco et de la page de connexion.
8. `docs/web-readme-decisions` : Rédaction de la documentation complète et du journal des décisions.
