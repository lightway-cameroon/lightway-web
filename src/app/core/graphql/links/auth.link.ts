import { ApolloLink, Observable } from '@apollo/client/core';
import { SessionManager } from '../../auth/session-manager';

export const createAuthLink = (sessionManager: SessionManager): ApolloLink => {
  return new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      let activeSub: { unsubscribe: () => void } | null = null;

      sessionManager
        .getValidAccessToken()
        .then((token) => {
          if (token) {
            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                authorization: `Bearer ${token}`,
              },
            }));
          }

          let isRetrying = false;

          activeSub = forward(operation).subscribe({
            next: (result) => {
              const hasUnauthenticated = result.errors?.some(
                (e) => e.extensions?.['code'] === 'UNAUTHENTICATED',
              );

              if (hasUnauthenticated) {
                const alreadyRetried = operation.getContext()['_isAuthRetry'];
                if (!alreadyRetried) {
                  isRetrying = true;
                  operation.setContext({ _isAuthRetry: true });
                  sessionManager
                    .refreshSingleFlight()
                    .then((newToken) => {
                      if (newToken) {
                        operation.setContext(({ headers = {} }) => ({
                          headers: {
                            ...headers,
                            authorization: `Bearer ${newToken}`,
                          },
                        }));
                        const retrySub = forward(operation).subscribe({
                          next: (r) => observer.next(r),
                          error: (e) => observer.error(e),
                          complete: () => observer.complete(),
                        });
                        activeSub = retrySub;
                      } else {
                        observer.next(result);
                        observer.complete();
                      }
                    })
                    .catch(() => {
                      observer.next(result);
                      observer.complete();
                    });
                  return;
                }
              }

              observer.next(result);
            },
            error: (networkErr) => observer.error(networkErr),
            complete: () => {
              if (!isRetrying) {
                observer.complete();
              }
            },
          });
        })
        .catch((err) => observer.error(err));

      return () => activeSub?.unsubscribe();
    });
  });
};
