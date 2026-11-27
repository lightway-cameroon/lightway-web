import { describe, it, expect } from 'vitest';
import { GraphqlErrorMapper } from './graphql-error-mapper';
import { AppError } from './app-error';

describe('GraphqlErrorMapper', () => {
  const mapper = new GraphqlErrorMapper();

  it('returns existing AppError unchanged', () => {
    const original = new AppError('FORBIDDEN', 'errors.FORBIDDEN');
    const result = mapper.map(original);
    expect(result).toBe(original);
    expect(result.code).toBe('FORBIDDEN');
    expect(result.messageKey).toBe('errors.FORBIDDEN');
  });

  it('maps single GraphQL error by extension code', () => {
    const error = {
      graphQLErrors: [
        {
          message: 'Access denied',
          extensions: {
            code: 'FORBIDDEN',
            traceId: 'trace-123',
          },
        },
      ],
    };

    const result = mapper.map(error);
    expect(result.code).toBe('FORBIDDEN');
    expect(result.messageKey).toBe('errors.FORBIDDEN');
    expect(result.traceId).toBe('trace-123');
    expect(result.retryable).toBe(false);
  });

  it('prioritizes UNAUTHENTICATED > FORBIDDEN > VALIDATION_FAILED > others when multiple errors exist', () => {
    const error = {
      graphQLErrors: [
        {
          message: 'Invalid input',
          extensions: { code: 'VALIDATION_FAILED' },
        },
        {
          message: 'Not logged in',
          extensions: { code: 'UNAUTHENTICATED' },
        },
        {
          message: 'Forbidden action',
          extensions: { code: 'FORBIDDEN' },
        },
      ],
    };

    const result = mapper.map(error);
    expect(result.code).toBe('UNAUTHENTICATED');
    expect(result.messageKey).toBe('errors.UNAUTHENTICATED');
  });

  it('maps VALIDATION_FAILED with field errors', () => {
    const error = {
      graphQLErrors: [
        {
          message: 'Validation failed',
          extensions: {
            code: 'VALIDATION_FAILED',
            fields: {
              email: ['Invalid email format'],
              password: ['Too short'],
            },
          },
        },
      ],
    };

    const result = mapper.map(error);
    expect(result.code).toBe('VALIDATION_FAILED');
    expect(result.fields).toEqual({
      email: ['Invalid email format'],
      password: ['Too short'],
    });
  });

  it('marks NETWORK, TIMEOUT and RATE_LIMITED as retryable', () => {
    const rateLimitError = {
      graphQLErrors: [{ message: 'Too many requests', extensions: { code: 'RATE_LIMITED' } }],
    };
    expect(mapper.map(rateLimitError).retryable).toBe(true);

    const networkError = { networkError: new Error('Failed to fetch') };
    expect(mapper.map(networkError).code).toBe('NETWORK');
    expect(mapper.map(networkError).retryable).toBe(true);

    const timeoutError = { networkError: { name: 'TimeoutError', message: 'Timed out' } };
    expect(mapper.map(timeoutError).code).toBe('TIMEOUT');
    expect(mapper.map(timeoutError).retryable).toBe(true);
  });

  it('maps AbortError to TIMEOUT', () => {
    const abortError = { name: 'AbortError', message: 'The user aborted a request.' };
    const result = mapper.map(abortError);
    expect(result.code).toBe('TIMEOUT');
    expect(result.messageKey).toBe('errors.TIMEOUT');
    expect(result.retryable).toBe(true);
  });

  it('maps unknown errors to UNKNOWN', () => {
    const result = mapper.map('something bad happened');
    expect(result.code).toBe('UNKNOWN');
    expect(result.messageKey).toBe('errors.UNKNOWN');
    expect(result.retryable).toBe(false);
  });
});
