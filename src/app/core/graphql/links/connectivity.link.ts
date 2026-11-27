import { ApolloLink, Observable } from '@apollo/client/core';
import { ConnectivityMonitor } from '../../connectivity/connectivity-monitor.port';
import { AppError } from '../../errors/app-error';

export const createConnectivityLink = (connectivityMonitor: ConnectivityMonitor): ApolloLink => {
  return new ApolloLink((operation, forward) => {
    // If OFFLINE, fail immediately without network call
    if (connectivityMonitor.status() === 'OFFLINE') {
      return new Observable((observer) => {
        observer.error(new AppError('NETWORK_OFFLINE', 'errors.NETWORK_OFFLINE'));
      });
    }

    return new Observable((observer) => {
      const sub = forward(operation).subscribe({
        next: (result) => {
          connectivityMonitor.recordRequestSuccess();
          observer.next(result);
        },
        error: (err) => {
          const isTimeout =
            err.name === 'TimeoutError' ||
            err.name === 'AbortError' ||
            (typeof err.message === 'string' && err.message.toLowerCase().includes('timeout'));

          connectivityMonitor.recordRequestFailure(isTimeout ? 'TIMEOUT' : 'NETWORK');
          observer.error(err);
        },
        complete: () => observer.complete(),
      });

      return () => sub.unsubscribe();
    });
  });
};
