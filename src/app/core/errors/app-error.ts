import { ErrorCode } from './error-code';

export interface AppErrorOptions {
  fields?: Record<string, string[]>;
  traceId?: string;
  retryable?: boolean;
  cause?: unknown;
}

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly messageKey: string,
    readonly options: AppErrorOptions = {},
  ) {
    super(code);
    this.name = 'AppError';
  }

  get fields(): Record<string, string[]> | undefined {
    return this.options.fields;
  }

  get traceId(): string | undefined {
    return this.options.traceId;
  }

  get retryable(): boolean {
    return this.options.retryable ?? false;
  }
}

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = <E = AppError>(error: E): Result<never, E> => ({ ok: false, error });
