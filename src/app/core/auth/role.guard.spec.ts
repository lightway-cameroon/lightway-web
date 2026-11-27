import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { roleGuard } from './role.guard';
import { SessionManager } from './session-manager';
import { Role } from './role';
import { signal } from '@angular/core';
import { UrlTree } from '@angular/router';

describe('roleGuard', () => {
  const currentRoleSignal = signal<Role | null>(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SessionManager,
          useValue: {
            role: currentRoleSignal,
          },
        },
      ],
    });
  });

  it('autorise un ADMIN pour une route demandant ADMIN', () => {
    currentRoleSignal.set('ADMIN');
    const guard = roleGuard('ADMIN');
    const result = TestBed.runInInjectionContext(() => guard({} as never, [], {} as never));
    expect(result).toBe(true);
  });

  it('autorise un SUPER_ADMIN pour une route demandant ADMIN', () => {
    currentRoleSignal.set('SUPER_ADMIN');
    const guard = roleGuard('ADMIN');
    const result = TestBed.runInInjectionContext(() => guard({} as never, [], {} as never));
    expect(result).toBe(true);
  });

  it('refuse un ADMIN pour une route demandant SUPER_ADMIN et renvoie vers /forbidden', () => {
    currentRoleSignal.set('ADMIN');
    const guard = roleGuard('SUPER_ADMIN');
    const result = TestBed.runInInjectionContext(() => guard({} as never, [], {} as never));
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/forbidden');
  });
});
