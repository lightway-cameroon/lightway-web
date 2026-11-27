import { ApolloLink, Observable } from '@apollo/client/core';
import { ErrorMapper } from '../../errors/error-mapper.port';

export const createErrorMappingLink = (errorMapper: ErrorMapper): ApolloLink => {
  return new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      const sub = forward(operation).subscribe({
        next: (result) => {
          if (result.errors && result.errors.length > 0) {
            const appError = errorMapper.map({ graphQLErrors: result.errors });
            observer.error(appError);
            return;
          }
          observer.next(result);
        },
        error: (err) => {
          const appError = errorMapper.map(err);
          observer.error(appError);
        },
        complete: () => observer.complete(),
      });

      return () => sub.unsubscribe();
    });
  });
};
