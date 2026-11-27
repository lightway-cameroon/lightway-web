import { InjectionToken } from '@angular/core';
import {
  ApolloClient,
  from,
  HttpLink,
  InMemoryCache,
} from '@apollo/client/core';
import { AppConfig } from '../config/app-config';
import { IdGenerator } from '../time/id-generator.port';
import { ConnectivityMonitor } from '../connectivity/connectivity-monitor.port';
import { SessionManager } from '../auth/session-manager';
import { defaultRetryPolicy } from '../time/retry-policy';
import { ErrorMapper } from '../errors/error-mapper.port';
import { createRequestIdLink } from './links/request-id.link';
import { createConnectivityLink } from './links/connectivity.link';
import { createAuthLink } from './links/auth.link';
import { createRetryLink } from './links/retry.link';
import { createErrorMappingLink } from './links/error-mapping.link';

export const APOLLO_CLIENT = new InjectionToken<ApolloClient>('APOLLO_CLIENT');

export interface CreateApolloClientOptions {
  config: AppConfig;
  idGenerator: IdGenerator;
  connectivityMonitor: ConnectivityMonitor;
  sessionManager: SessionManager;
  errorMapper: ErrorMapper;
}

export const createApolloClient = (options: CreateApolloClientOptions): ApolloClient => {
  const requestIdLink = createRequestIdLink(options.idGenerator);
  const connectivityLink = createConnectivityLink(options.connectivityMonitor);
  const authLink = createAuthLink(options.sessionManager);
  const retryLink = createRetryLink(defaultRetryPolicy);
  const errorMappingLink = createErrorMappingLink(options.errorMapper);

  // TODO(persisted-queries): Implémenter les requêtes persistées avec hachage SHA-256

  const httpLink = new HttpLink({
    uri: options.config.gatewayUrl,
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
  });
};
