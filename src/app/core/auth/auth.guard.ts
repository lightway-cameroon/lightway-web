import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlSegment } from '@angular/router';
import { SessionManager } from './session-manager';

export const authGuard: CanMatchFn & CanActivateFn = async (route, segmentsOrSnapshot) => {
  const sessionManager = inject(SessionManager);
  const router = inject(Router);

  // If already authenticated with valid token
  const token = await sessionManager.getValidAccessToken();
  if (token) {
    return true;
  }

  // Construct returnUrl
  let returnUrl: string | undefined;
  if (Array.isArray(segmentsOrSnapshot)) {
    returnUrl = '/' + (segmentsOrSnapshot as UrlSegment[]).map((s) => s.path).join('/');
  } else if (segmentsOrSnapshot && 'url' in segmentsOrSnapshot) {
    returnUrl = (segmentsOrSnapshot as { url: string }).url;
  } else {
    returnUrl = router.url;
  }

  return router.createUrlTree(['/login'], {
    queryParams: returnUrl && returnUrl !== '/' ? { returnUrl } : undefined,
  });
};
