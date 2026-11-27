import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { SessionManager } from './session-manager';

export const authGuard: CanMatchFn & CanActivateFn = async (route, segments) => {
  const sessionManager = inject(SessionManager);
  const router = inject(Router);

  // If already authenticated with valid token
  const token = await sessionManager.getValidAccessToken();
  if (token) {
    return true;
  }

  // Construct returnUrl
  const returnUrl = segments ? '/' + segments.map((s) => s.path).join('/') : router.url;

  return router.createUrlTree(['/login'], {
    queryParams: returnUrl && returnUrl !== '/' ? { returnUrl } : undefined,
  });
};
