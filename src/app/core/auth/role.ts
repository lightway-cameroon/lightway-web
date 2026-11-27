export type Role = 'CONDUCTEUR' | 'ADMIN' | 'SUPER_ADMIN';

export const ROLE_RANK: Record<Role, number> = {
  CONDUCTEUR: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
};

export const hasAtLeast = (actual: Role, required: Role): boolean =>
  ROLE_RANK[actual] >= ROLE_RANK[required];
