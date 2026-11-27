import { inject, Injectable } from '@angular/core';
import { AuthGateway } from './auth-gateway.port';
import { Session } from './session';
import { fail, ok, Result } from '../errors/app-error';
import { APP_CONFIG } from '../config/app-config.token';
import { ERROR_MAPPER } from '../errors/error-mapper.port';
import { ID_GENERATOR } from '../time/id-generator.port';

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      session {
        accessToken
        expiresAt
        user {
          id
          role
          displayName
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const REFRESH_MUTATION = `
  mutation RefreshSession($input: RefreshSessionInput!) {
    refreshSession(input: $input) {
      session {
        accessToken
        expiresAt
        user {
          id
          role
          displayName
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const LOGOUT_MUTATION = `
  mutation Logout($input: LogoutInput!) {
    logout(input: $input) {
      success
      userErrors {
        field
        message
        code
      }
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class GraphqlAuthGateway implements AuthGateway {
  private readonly config = inject(APP_CONFIG, { optional: true });
  private readonly errorMapper = inject(ERROR_MAPPER, { optional: true });
  private readonly idGenerator = inject(ID_GENERATOR, { optional: true });

  async login(email: string, password: string): Promise<Result<Session>> {
    return this.executeOperation<{ login: { session: Session } }>(LOGIN_MUTATION, {
      input: {
        email,
        password,
        clientType: 'WEB',
      },
    }).then((res) => {
      if (!res.ok) return res;
      const rawSession = res.value.login.session;
      const session: Session = {
        ...rawSession,
        expiresAt: new Date(rawSession.expiresAt),
      };
      return ok(session);
    });
  }

  async refresh(): Promise<Result<Session>> {
    return this.executeOperation<{ refreshSession: { session: Session } }>(REFRESH_MUTATION, {
      input: { clientType: 'WEB' },
    }).then((res) => {
      if (!res.ok) return res;
      const rawSession = res.value.refreshSession.session;
      const session: Session = {
        ...rawSession,
        expiresAt: new Date(rawSession.expiresAt),
      };
      return ok(session);
    });
  }

  async logout(): Promise<Result<void>> {
    return this.executeOperation<{ logout: { success: boolean } }>(LOGOUT_MUTATION, {
      input: { clientType: 'WEB' },
    }).then((res) => {
      if (!res.ok) return res;
      return ok(undefined);
    });
  }

  private async executeOperation<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<Result<T>> {
    const gatewayUrl = this.config?.gatewayUrl ?? '/graphql';
    const requestId = this.idGenerator ? this.idGenerator.uuid() : crypto.randomUUID();

    try {
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apollo-require-preflight': 'true',
          'x-request-id': requestId,
        },
        credentials: 'include',
        body: JSON.stringify({ query, variables }),
      });

      const body = await response.json();

      if (body.errors && body.errors.length > 0) {
        const error = this.errorMapper
          ? this.errorMapper.map({ graphQLErrors: body.errors })
          : new Error(body.errors[0]?.message);
        return fail(error as never);
      }

      if (!response.ok) {
        const error = this.errorMapper
          ? this.errorMapper.map({ networkError: new Error(`HTTP ${response.status}`) })
          : new Error(`HTTP ${response.status}`);
        return fail(error as never);
      }

      return ok(body.data as T);
    } catch (err) {
      const error = this.errorMapper ? this.errorMapper.map(err) : (err as Error);
      return fail(error as never);
    }
  }
}
