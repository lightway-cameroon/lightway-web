import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
import { ERROR_MAPPER } from './error-mapper.port';
import { ERROR_REPORTER } from './error-reporter.port';
import { NOTIFIER } from '../notifications/notifier.port';
import { CLOCK } from '../time/clock.port';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);
  private lastErrors = new Map<string, number>();

  handleError(error: unknown): void {
    const errorMapper = this.injector.get(ERROR_MAPPER, null);
    const errorReporter = this.injector.get(ERROR_REPORTER, null);
    const notifier = this.injector.get(NOTIFIER, null);
    const clock = this.injector.get(CLOCK, null);

    const now = clock ? clock.now().getTime() : Date.now();
    const appError = errorMapper ? errorMapper.map(error) : null;

    if (!appError) {
      console.error('[GlobalErrorHandler] Unmapped error:', error);
      return;
    }

    // Report all errors
    if (errorReporter) {
      errorReporter.report(appError);
    }

    // Do not notify for NETWORK_OFFLINE (handled by offline banner)
    if (appError.code === 'NETWORK_OFFLINE') {
      return;
    }

    // Deduplicate identical errors within 3000ms
    const dedupeKey = `${appError.code}:${appError.messageKey}`;
    const lastTimestamp = this.lastErrors.get(dedupeKey);
    if (lastTimestamp && now - lastTimestamp < 3000) {
      return;
    }
    this.lastErrors.set(dedupeKey, now);

    // Notify user
    if (notifier) {
      notifier.error(appError.messageKey);
    }
  }
}
