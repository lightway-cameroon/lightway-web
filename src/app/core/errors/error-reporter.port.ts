import { InjectionToken } from '@angular/core';
import { AppError } from './app-error';

export interface ErrorReporter {
  report(error: AppError, context?: Record<string, unknown>): void;
}

export const ERROR_REPORTER = new InjectionToken<ErrorReporter>('ERROR_REPORTER');
