import { Injectable } from '@angular/core';
import { Session } from './session';
import { TokenStore } from './token-store.port';

@Injectable({ providedIn: 'root' })
export class MemoryTokenStore implements TokenStore {
  private session: Session | null = null;

  get(): Session | null {
    return this.session;
  }

  set(s: Session | null): void {
    this.session = s;
  }
}
