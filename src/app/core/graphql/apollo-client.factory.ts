import { inject, InjectionToken } from '@angular/core';
import {
  ApolloClient,
  from,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client/core';
import { APP_CONFIG } from '../config/app-config.token';
import { ID_GENERATOR } from '../time/id-generator.port';
import { CONNECTIVITY_MONITOR } from '../connectivity/connectivity-monitor.port';
import { SessionManager } from '../auth/session-manager';
import { defaultRetryPolicy } from '../time/retry-policy';
import { ERROR_MAPPER } from '../errors/error-mapper.port';
import { createRequestIdLink } from './links/request-id.link';
import { createConnectivityLink } from './links/connectivity.link';
import { createAuthLink } from './links/auth.link';
import { createRetryLink } from './links/retry.link';
import { createErrorMappingLink } from './links/error-mapping.link';

export const APOLLO_CLIENT = new InjectionToken<ApolloClient<NormalizedCacheObject>>(
  'APOLLO_CLIENT',
);

export const createApolloClient = (): ApolloClient<NormalizedCacheObject> => {
  const config = inject(APP_CONFIG);
  const idGenerator = inject(ID_GENERATOR);
  const connectivityMonitor = inject(CONNECTIVITY_MONITOR);
  const sessionManager = inject(SessionManager);
  const errorMapper = inject(ERROR_MAPPER);

  const requestIdLink = createRequestIdLink(idGenerator);
  const connectivityLink = createConnectivityLink(connectivityMonitor);
  const authLink = createAuthLink(sessionManager);
  const retryLink = createRetryLink(defaultRetryPolicy);
  const errorMappingLink = createErrorMappingLink(errorMapper);

  // TODO(persisted-queries): Implémenter les requêtes persistées avec hachage SHA-256

  const httpLink = new HttpLink({
    uri: config.gatewayUrl,
    credentials: 'include',
    headers: {
      'apollo-require-preflight': 'true',
    },
  });

  const link = from([
    requestIdLink,
    connectivityLink,
    authLink,
    retryLink,
    errorMappingLink,
    httpLink,
  ]);

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'none',
      },
    },
  });
};
