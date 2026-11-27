import { InjectionToken } from '@angular/core';
import { AppError } from './app-error';

export interface ErrorMapper {
  map(error: unknown): AppError;
}

export const ERROR_MAPPER = new InjectionToken<ErrorMapper>('ERROR_MAPPER');
