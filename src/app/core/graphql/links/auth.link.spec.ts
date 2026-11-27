import { describe, it, expect, vi } from 'vitest';
import { createAuthLink } from './auth.link';
import { ApolloLink, execute, gql, Observable } from '@apollo/client/core';
import { SessionManager } from '../../auth/session-manager';

describe('authLink', () => {
  it('effectue un seul rejeu après UNAUTHENTICATED', async () => {
    let callCount = 0;
    const sessionManagerMock = {
      getValidAccessToken: vi.fn().mockResolvedValue('initial-token'),
      refreshSingleFlight: vi.fn().mockResolvedValue('new-token'),
    } as unknown as SessionManager;

    const mockForwardLink = new ApolloLink(() => {
      callCount++;
      return new Observable((observer) => {
        if (callCount === 1) {
          observer.next({
            errors: [
              {
                message: 'Invalid token',
                extensions: { code: 'UNAUTHENTICATED' },
              },
            ],
          });
        } else {
          observer.next({ data: { hello: 'world' } });
        }
        observer.complete();
      });
    });

    const link = createAuthLink(sessionManagerMock).concat(mockForwardLink);

    const result = await new Promise((resolve) => {
      execute(
        link,
        {
          query: gql`
            query Test {
              hello
            }
          `,
        },
        {} as never,
      ).subscribe({
        next: (res) => resolve(res),
      });
    });

    expect(callCount).toBe(2);
    expect(sessionManagerMock.refreshSingleFlight).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: { hello: 'world' } });
  });
});
