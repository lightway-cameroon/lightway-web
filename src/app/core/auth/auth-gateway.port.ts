import { InjectionToken } from '@angular/core';
import { Session } from './session';
import { Result } from '../errors/app-error';

export interface AuthGateway {
  login(email: string, password: string): Promise<Result<Session>>;
  refresh(): Promise<Result<Session>>; // uses HttpOnly cookie
  logout(): Promise<Result<void>>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
