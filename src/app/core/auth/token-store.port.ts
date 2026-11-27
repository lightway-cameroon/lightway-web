import { InjectionToken } from '@angular/core';
import { Session } from './session';

export interface TokenStore {
  get(): Session | null;
  set(s: Session | null): void;
}

export const TOKEN_STORE = new InjectionToken<TokenStore>('TOKEN_STORE');
