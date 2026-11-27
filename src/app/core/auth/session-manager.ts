import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from './session';
import { Role } from './role';
import { TOKEN_STORE } from './token-store.port';
import { AUTH_GATEWAY } from './auth-gateway.port';
import { CACHE_RESETTER } from '../graphql/graphql-executor.port';
import { NOTIFIER } from '../notifications/notifier.port';
import { CLOCK } from '../time/clock.port';
import { Result } from '../errors/app-error';

@Injectable({ providedIn: 'root' })
export class SessionManager {
  private readonly tokenStore = inject(TOKEN_STORE);
  private readonly authGateway = inject(AUTH_GATEWAY);
  private readonly cacheResetter = inject(CACHE_RESETTER, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private readonly notifier = inject(NOTIFIER, { optional: true });
  private readonly clock = inject(CLOCK, { optional: true });

  private readonly _session = signal<Session | null>(this.tokenStore.get());
  readonly session: Signal<Session | null> = this._session.asReadonly();
  readonly isAuthenticated: Signal<boolean> = computed(() => this._session() !== null);
  readonly role: Signal<Role | null> = computed(() => this._session()?.user.role ?? null);

  private refreshPromise: Promise<string | null> | null = null;

  async restore(): Promise<void> {
    try {
      const res = await this.authGateway.refresh();
      if (res.ok) {
        this.setSession(res.value);
      } else {
        this.setSession(null);
      }
    } catch {
      this.setSession(null);
    }
  }

  async login(email: string, password: string): Promise<Result<Session>> {
    const res = await this.authGateway.login(email, password);
    if (res.ok) {
      this.setSession(res.value);
    }
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.authGateway.logout();
    } finally {
      this.setSession(null);
      if (this.cacheResetter) {
        await this.cacheResetter.reset();
      }
      this.router?.navigate(['/login']);
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    const current = this._session() ?? this.tokenStore.get();
    if (!current) {
      return null;
    }
    if (!this._session()) {
      this._session.set(current);
    }

    const now = this.clock ? this.clock.now().getTime() : Date.now();
    const expiresAt = current.expiresAt.getTime();

    // If session expires in less than 60 seconds, trigger refresh
    if (expiresAt - now < 60_000) {
      return this.refreshSingleFlight();
    }

    return current.accessToken;
  }

  refreshSingleFlight(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const res = await this.authGateway.refresh();
      if (res.ok) {
        this.setSession(res.value);
        return res.value.accessToken;
      }

      if (res.error?.code === 'UNAUTHENTICATED') {
        this.handleSessionExpired();
      }
      return null;
    } catch {
      return null;
    }
  }

  private handleSessionExpired(): void {
    this.setSession(null);
    this.notifier?.error('auth.sessionExpired');

    const returnUrl = this.router?.url && this.router.url !== '/login' ? this.router.url : '/';

    this.router?.navigate(['/login'], {
      queryParams: { returnUrl },
    });
  }

  private setSession(session: Session | null): void {
    this.tokenStore.set(session);
    this._session.set(session);
  }
}
