import { describe, it, expect } from 'vitest';
import { createConnectivityLink } from './connectivity.link';
import { FakeConnectivityMonitor } from '../../testing/fake-connectivity-monitor';
import { ApolloLink, execute, gql, Observable } from '@apollo/client/core';
import { AppError } from '../../errors/app-error';

describe('connectivityLink', () => {
  it('échoue immédiatement avec AppError(NETWORK_OFFLINE) en OFFLINE sans appel réseau', async () => {
    const monitor = new FakeConnectivityMonitor();
    monitor.setStatus('OFFLINE');

    let forwarded = false;
    const mockForwardLink = new ApolloLink(() => {
      forwarded = true;
      return new Observable((observer) => {
        observer.next({ data: {} });
        observer.complete();
      });
    });

    const link = createConnectivityLink(monitor).concat(mockForwardLink);

    let caughtError: unknown = null;
    await new Promise<void>((resolve) => {
      execute(
        link,
        {
          query: gql`
            query Test {
              test
            }
          `,
        },
        {} as never,
      ).subscribe({
        next: () => undefined,
        error: (err) => {
          caughtError = err;
          resolve();
        },
        complete: () => resolve(),
      });
    });

    expect(forwarded).toBe(false);
    expect(caughtError).toBeInstanceOf(AppError);
    expect((caughtError as AppError).code).toBe('NETWORK_OFFLINE');
  });
});
