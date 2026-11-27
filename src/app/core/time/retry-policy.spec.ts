import { describe, it, expect } from 'vitest';
import { DefaultRetryPolicy } from './retry-policy';

describe('DefaultRetryPolicy', () => {
  const policy = new DefaultRetryPolicy();

  it('provides delays for attempts 1, 2, 3 with 20% jitter and null thereafter', () => {
    const delay1 = policy.nextDelayMs(1);
    expect(delay1).toBeGreaterThanOrEqual(400 * 0.8);
    expect(delay1).toBeLessThanOrEqual(400 * 1.2);

    const delay2 = policy.nextDelayMs(2);
    expect(delay2).toBeGreaterThanOrEqual(1200 * 0.8);
    expect(delay2).toBeLessThanOrEqual(1200 * 1.2);

    const delay3 = policy.nextDelayMs(3);
    expect(delay3).toBeGreaterThanOrEqual(3000 * 0.8);
    expect(delay3).toBeLessThanOrEqual(3000 * 1.2);

    expect(policy.nextDelayMs(4)).toBeNull();
    expect(policy.nextDelayMs(0)).toBeNull();
  });

  it('allows retry for queries on NETWORK, TIMEOUT and RATE_LIMITED', () => {
    expect(policy.isRetryable({ code: 'NETWORK' }, false)).toBe(true);
    expect(policy.isRetryable({ code: 'TIMEOUT' }, false)).toBe(true);
    expect(policy.isRetryable({ code: 'RATE_LIMITED' }, false)).toBe(true);
    expect(policy.isRetryable({ code: 'FORBIDDEN' }, false)).toBe(false);
  });

  it('never retries a mutation without clientMutationId', () => {
    expect(policy.isRetryable({ code: 'NETWORK' }, true)).toBe(false);
    expect(policy.isRetryable({ code: 'NETWORK' }, true, undefined)).toBe(false);
    expect(policy.isRetryable({ code: 'NETWORK' }, true, 'uuid-123')).toBe(true);
  });
});
