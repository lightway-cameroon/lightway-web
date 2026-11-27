import { describe, it, expect } from 'vitest';
import { ConsoleLogger } from './console-logger';

describe('ConsoleLogger', () => {
  const logger = new ConsoleLogger();

  it('scrubs sensitive keys (password, token, accessToken, refreshToken, email) from context', () => {
    const context = {
      user: {
        id: '123',
        email: 'user@example.com',
      },
      password: 'supersecretpassword',
      token: 'jwt.token.value',
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
      safeData: 'allowed-info',
    };

    const sanitized = logger.sanitize(context);

    expect(sanitized).toEqual({
      user: {
        id: '123',
        email: '[REDACTED]',
      },
      password: '[REDACTED]',
      token: '[REDACTED]',
      accessToken: '[REDACTED]',
      refreshToken: '[REDACTED]',
      safeData: 'allowed-info',
    });
  });

  it('handles undefined context gracefully', () => {
    expect(logger.sanitize(undefined)).toBeUndefined();
  });
});
