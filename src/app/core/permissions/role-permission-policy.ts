import { inject, Injectable } from '@angular/core';
import { Permission, PermissionPolicy } from './permission-policy.port';
import { SessionManager } from '../auth/session-manager';

const ADMIN_PERMISSIONS = new Set<Permission>(['accounts.read', 'accounts.write', 'audit.read']);

@Injectable({ providedIn: 'root' })
export class RolePermissionPolicy implements PermissionPolicy {
  private readonly sessionManager = inject(SessionManager);

  can(permission: Permission): boolean {
    const role = this.sessionManager.role();
    if (!role) return false;

    if (role === 'SUPER_ADMIN') {
      return true;
    }

    if (role === 'ADMIN') {
      return ADMIN_PERMISSIONS.has(permission);
    }

    return false;
  }
}
