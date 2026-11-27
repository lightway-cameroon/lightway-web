import { InjectionToken } from '@angular/core';

export type Permission = 'accounts.read' | 'accounts.write' | 'accounts.createAdmin' | 'audit.read';

export interface PermissionPolicy {
  can(permission: Permission): boolean;
}

export const PERMISSION_POLICY = new InjectionToken<PermissionPolicy>('PERMISSION_POLICY');
