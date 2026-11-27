import { Routes } from '@angular/router';
import { authGuard } from './core/auth';
import { ShellComponent } from './layout/shell.component';
import ForbiddenPage from './core/errors/pages/forbidden.page';
import NotFoundPage from './core/errors/pages/not-found.page';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'forbidden',
    component: ForbiddenPage,
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'accounts',
      },
      {
        path: 'accounts',
        loadChildren: () => import('./features/accounts/accounts.routes').then((m) => m.routes),
      },
      {
        path: 'audit',
        loadChildren: () => import('./features/audit/audit.routes').then((m) => m.routes),
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then((m) => m.routes),
      },
    ],
  },
  {
    path: '**',
    component: NotFoundPage,
  },
];
