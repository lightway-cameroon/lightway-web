import { ApolloLink, Observable } from '@apollo/client/core';
import { RetryPolicy } from '../../time/retry-policy';
import { ErrorCode } from '../../errors/error-code';

export const createRetryLink = (retryPolicy: RetryPolicy): ApolloLink => {
  return new ApolloLink((operation, forward) => {
    let attempt = 0;
    const isMutation = operation.query.definitions.some(
      (def) => def.kind === 'OperationDefinition' && def.operation === 'mutation',
    );
    const clientMutationId = operation.variables?.['clientMutationId'] as string | undefined;

    const executeWithRetry = (
      observer: Parameters<Observable<unknown>['subscribe']>[0],
    ): (() => void) => {
      let activeSub = forward(operation).subscribe({
        next: (value) => {
          if (typeof observer === 'object' && observer?.next) {
            observer.next(value);
          }
        },
        error: (err) => {
          attempt++;
          const rawCode = (err.extensions?.code ?? 'NETWORK') as ErrorCode;
          const retryable = retryPolicy.isRetryable(
            { code: rawCode },
            isMutation,
            clientMutationId,
          );

          const delay = retryable ? retryPolicy.nextDelayMs(attempt) : null;

          if (delay !== null) {
            setTimeout(() => {
              activeSub.unsubscribe();
              activeSub = forward(operation).subscribe({
                next: (val) => {
                  if (typeof observer === 'object' && observer?.next) {
                    observer.next(val);
                  }
                },
                error: (retryErr) => {
                  if (typeof observer === 'object' && observer?.error) {
                    observer.error(retryErr);
                  }
                },
                complete: () => {
                  if (typeof observer === 'object' && observer?.complete) {
                    observer.complete();
                  }
                },
              });
            }, delay);
          } else {
            if (typeof observer === 'object' && observer?.error) {
              observer.error(err);
            }
          }
        },
        complete: () => {
          if (typeof observer === 'object' && observer?.complete) {
            observer.complete();
          }
        },
      });

      return () => activeSub.unsubscribe();
    };

    return new Observable((observer) => executeWithRetry(observer));
  });
};
