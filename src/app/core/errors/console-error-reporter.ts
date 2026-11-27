import { inject, Injectable } from '@angular/core';
import { AppError } from './app-error';
import { ErrorReporter } from './error-reporter.port';
import { LOGGER } from '../logging/logger.port';

@Injectable({ providedIn: 'root' })
export class ConsoleErrorReporter implements ErrorReporter {
  private readonly logger = inject(LOGGER);

  report(error: AppError, context?: Record<string, unknown>): void {
    this.logger.error(`[AppError: ${error.code}] ${error.messageKey}`, {
      code: error.code,
      messageKey: error.messageKey,
      traceId: error.traceId,
      fields: error.fields,
      ...context,
    });
  }
}
