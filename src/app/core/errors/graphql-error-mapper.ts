import { Injectable } from '@angular/core';
import { AppError } from './app-error';
import { ErrorCode } from './error-code';
import { ErrorMapper } from './error-mapper.port';

const RETRYABLE_CODES = new Set<ErrorCode>(['NETWORK', 'TIMEOUT', 'RATE_LIMITED']);

const ERROR_SEVERITY: Record<string, number> = {
  UNAUTHENTICATED: 4,
  FORBIDDEN: 3,
  VALIDATION_FAILED: 2,
};

interface GraphQLErrorExtension {
  code?: string;
  fields?: Record<string, string[]>;
  traceId?: string;
  [key: string]: unknown;
}

interface GraphQLErrorLike {
  message?: string;
  extensions?: GraphQLErrorExtension;
}

interface ApolloErrorLike {
  graphQLErrors?: GraphQLErrorLike[];
  networkError?: Error | { name?: string; message?: string } | null;
  name?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class GraphqlErrorMapper implements ErrorMapper {
  map(error: unknown): AppError {
    // 1. AppError already
    if (error instanceof AppError) {
      return error;
    }

    const err = error as ApolloErrorLike;

    // 2. Apollo Error with graphQLErrors
    if (err && Array.isArray(err.graphQLErrors) && err.graphQLErrors.length > 0) {
      // Pick highest severity error
      const sortedErrors = [...err.graphQLErrors].sort((a, b) => {
        const severityA = ERROR_SEVERITY[a.extensions?.code ?? ''] ?? 1;
        const severityB = ERROR_SEVERITY[b.extensions?.code ?? ''] ?? 1;
        return severityB - severityA;
      });

      const primary = sortedErrors[0];
      const rawCode = primary.extensions?.code;
      const code = this.normalizeCode(rawCode);
      const fields = primary.extensions?.fields;
      const traceId = primary.extensions?.traceId;

      return new AppError(code, `errors.${code}`, {
        fields,
        traceId,
        retryable: RETRYABLE_CODES.has(code),
        cause: error,
      });
    }

    // 3. Network error
    if (err?.networkError) {
      const netErr = err.networkError;
      if (netErr.name === 'AbortError' || netErr.name === 'TimeoutError') {
        return new AppError('TIMEOUT', 'errors.TIMEOUT', {
          retryable: true,
          cause: error,
        });
      }
      return new AppError('NETWORK', 'errors.NETWORK', {
        retryable: true,
        cause: error,
      });
    }

    // 4. AbortError / Timeout
    if (
      err?.name === 'AbortError' ||
      err?.name === 'TimeoutError' ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('timeout'))
    ) {
      return new AppError('TIMEOUT', 'errors.TIMEOUT', {
        retryable: true,
        cause: error,
      });
    }

    // 5. Unknown
    return new AppError('UNKNOWN', 'errors.UNKNOWN', {
      retryable: false,
      cause: error,
    });
  }

  private normalizeCode(rawCode?: string): ErrorCode {
    switch (rawCode) {
      case 'NETWORK_OFFLINE':
      case 'NETWORK':
      case 'TIMEOUT':
      case 'UNAUTHENTICATED':
      case 'FORBIDDEN':
      case 'VALIDATION_FAILED':
      case 'NOT_FOUND':
      case 'CONFLICT':
      case 'RATE_LIMITED':
      case 'INTERNAL':
        return rawCode;
      default:
        return 'UNKNOWN';
    }
  }
}
