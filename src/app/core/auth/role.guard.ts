import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SessionManager } from './session-manager';
import { hasAtLeast, Role } from './role';

export const roleGuard = (required: Role): CanMatchFn => {
  return () => {
    const sessionManager = inject(SessionManager);
    const router = inject(Router);

    const actualRole = sessionManager.role();
    if (actualRole && hasAtLeast(actualRole, required)) {
      return true;
    }

    return router.createUrlTree(['/forbidden']);
  };
};
