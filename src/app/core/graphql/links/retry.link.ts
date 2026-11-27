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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const executeWithRetry = (observer: any): (() => void) => {
      let activeSub = forward(operation).subscribe({
        next: (value) => {
          observer.next?.(value);
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
                  observer.next?.(val);
                },
                error: (retryErr) => {
                  observer.error?.(retryErr);
                },
                complete: () => {
                  observer.complete?.();
                },
              });
            }, delay);
          } else {
            observer.error?.(err);
          }
        },
        complete: () => {
          observer.complete?.();
        },
      });

      return () => activeSub.unsubscribe();
    };

    return new Observable((observer) => executeWithRetry(observer));
  });
};
