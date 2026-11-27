import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SessionManager } from './session-manager';
import { TOKEN_STORE } from './token-store.port';
import { AUTH_GATEWAY } from './auth-gateway.port';
import { MemoryTokenStore } from './memory-token-store';
import { NOTIFIER } from '../notifications/notifier.port';
import { FakeNotifier } from '../testing/fake-notifier';
import { CLOCK } from '../time/clock.port';
import { FakeClock } from '../testing/fake-clock';
import { fail, ok } from '../errors/app-error';
import { Session } from './session';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let tokenStore: MemoryTokenStore;
  let fakeClock: FakeClock;
  let fakeNotifier: FakeNotifier;
  let mockAuthGateway: {
    login: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
    url: string;
  };

  beforeEach(() => {
    tokenStore = new MemoryTokenStore();
    fakeClock = new FakeClock(new Date('2026-01-01T00:00:00.000Z'));
    fakeNotifier = new FakeNotifier();
    mockRouter = {
      navigate: vi.fn(),
      url: '/accounts',
    };
    mockAuthGateway = {
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn().mockResolvedValue(ok(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        SessionManager,
        { provide: TOKEN_STORE, useValue: tokenStore },
        { provide: AUTH_GATEWAY, useValue: mockAuthGateway },
        { provide: NOTIFIER, useValue: fakeNotifier },
        { provide: CLOCK, useValue: fakeClock },
        { provide: Router, useValue: mockRouter },
      ],
    });

    sessionManager = TestBed.inject(SessionManager);
  });

  it('renouvellement en vol unique (single-flight : 2 appels simultanés -> 1 seul refresh)', async () => {
    const refreshedSession: Session = {
      accessToken: 'refreshed-token',
      expiresAt: new Date('2026-01-01T01:30:00.000Z'),
      user: { id: 'u1', role: 'ADMIN', displayName: 'Admin User' },
    };

    mockAuthGateway.refresh.mockResolvedValue(ok(refreshedSession));

    // Call single flight twice simultaneously
    const p1 = sessionManager.refreshSingleFlight();
    const p2 = sessionManager.refreshSingleFlight();

    const [t1, t2] = await Promise.all([p1, p2]);

    expect(mockAuthGateway.refresh).toHaveBeenCalledTimes(1);
    expect(t1).toBe('refreshed-token');
    expect(t2).toBe('refreshed-token');
  });

  it('renouvelle automatiquement quand expiresAt - now < 60s', async () => {
    // Session expiring in 30 seconds
    const expiringSession: Session = {
      accessToken: 'expiring-token',
      expiresAt: new Date('2026-01-01T00:00:30.000Z'),
      user: { id: 'u1', role: 'ADMIN', displayName: 'Admin User' },
    };

    const newSession: Session = {
      accessToken: 'renewed-token',
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
      user: { id: 'u1', role: 'ADMIN', displayName: 'Admin User' },
    };

    tokenStore.set(expiringSession);
    mockAuthGateway.refresh.mockResolvedValue(ok(newSession));

    // Must trigger refresh
    const token = await sessionManager.getValidAccessToken();

    expect(mockAuthGateway.refresh).toHaveBeenCalledTimes(1);
    expect(token).toBe('renewed-token');
  });

  it('échec de renouvellement avec UNAUTHENTICATED vide la session et redirige vers /login', async () => {
    const expiredSession: Session = {
      accessToken: 'expired-token',
      expiresAt: new Date('2026-01-01T00:00:10.000Z'),
      user: { id: 'u1', role: 'ADMIN', displayName: 'Admin' },
    };

    tokenStore.set(expiredSession);
    mockAuthGateway.refresh.mockResolvedValue(
      fail({ code: 'UNAUTHENTICATED', messageKey: 'errors.UNAUTHENTICATED' }),
    );

    const token = await sessionManager.getValidAccessToken();

    expect(token).toBeNull();
    expect(sessionManager.isAuthenticated()).toBe(false);
    expect(fakeNotifier.notifications[0]?.messageKey).toBe('auth.sessionExpired');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/accounts' },
    });
  });
});
