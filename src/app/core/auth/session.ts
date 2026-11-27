import { Role } from './role';

export interface SessionUser {
  readonly id: string;
  readonly role: Role;
  readonly displayName: string;
}

export interface Session {
  readonly accessToken: string;
  readonly expiresAt: Date;
  readonly user: SessionUser;
}
