import { ApolloLink } from '@apollo/client/core';
import { IdGenerator } from '../../time/id-generator.port';

export const createRequestIdLink = (idGenerator: IdGenerator): ApolloLink => {
  return new ApolloLink((operation, forward) => {
    const requestId = idGenerator.uuid();
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        'x-request-id': requestId,
      },
    }));
    return forward(operation);
  });
};
