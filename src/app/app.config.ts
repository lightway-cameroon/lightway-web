import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTransloco } from '@jsverse/transloco';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

// Core tokens & implementations
import { APP_CONFIG, buildAppConfig } from './core/config';
import { CLOCK, SystemClock, ID_GENERATOR, UuidIdGenerator } from './core/time';
import { LOGGER, ConsoleLogger } from './core/logging';
import {
  ERROR_MAPPER,
  GraphqlErrorMapper,
  ERROR_REPORTER,
  ConsoleErrorReporter,
  GlobalErrorHandler,
} from './core/errors';
import { NOTIFIER, MaterialSnackbarNotifier } from './core/notifications';
import {
  CONNECTIVITY_MONITOR,
  BrowserConnectivityMonitor,
  GatewayProber,
} from './core/connectivity';
import {
  TOKEN_STORE,
  MemoryTokenStore,
  AUTH_GATEWAY,
  GraphqlAuthGateway,
  SessionManager,
} from './core/auth';
import { PERMISSION_POLICY, RolePermissionPolicy } from './core/permissions';
import {
  APOLLO_CLIENT,
  GRAPHQL_EXECUTOR,
  ApolloGraphqlExecutor,
  CACHE_RESETTER,
  createApolloClient,
} from './core/graphql';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { getInitialLanguage } from './core/i18n/language-preference';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),

    // Configuration
    {
      provide: APP_CONFIG,
      useValue: buildAppConfig(environment),
    },

    // Time & ID
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
    {
      provide: ID_GENERATOR,
      useClass: UuidIdGenerator,
    },

    // Logging
    {
      provide: LOGGER,
      useClass: ConsoleLogger,
    },

    // Errors
    {
      provide: ERROR_MAPPER,
      useClass: GraphqlErrorMapper,
    },
    {
      provide: ERROR_REPORTER,
      useClass: ConsoleErrorReporter,
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },

    // Notifications
    {
      provide: NOTIFIER,
      useClass: MaterialSnackbarNotifier,
    },

    // Connectivity
    GatewayProber,
    {
      provide: CONNECTIVITY_MONITOR,
      useClass: BrowserConnectivityMonitor,
    },

    // Auth & Permissions
    {
      provide: TOKEN_STORE,
      useClass: MemoryTokenStore,
    },
    {
      provide: AUTH_GATEWAY,
      useClass: GraphqlAuthGateway,
    },
    {
      provide: PERMISSION_POLICY,
      useClass: RolePermissionPolicy,
    },
    SessionManager,

    // Apollo & GraphQL Executor
    {
      provide: APOLLO_CLIENT,
      useFactory: () => {
        const config = inject(APP_CONFIG);
        const idGenerator = inject(ID_GENERATOR);
        const connectivityMonitor = inject(CONNECTIVITY_MONITOR);
        const sessionManager = inject(SessionManager);
        const errorMapper = inject(ERROR_MAPPER);

        return createApolloClient({
          config,
          idGenerator,
          connectivityMonitor,
          sessionManager,
          errorMapper,
        });
      },
    },
    {
      provide: GRAPHQL_EXECUTOR,
      useClass: ApolloGraphqlExecutor,
    },
    {
      provide: CACHE_RESETTER,
      useExisting: GRAPHQL_EXECUTOR,
    },

    // i18n Transloco
    provideTransloco({
      config: {
        availableLangs: ['fr', 'en'],
        defaultLang: getInitialLanguage(),
        fallbackLang: 'fr',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),

    // Session restoration on startup
    provideAppInitializer(() => {
      const sessionManager = inject(SessionManager);
      return sessionManager.restore();
    }),
  ],
};
